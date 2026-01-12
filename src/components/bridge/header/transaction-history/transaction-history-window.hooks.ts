"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDragControls } from "motion/react";
import {
  useWindowPositions,
  useSetWindowPosition,
  useWindowZIndexes,
  useFocusWindow,
  useHasHydrated,
  validateOrResetPosition,
  getWindowDimensions,
  constrainToViewport,
} from "~/lib/bridge";
import type { TransactionHistoryWindowProps } from "./transaction-history.types";

export function useTransactionHistoryWindowState({
  onClose,
}: TransactionHistoryWindowProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const windowPositions = useWindowPositions();
  const setWindowPosition = useSetWindowPosition();
  const windowZIndexes = useWindowZIndexes();
  const focusWindow = useFocusWindow();
  const hasHydrated = useHasHydrated();

  // Get z-index from unified store
  const zIndex = windowZIndexes["transaction-history"];

  // Get saved position and validate it's within viewport
  const defaultPosition = { x: 100, y: 150 };
  const dimensions = getWindowDimensions("transaction-history", isMaximized);

  // Only use saved position after store has been hydrated from localStorage
  const savedPosition = hasHydrated
    ? windowPositions["transaction-history"]
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

      setWindowPosition("transaction-history", constrainedPosition);
    }
  }, [dimensions, setWindowPosition]);

  const handleClose = useCallback(() => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      const newPosition = {
        x: rect.left,
        y: rect.top,
      };
      setWindowPosition("transaction-history", newPosition);
    }
    onClose();
  }, [onClose, setWindowPosition]);

  const handleFocus = useCallback(() => {
    focusWindow("transaction-history");
  }, [focusWindow]);

  return {
    windowRef,
    isMinimized,
    isMaximized,
    currentPosition,
    initialPosition,
    zIndex,
    dragControls,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onClose: handleClose,
    onMinimize: () => setIsMinimized(!isMinimized),
    onMaximize: () => setIsMaximized(!isMaximized),
    onFocus: handleFocus,
  };
}
