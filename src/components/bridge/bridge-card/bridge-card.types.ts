import type { BridgeEstimate } from "~/lib/bridge/types";
import type { SupportedChainId, NetworkType } from "~/lib/bridge/networks";

export interface WalletOption {
  id: string;
  address: string;
  connector: {
    key: string;
    name?: string;
  };
}

export interface BridgeCardViewProps {
  // Initialization state
  isInitialized: boolean;

  // Chain selection
  fromChain: SupportedChainId | null;
  toChain: SupportedChainId | null;
  onFromChainChange: (chain: SupportedChainId) => void;
  onToChainChange: (chain: SupportedChainId) => void;
  onSwapChains: () => void;

  // Wallet selection
  sourceWallets: WalletOption[];
  selectedSourceWalletId: string | null;
  onSelectSourceWallet: (walletId: string) => void;
  destWallets: WalletOption[];
  selectedDestWalletId: string | null;
  onSelectDestWallet: (walletId: string) => void;
  selectedDestWalletAddress?: string;
  destWalletAddress?: string;
  toNetworkType: NetworkType | null;

  // Amount
  amount: string;
  onAmountChange: (amount: string) => void;
  balance: string;
  isValidAmount: boolean;

  // Custom address
  useCustomAddress: boolean;
  customAddress: string;
  isAddressValid: boolean;
  onUseCustomAddressChange: (useCustom: boolean) => void;
  onCustomAddressChange: (address: string) => void;
  onAddressValidationChange: (valid: boolean) => void;

  // Fee details
  showFeeDetails: boolean;
  onToggleFeeDetails: () => void;
  estimate: BridgeEstimate | null;
  isEstimating: boolean;

  // Status
  switchError: string | null;
  bridgeError: string | null;
  isBridging: boolean;
  canBridge: boolean;
  needsDestinationWallet: boolean;

  // Actions
  onBridge: () => Promise<void>;
  onPromptDestWallet: (chainName?: string) => void;

  // Refs
  bridgeCardRef: React.RefObject<HTMLDivElement | null>;
  beamContainerRef: React.RefObject<HTMLDivElement | null>;
}
