import type { NetworkType } from "~/lib/bridge/networks";
import type { WalletOption } from "~/lib/bridge";

export type { WalletOption };

export interface WalletSelectorProps {
  wallets: WalletOption[];
  selectedWalletId: string | null;
  onSelectWallet: (walletId: string) => void;
  label: string;
  networkType: NetworkType | null;
  placeholder?: string;
}

export interface WalletSelectorViewProps {
  label: string;
  placeholder: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  compatibleWallets: WalletOption[];
  selectedWallet: WalletOption | undefined;
  selectedWalletId: string | null;
  onSelectWallet: (walletId: string) => void;
  networkType: NetworkType | null;
}
