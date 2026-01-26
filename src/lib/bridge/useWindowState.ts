"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDragControls } from "motion/react";
import {
  useWindowPositions,
  useSetWindowPosition,
  useWindowZIndexes,
  useFocusWindow,
  useHasHydrated,
} from "./store";
import {
  validateOrResetPosition,
  getWindowDimensions,
  constrainToViewport,
  DEFAULT_WINDOW_POSITIONS,
} from "./window-utils";
import type { WindowType, WindowPosition } from "./window-utils";

/**
 * Options for the shared window state hook
 */
export interface UseWindowStateOptions {
  /** Window type identifier */
  windowType: WindowType;
  /** Callback when window is closed */
  onClose: () => void;
  /** Default position if none saved */
  defaultPosition?: WindowPosition;
  /** Whether window supports maximize */
  supportsMaximize?: boolean;
}

/**
 * Return type for the shared window state hook
 */
export interface WindowStateReturn {
  windowRef: React.RefObject<HTMLDivElement | null>;
  isMinimized: boolean;
  isMaximized: boolean;
  currentPosition: WindowPosition;
  initialPosition: WindowPosition;
  zIndex: number;
  dragControls: ReturnType<typeof useDragControls>;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
}

/**
 * Shared hook for macOS-style draggable window state management
 * Extracts common logic from window hooks (pong, disclaimer, transaction-history, stats)
 */
export function useWindowState({
  windowType,
  onClose,
  defaultPosition,
  supportsMaximize = false,
}: UseWindowStateOptions): WindowStateReturn {
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
  const zIndex = windowZIndexes[windowType];

  // Calculate positions
  const resolvedDefaultPosition =
    defaultPosition ?? DEFAULT_WINDOW_POSITIONS[windowType];
  const dimensions = getWindowDimensions(windowType, isMaximized);

  const savedPosition = hasHydrated
    ? windowPositions[windowType]
    : resolvedDefaultPosition;
  const initialPosition = validateOrResetPosition(
    savedPosition,
    dimensions,
    resolvedDefaultPosition,
  );

  const [currentPosition, setCurrentPosition] = useState(initialPosition);

  // Update current position when initial position changes
  useEffect(() => {
    setCurrentPosition(initialPosition);
  }, [initialPosition]);

  // Focus window on mount to give it highest z-index
  useEffect(() => {
    focusWindow(windowType);
  }, [focusWindow, windowType]);

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
    focusWindow(windowType);
  }, [focusWindow, windowType]);

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

      setWindowPosition(windowType, constrainedPosition);
    }
  }, [dimensions, setWindowPosition, windowType]);

  const handleClose = useCallback(() => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      setWindowPosition(windowType, { x: rect.left, y: rect.top });
    }
    onClose();
  }, [onClose, setWindowPosition, windowType]);

  const handleFocus = useCallback(() => {
    focusWindow(windowType);
  }, [focusWindow, windowType]);

  const handleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  const handleMaximize = useCallback(() => {
    if (supportsMaximize) {
      setIsMaximized((prev) => !prev);
    }
  }, [supportsMaximize]);

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
    onMinimize: handleMinimize,
    onMaximize: handleMaximize,
    onFocus: handleFocus,
  };
}
