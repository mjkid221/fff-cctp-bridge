"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { WalletSelectorProps } from "./wallet-selector.types";

export function useWalletSelectorState({
  wallets,
  selectedWalletId,
  networkType,
}: Pick<WalletSelectorProps, "wallets" | "selectedWalletId" | "networkType">) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter wallets by network type compatibility
  const compatibleWallets = useMemo(() => {
    return wallets.filter((wallet) => {
      if (!networkType) return true;

      const connectorKey = String(wallet.connector.key).toLowerCase();

      switch (networkType) {
        case "evm":
          return (
            connectorKey.includes("metamask") ||
            connectorKey.includes("coinbase") ||
            connectorKey.includes("walletconnect") ||
            connectorKey.includes("rainbow") ||
            (connectorKey.includes("phantom") &&
              connectorKey.includes("evm")) ||
            (!connectorKey.includes("solana") && !connectorKey.includes("sui"))
          );

        case "solana":
          return (
            (connectorKey.includes("phantom") &&
              !connectorKey.includes("evm")) ||
            connectorKey.includes("solana") ||
            connectorKey.includes("solflare") ||
            connectorKey.includes("backpack")
          );

        case "sui":
          return connectorKey.includes("sui");

        default:
          return false;
      }
    });
  }, [wallets, networkType]);

  const selectedWallet = compatibleWallets.find(
    (w) => w.id === selectedWalletId,
  );

  return {
    isOpen,
    setIsOpen,
    dropdownRef,
    compatibleWallets,
    selectedWallet,
  };
}
