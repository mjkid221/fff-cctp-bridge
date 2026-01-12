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
  DEFAULT_WINDOW_POSITIONS,
} from "~/lib/bridge";
import type { PongWindowProps } from "./pong.types";

export function usePongWindowState({ onClose }: PongWindowProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const windowPositions = useWindowPositions();
  const setWindowPosition = useSetWindowPosition();
  const windowZIndexes = useWindowZIndexes();
  const focusWindow = useFocusWindow();
  const hasHydrated = useHasHydrated();

  // Get z-index from unified store
  const zIndex = windowZIndexes.pong;

  const defaultPosition = DEFAULT_WINDOW_POSITIONS.pong;
  const dimensions = getWindowDimensions("pong", false);

  const savedPosition = hasHydrated ? windowPositions.pong : defaultPosition;
  const initialPosition = validateOrResetPosition(
    savedPosition,
    dimensions,
    defaultPosition,
  );

  const [currentPosition, setCurrentPosition] = useState(initialPosition);

  useEffect(() => {
    setCurrentPosition(initialPosition);
  }, [initialPosition.x, initialPosition.y]);

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
      const draggedPosition = { x: rect.left, y: rect.top };
      const constrainedPosition = constrainToViewport(
        draggedPosition,
        dimensions,
      );
      setCurrentPosition(draggedPosition);
      if (
        draggedPosition.x !== constrainedPosition.x ||
        draggedPosition.y !== constrainedPosition.y
      ) {
        setTimeout(() => setCurrentPosition(constrainedPosition), 0);
      }
      setWindowPosition("pong", constrainedPosition);
    }
  }, [dimensions, setWindowPosition]);

  const handleClose = useCallback(() => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      setWindowPosition("pong", { x: rect.left, y: rect.top });
    }
    onClose();
  }, [onClose, setWindowPosition]);

  const handleFocus = useCallback(() => {
    focusWindow("pong");
  }, [focusWindow]);

  return {
    windowRef,
    isMinimized,
    currentPosition,
    initialPosition,
    zIndex,
    dragControls,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onClose: handleClose,
    onMinimize: () => setIsMinimized(!isMinimized),
    onFocus: handleFocus,
  };
}
