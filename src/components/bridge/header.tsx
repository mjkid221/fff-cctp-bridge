"use client";

import { motion } from "motion/react";
import { Wallet } from "lucide-react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "~/lib/utils";

export function BridgeHeader() {
  const { setShowAuthFlow, primaryWallet, handleLogOut } = useDynamicContext();

  const isConnected = !!primaryWallet;

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-3"
          whileHover={{ scale: 1.05 }}
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600">
            <span className="text-xl font-bold text-white">◈</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">CCTP Bridge</h1>
            <p className="text-xs text-muted-foreground">
              Cross-Chain Transfer Protocol
            </p>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {isConnected ? (
              <div className="flex items-center gap-3">
                <div className="hidden rounded-xl border border-border/50 bg-card/50 px-4 py-2 backdrop-blur-xl sm:block">
                  <div className="text-xs text-muted-foreground">Connected</div>
                  <div className="text-sm font-medium text-foreground">
                    {primaryWallet.address?.slice(0, 6)}...
                    {primaryWallet.address?.slice(-4)}
                  </div>
                </div>
                <Button
                  onClick={() => void handleLogOut()}
                  variant="outline"
                  className={cn(
                    "rounded-xl border-border/50 bg-card/50 backdrop-blur-xl",
                    "hover:bg-card/80",
                  )}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowAuthFlow(true)}
                className={cn(
                  "group rounded-xl bg-gradient-to-r from-primary to-purple-600 font-semibold shadow-lg",
                  "hover:shadow-xl hover:shadow-primary/25",
                )}
              >
                <Wallet className="mr-2 size-4 transition-transform group-hover:scale-110" />
                Connect Wallet
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}

