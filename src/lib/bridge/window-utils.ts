/**
 * Window position utilities for draggable windows
 */

/** Height of the navbar in pixels (h-12 = 48px) */
export const NAVBAR_HEIGHT = 48;

/** Safe zone below navbar - windows cannot be dragged above this Y position */
export const NAVBAR_SAFE_ZONE = 60; // 48px navbar + 12px buffer

export interface WindowDimensions {
  width: number;
  height: number;
}

export interface WindowPosition {
  x: number;
  y: number;
}

/**
 * Adjusts window position to ensure it stays within viewport bounds
 * @param position - Current window position
 * @param dimensions - Window dimensions (width and height)
 * @param padding - Optional padding from viewport edges (default: 20)
 * @returns Adjusted position that keeps window visible
 */
export function constrainToViewport(
  position: WindowPosition,
  dimensions: WindowDimensions,
  padding = 20,
): WindowPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Minimum visible portion of window (in pixels)
  const minVisibleWidth = 100;
  const minVisibleHeight = 50;

  // Left constraint: Keep at least minVisibleWidth visible from the right
  // When dragging left, right edge must stay at least minVisibleWidth into viewport
  // rightEdge >= minVisibleWidth
  // x + dimensions.width >= minVisibleWidth
  // x >= minVisibleWidth - dimensions.width
  const minX = Math.max(
    padding, // Respect padding when window is mostly visible
    minVisibleWidth - dimensions.width, // Allow overhang when dragging left
  );

  // Right constraint: Keep at least minVisibleWidth visible from the left
  // When dragging right, left edge must be at most (viewportWidth - minVisibleWidth)
  const maxX = viewportWidth - minVisibleWidth;

  // Use NAVBAR_SAFE_ZONE as minimum Y to prevent windows from going above navbar
  const minY = Math.max(
    NAVBAR_SAFE_ZONE,
    minVisibleHeight - dimensions.height + NAVBAR_SAFE_ZONE,
  );

  const maxY = viewportHeight - minVisibleHeight;

  // Constrain position within bounds
  const constrainedX = Math.max(minX, Math.min(position.x, maxX));
  const constrainedY = Math.max(minY, Math.min(position.y, maxY));

  return {
    x: constrainedX,
    y: constrainedY,
  };
}

/**
 * Checks if a window position is within viewport bounds
 * @param position - Window position to check
 * @param dimensions - Window dimensions
 * @param padding - Optional padding from viewport edges (default: 20)
 * @returns true if minimum visible portion of window is within viewport
 */
export function isWithinViewport(
  position: WindowPosition | null | undefined,
  dimensions: WindowDimensions,
  padding = 20,
): boolean {
  // Handle undefined/null positions
  if (
    !position ||
    typeof position.x !== "number" ||
    typeof position.y !== "number"
  ) {
    return false;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Minimum visible portion of window (in pixels)
  const minVisibleWidth = 100;
  const minVisibleHeight = 50;

  const minX = padding;
  const minY = NAVBAR_SAFE_ZONE; // Use navbar safe zone instead of padding for Y

  // Allow window to extend beyond viewport, just keep minimum portion visible
  const maxX = viewportWidth - minVisibleWidth;
  const maxY = viewportHeight - minVisibleHeight;

  return (
    position.x >= minX &&
    position.x <= maxX &&
    position.y >= minY &&
    position.y <= maxY
  );
}

/**
 * Resets window position to default if it's outside viewport
 * Used when viewport is resized and saved position is no longer valid
 * @param position - Saved window position
 * @param dimensions - Window dimensions
 * @param defaultPosition - Default position to use if current position is invalid
 * @returns Valid position (either original or default)
 */
export function validateOrResetPosition(
  position: WindowPosition | null | undefined,
  dimensions: WindowDimensions,
  defaultPosition: WindowPosition,
): WindowPosition {
  // Handle undefined/null positions by using default
  if (!position || !isWithinViewport(position, dimensions)) {
    // If default position is also invalid, constrain it
    if (!isWithinViewport(defaultPosition, dimensions)) {
      return constrainToViewport(defaultPosition, dimensions);
    }
    return defaultPosition;
  }
  return position;
}

/**
 * All supported window types in the application
 */
export type WindowType =
  | "fee-details"
  | "transaction-history"
  | "bridge-progress"
  | "disclaimer"
  | "pong"
  | "stats";

/**
 * Default positions for each window type
 */
export const DEFAULT_WINDOW_POSITIONS: Record<WindowType, WindowPosition> = {
  "fee-details": { x: 350, y: 100 },
  "transaction-history": { x: 100, y: 150 },
  "bridge-progress": { x: 400, y: 150 },
  disclaimer: { x: 200, y: 150 },
  pong: { x: 300, y: 100 },
  stats: { x: 150, y: 120 },
};

/**
 * Gets default window dimensions based on window type
 * @param windowType - Type of window
 * @param isMaximized - Whether window is maximized
 * @returns Window dimensions
 */
export function getWindowDimensions(
  windowType: WindowType,
  isMaximized: boolean,
): WindowDimensions {
  const normalWidth = 600;
  const maximizedWidth = 800;

  // Approximate heights (including title bar and content)
  const dimensionsByType: Record<WindowType, WindowDimensions> = {
    "fee-details": { width: normalWidth, height: 500 },
    "transaction-history": { width: normalWidth, height: 650 },
    "bridge-progress": { width: 500, height: 600 },
    disclaimer: { width: 500, height: 450 },
    pong: { width: 450, height: 400 },
    stats: { width: 420, height: 380 },
  };

  const dimensions = dimensionsByType[windowType];

  if (
    isMaximized &&
    (windowType === "fee-details" || windowType === "transaction-history")
  ) {
    return { width: maximizedWidth, height: dimensions.height };
  }

  if (isMaximized && windowType === "bridge-progress") {
    return { width: 600, height: dimensions.height };
  }

  return dimensions;
}
