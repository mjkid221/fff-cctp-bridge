"use client";

import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from "motion/react";
import { useState } from "react";
import { Wallet, ChevronDown, LogOut, User } from "lucide-react";
import {
  DynamicEmbeddedWidget,
  useDynamicContext,
} from "@dynamic-labs/sdk-react-core";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { NetworkToggle } from "./network-toggle";
import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export function BridgeHeader() {
  const {
    setShowAuthFlow,
    primaryWallet,
    handleLogOut,
    setShowDynamicUserProfile,
    showDynamicUserProfile,
  } = useDynamicContext();

  const isConnected = !!primaryWallet;
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const { scrollY } = useScroll();

  // Handle scroll behavior
  useMotionValueEvent(scrollY, "change", (latest) => {
    const currentScrollY = latest;

    // Show header when scrolling up or at top
    if (currentScrollY < lastScrollY || currentScrollY < 10) {
      setIsVisible(true);
    }
    // Hide header when scrolling down (after 100px)
    else if (currentScrollY > lastScrollY && currentScrollY > 100) {
      setIsVisible(false);
    }

    setLastScrollY(currentScrollY);
  });

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{
          opacity: 1,
          y: isVisible ? 0 : -100,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="border-border/40 fixed top-0 right-0 left-0 z-50 w-full border-b backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="from-primary flex size-10 items-center justify-center rounded-xl bg-gradient-to-br to-purple-600">
              <span className="text-xl font-bold text-white">◈</span>
            </div>
            <div>
              <h1 className="text-foreground text-xl font-bold">CCTP Bridge</h1>
              <p className="text-muted-foreground text-xs">
                Cross-Chain Transfer Protocol
              </p>
            </div>
          </motion.div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <NetworkToggle />
            <ThemeToggle />

            {isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "border-border/50 bg-card/50 h-10 rounded-xl backdrop-blur-xl",
                      "hover:bg-card/80 flex items-center gap-2 px-3",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">
                        {primaryWallet.address?.slice(0, 6)}...
                        {primaryWallet.address?.slice(-4)}
                      </span>
                    </div>
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={() => setShowDynamicUserProfile(true)}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 size-4" />
                    <span>Manage Wallets</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => void handleLogOut()}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 size-4" />
                    <span>Disconnect</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setShowAuthFlow(true)}
                variant="outline"
                className={cn(
                  "border-border/50 bg-card/50 h-10 rounded-xl backdrop-blur-xl",
                  "hover:bg-card/80 flex items-center gap-2 px-3",
                )}
              >
                <Wallet className="size-4" />
                <span className="text-sm font-medium">Connect Wallet</span>
              </Button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-20" />

      {/* Dynamic User Profile Modal */}
      <AnimatePresence>
        {showDynamicUserProfile && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDynamicUserProfile(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
            >
              <div className="border-border/50 bg-background rounded-2xl border shadow-2xl">
                <DynamicEmbeddedWidget background="default" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
