"use client";

import { useWalletSelectorState } from "./wallet-selector.hooks";
import { WalletSelectorView } from "./wallet-selector.view";
import type { WalletSelectorProps } from "./wallet-selector.types";

export type { WalletSelectorProps, WalletOption } from "./wallet-selector.types";

export function WalletSelector({
  wallets,
  selectedWalletId,
  onSelectWallet,
  label,
  networkType,
  placeholder = "Select wallet",
}: WalletSelectorProps) {
  const { isOpen, setIsOpen, dropdownRef, compatibleWallets, selectedWallet } =
    useWalletSelectorState({
      wallets,
      selectedWalletId,
      networkType,
    });

  return (
    <WalletSelectorView
      label={label}
      placeholder={placeholder}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      dropdownRef={dropdownRef}
      compatibleWallets={compatibleWallets}
      selectedWallet={selectedWallet}
      selectedWalletId={selectedWalletId}
      onSelectWallet={onSelectWallet}
      networkType={networkType}
    />
  );
}
