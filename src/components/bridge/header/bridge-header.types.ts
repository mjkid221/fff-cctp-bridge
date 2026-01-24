export interface BridgeHeaderViewProps {
  // Wallet state
  isConnected: boolean;
  walletAddress: string | null;
  showDynamicUserProfile: boolean;

  // Panel visibility
  showTransactionHistory: boolean;
  showDisclaimer: boolean;
  showPongGame: boolean;
  showStats: boolean;
  showExplainer: boolean;
  commandPaletteOpen: boolean;

  // Environment
  environment: "mainnet" | "testnet";

  // Header control order (for drag-to-reorder)
  headerControlOrder: string[];
  onReorderHeaderControls: (order: string[]) => void;
  isDraggingControls: boolean;
  onDragStartControls: () => void;
  onDragEndControls: () => void;

  // Actions
  onConnectWallet: () => void;
  onManageWallets: () => void;
  onLogout: () => void;
  onCloseDynamicProfile: () => void;
  onToggleTransactionHistory: () => void;
  onToggleDisclaimer: () => void;
  onTogglePongGame: () => void;
  onToggleStats: () => void;
  onCloseTransactionHistory: () => void;
  onCloseDisclaimer: () => void;
  onClosePongGame: () => void;
  onCloseStats: () => void;
  onCloseExplainer: () => void;
  onOpenTransactionHistory: () => void;
  onOpenDisclaimer: () => void;
  onOpenPongGame: () => void;
  onOpenStats: () => void;
  onOpenExplainer: () => void;
  onOpenCommandPalette: () => void;
  onCloseCommandPalette: () => void;
}

export interface WindowControlsProps {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
  showMaximize?: boolean;
}
