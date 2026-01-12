import type { DragControls } from "motion/react";

export interface TransactionHistoryWindowProps {
  onClose: () => void;
}

export interface TransactionHistoryWindowViewProps {
  windowRef: React.RefObject<HTMLDivElement | null>;
  isMinimized: boolean;
  isMaximized: boolean;
  currentPosition: { x: number; y: number };
  initialPosition: { x: number; y: number };
  zIndex: number;
  dragControls: DragControls;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
}

export interface TransactionHistoryDrawerProps {
  onClose: () => void;
}
