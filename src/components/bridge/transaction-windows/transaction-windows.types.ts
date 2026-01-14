import type { DragControls } from "motion/react";
import type {
  TransactionWindow,
  BridgeStep,
  BridgeTransaction,
} from "~/lib/bridge";

export interface TransactionWindowProps {
  transactionWindow: TransactionWindow;
  onClose: () => void;
  onFocus: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
}

export interface TransactionWindowViewProps {
  windowRef: React.RefObject<HTMLDivElement | null>;
  transaction: BridgeTransaction;
  position: { x: number; y: number };
  currentPosition: { x: number; y: number };
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  copiedHash: string | null;
  isRetrying: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  isInProgress: boolean;
  isCancelled: boolean;
  fromNetworkDisplayName: string;
  toNetworkDisplayName: string;
  fromNetworkExplorerUrl: string;
  toNetworkExplorerUrl: string;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClose: () => void;
  onFocus: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onCopyToClipboard: (text: string) => Promise<void>;
  onRetryStep: () => Promise<void>;
  onDismiss: () => Promise<void>;
  dragControls: DragControls;
}

export interface StepIconProps {
  step: BridgeStep;
}
