import type { DragControls } from "motion/react";
import type { BridgeEstimate } from "~/lib/bridge/types";
import type { SupportedChainId } from "~/lib/bridge/networks";

export interface FeeSummaryProps {
  estimate: BridgeEstimate | null;
  isEstimating: boolean;
  fromChain: SupportedChainId;
  toChain: SupportedChainId;
  amount: string;
  onClose: () => void;
}

export interface FeeSummaryViewProps {
  windowRef: React.RefObject<HTMLDivElement | null>;
  estimate: BridgeEstimate | null;
  isEstimating: boolean;
  fromChain: SupportedChainId;
  toChain: SupportedChainId;
  amount: string;
  currentPosition: { x: number; y: number };
  initialPosition: { x: number; y: number };
  isMinimized: boolean;
  isMaximized: boolean;
  isActive: boolean;
  zIndex: string;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  dragControls: DragControls;
}
