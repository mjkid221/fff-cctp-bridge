"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDragControls } from "motion/react";
import {
  useActiveWindow,
  useSetActiveWindow,
  useWindowPositions,
  useSetWindowPosition,
  useHasHydrated,
  validateOrResetPosition,
  getWindowDimensions,
  constrainToViewport,
} from "~/lib/bridge";
import type { FeeSummaryProps } from "./fee-summary.types";

export function useFeeSummaryState({ onClose }: FeeSummaryProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const activeWindow = useActiveWindow();
  const setActiveWindow = useSetActiveWindow();
  const windowPositions = useWindowPositions();
  const setWindowPosition = useSetWindowPosition();
  const hasHydrated = useHasHydrated();

  const isActive = activeWindow === "fee-details";
  const zIndex = isActive ? "z-20" : "z-10";

  // Get saved position and validate it's within viewport
  const defaultPosition = { x: 350, y: 100 };
  const dimensions = getWindowDimensions("fee-details", isMaximized);

  // Only use saved position after store has been hydrated from localStorage
  const savedPosition = hasHydrated
    ? windowPositions["fee-details"]
    : defaultPosition;
  const initialPosition = validateOrResetPosition(
    savedPosition,
    dimensions,
    defaultPosition,
  );

  // Track current position for spring-back animation
  const [currentPosition, setCurrentPosition] = useState(initialPosition);

  // Update current position when initial position changes
  useEffect(() => {
    setCurrentPosition(initialPosition);
  }, [initialPosition.x, initialPosition.y]);

  // Prevent text selection during drag
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    } else {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      const draggedPosition = {
        x: rect.left,
        y: rect.top,
      };

      const constrainedPosition = constrainToViewport(
        draggedPosition,
        dimensions,
      );

      setCurrentPosition(draggedPosition);

      if (
        draggedPosition.x !== constrainedPosition.x ||
        draggedPosition.y !== constrainedPosition.y
      ) {
        setTimeout(() => {
          setCurrentPosition(constrainedPosition);
        }, 0);
      }

      setWindowPosition("fee-details", constrainedPosition);
    }
  }, [dimensions, setWindowPosition]);

  const handleClose = useCallback(() => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      const newPosition = {
        x: rect.left,
        y: rect.top,
      };
      setWindowPosition("fee-details", newPosition);
    }
    onClose();
  }, [onClose, setWindowPosition]);

  const handleFocus = useCallback(() => {
    setActiveWindow("fee-details");
  }, [setActiveWindow]);

  return {
    windowRef,
    currentPosition,
    initialPosition,
    isMinimized,
    isMaximized,
    zIndex,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onClose: handleClose,
    onMinimize: () => setIsMinimized(!isMinimized),
    onMaximize: () => setIsMaximized(!isMaximized),
    onFocus: handleFocus,
    dragControls,
  };
}
