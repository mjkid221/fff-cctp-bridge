"use client";

import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown, Wallet } from "lucide-react";
import { cn } from "~/lib/utils";
import { formatAddress, getWalletName } from "./wallet-selector.hooks";
import type { WalletSelectorViewProps } from "./wallet-selector.types";

export function WalletSelectorView({
  label,
  placeholder,
  isOpen,
  setIsOpen,
  dropdownRef,
  compatibleWallets,
  selectedWallet,
  selectedWalletId,
  onSelectWallet,
  networkType,
}: WalletSelectorViewProps) {
  if (compatibleWallets.length === 0) {
    return (
      <div className="space-y-2">
        <label className="text-muted-foreground text-sm font-medium">
          {label}
        </label>
        <div className="border-border/50 bg-muted/30 text-muted-foreground flex items-center gap-2 rounded-xl border px-4 py-3 text-sm">
          <Wallet className="size-4" />
          <span>
            No compatible {networkType?.toUpperCase()} wallets connected
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-2" ref={dropdownRef}>
      {label && (
        <label className="text-muted-foreground text-sm font-medium">
          {label}
        </label>
      )}

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "border-border/50 bg-card/50 flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left backdrop-blur-xl transition-all",
          "hover:border-border hover:bg-card/80",
          isOpen && "border-border bg-card/80",
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
            <Wallet className="size-4 text-blue-500" />
          </div>
          <div className="flex flex-col">
            {selectedWallet ? (
              <>
                <span className="text-foreground text-sm font-medium">
                  {getWalletName(selectedWallet)}
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatAddress(selectedWallet.address)}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground text-sm">
                {placeholder}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="border-border/50 bg-card/95 absolute z-50 mt-2 w-full overflow-hidden rounded-xl border shadow-xl backdrop-blur-xl"
          >
            <div className="max-h-60 overflow-y-auto p-1">
              {compatibleWallets.map((wallet) => (
                <motion.button
                  key={wallet.id}
                  onClick={() => {
                    onSelectWallet(wallet.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    "hover:bg-muted/50",
                    wallet.id === selectedWalletId && "bg-muted/50",
                  )}
                  whileHover={{ x: 2 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                      <Wallet className="size-4 text-blue-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-foreground text-sm font-medium">
                        {getWalletName(wallet)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatAddress(wallet.address)}
                      </span>
                    </div>
                  </div>
                  {wallet.id === selectedWalletId && (
                    <Check className="size-4 text-blue-500" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
