import type { DragControls } from "motion/react";

export interface PongWindowProps {
  onClose: () => void;
}

export interface PongWindowViewProps {
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

export interface PongDrawerProps {
  onClose: () => void;
}

export interface PongGameViewProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  score: { player: number; computer: number };
  gameStarted: boolean;
  onStartGame: () => void;
}
