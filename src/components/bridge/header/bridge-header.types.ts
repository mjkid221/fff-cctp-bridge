"use client";

export interface BridgeHeaderViewProps {
  // Wallet state
  isConnected: boolean;
  walletAddress: string | null;
  showDynamicUserProfile: boolean;

  // Panel visibility
  showTransactionHistory: boolean;
  showDisclaimer: boolean;
  showPongGame: boolean;

  // Environment
  environment: "mainnet" | "testnet";

  // Actions
  onConnectWallet: () => void;
  onManageWallets: () => void;
  onLogout: () => void;
  onCloseDynamicProfile: () => void;
  onToggleTransactionHistory: () => void;
  onToggleDisclaimer: () => void;
  onTogglePongGame: () => void;
}

export interface WindowControlsProps {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
  showMaximize?: boolean;
}
