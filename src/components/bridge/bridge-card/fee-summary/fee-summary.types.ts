import type { DragControls } from "motion/react";
import type { BridgeEstimate, TransferMethod } from "~/lib/bridge/types";
import type { SupportedChainId } from "~/lib/bridge/networks";

export interface FeeSummaryProps {
  estimate: BridgeEstimate | null;
  isEstimating: boolean;
  fromChain: SupportedChainId;
  toChain: SupportedChainId;
  amount: string;
  transferMethod: TransferMethod;
  onClose: () => void;
}

export interface FeeSummaryViewProps {
  windowRef: React.RefObject<HTMLDivElement | null>;
  estimate: BridgeEstimate | null;
  isEstimating: boolean;
  fromChain: SupportedChainId;
  toChain: SupportedChainId;
  amount: string;
  transferMethod: TransferMethod;
  currentPosition: { x: number; y: number };
  initialPosition: { x: number; y: number };
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  dragControls: DragControls;
}
