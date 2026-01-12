import type { DragControls } from "motion/react";

export interface DisclaimerWindowProps {
  onClose: () => void;
}

export interface DisclaimerWindowViewProps {
  windowRef: React.RefObject<HTMLDivElement | null>;
  isMinimized: boolean;
  currentPosition: { x: number; y: number };
  initialPosition: { x: number; y: number };
  zIndex: number;
  dragControls: DragControls;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
}

export interface DisclaimerDrawerProps {
  onClose: () => void;
}
