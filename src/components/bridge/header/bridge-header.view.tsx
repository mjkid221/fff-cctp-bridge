"use client";

import {
  motion,
  AnimatePresence,
  LayoutGroup,
} from "motion/react";
import {
  Wallet,
  ChevronDown,
  LogOut,
  User,
  History,
  Github,
  Twitter,
  FileText,
  Gamepad2,
} from "lucide-react";
import { DynamicEmbeddedWidget } from "@dynamic-labs/sdk-react-core";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "../theme-toggle";
import { NetworkToggle } from "../network-toggle";
import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { TokenUSDC } from "@web3icons/react";
import {
  NotificationBell,
  NotificationPanel,
} from "~/components/notifications";
import { CommandPalette } from "~/components/ui/command-palette";
import {
  DraggableTransactionHistory,
  MobileTransactionHistoryDrawer,
} from "./transaction-history";
import {
  DraggableDisclaimerWindow,
  MobileDisclaimerDrawer,
} from "./disclaimer";
import { DraggablePongWindow, MobilePongDrawer } from "./pong";

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
  onCloseTransactionHistory: () => void;
  onCloseDisclaimer: () => void;
  onClosePongGame: () => void;
  onOpenTransactionHistory: () => void;
  onOpenDisclaimer: () => void;
  onOpenPongGame: () => void;
}

export function BridgeHeaderView({
  isConnected,
  walletAddress,
  showDynamicUserProfile,
  showTransactionHistory,
  showDisclaimer,
  showPongGame,
  environment,
  onConnectWallet,
  onManageWallets,
  onLogout,
  onCloseDynamicProfile,
  onToggleTransactionHistory,
  onToggleDisclaimer,
  onTogglePongGame,
  onCloseTransactionHistory,
  onCloseDisclaimer,
  onClosePongGame,
  onOpenTransactionHistory,
  onOpenDisclaimer,
  onOpenPongGame,
}: BridgeHeaderViewProps) {
  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="border-border/40 bg-card/70 fixed top-0 right-0 left-0 z-200 h-12 w-full border-b backdrop-blur-xl"
      >
        <div className="flex h-full items-center justify-between px-3 sm:px-6">
          {/* Left section - Logo, app name, and menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <TokenUSDC
              variant="mono"
              size={20}
              color="currentColor"
              className="sm:h-6 sm:w-6"
            />

            <span className="text-foreground hidden text-xs font-semibold select-none sm:inline-block sm:text-sm">
              CCTP Bridge
            </span>

            <div className="bg-border/30 ml-1 hidden h-4 w-px sm:ml-2 sm:block" />

            {/* Menu bar - Desktop only */}
            <LayoutGroup>
              <div className="hidden lg:flex lg:items-center lg:gap-1">
                {/* View menu */}
                <motion.div layout transition={{ duration: 0.2, ease: "easeInOut" }}>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "text-foreground h-7 rounded-md px-2 text-xs font-medium transition-colors",
                          "hover:bg-muted/50 focus:ring-0 focus:outline-none",
                        )}
                      >
                        View
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="border-border/50 bg-card/95 w-56 backdrop-blur-xl"
                    >
                      <DropdownMenuItem
                        onClick={onToggleTransactionHistory}
                        className="text-foreground hover:bg-muted/50 focus:bg-muted/50 cursor-pointer"
                      >
                        <History className="mr-2 size-4" />
                        <span className="text-sm">
                          {showTransactionHistory ? "Hide" : "Show"} Transaction
                          History
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>

                {/* Faucet menu - Only visible on testnet */}
                <AnimatePresence mode="popLayout">
                  {environment === "testnet" && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9, width: 0 }}
                      animate={{ opacity: 1, scale: 1, width: "auto" }}
                      exit={{ opacity: 0, scale: 0.9, width: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className={cn(
                              "text-foreground h-7 rounded-md px-2 text-xs font-medium transition-colors",
                              "hover:bg-muted/50 focus:ring-0 focus:outline-none",
                            )}
                          >
                            Faucet
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="border-border/50 bg-card/95 w-56 backdrop-blur-xl"
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(
                                "https://faucet.circle.com/",
                                "_blank",
                                "noopener,noreferrer",
                              )
                            }
                            className="text-foreground hover:bg-muted/50 focus:bg-muted/50 cursor-pointer"
                          >
                            <span className="text-sm">Circle Faucet</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Resources menu */}
                <motion.div layout transition={{ duration: 0.2, ease: "easeInOut" }}>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "text-foreground h-7 rounded-md px-2 text-xs font-medium transition-colors",
                          "hover:bg-muted/50 focus:ring-0 focus:outline-none",
                        )}
                      >
                        Resources
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="border-border/50 bg-card/95 w-56 backdrop-blur-xl"
                    >
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            "https://github.com",
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                        className="text-foreground hover:bg-muted/50 focus:bg-muted/50 cursor-pointer"
                      >
                        <Github className="mr-2 size-4" />
                        <span className="text-sm">GitHub</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            "https://twitter.com",
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                        className="text-foreground hover:bg-muted/50 focus:bg-muted/50 cursor-pointer"
                      >
                        <Twitter className="mr-2 size-4" />
                        <span className="text-sm">Twitter</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/30" />
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            "https://developers.circle.com/stablecoins/docs/cctp-getting-started",
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                        className="text-foreground hover:bg-muted/50 focus:bg-muted/50 cursor-pointer"
                      >
                        <FileText className="mr-2 size-4" />
                        <span className="text-sm">CCTP Documentation</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>

                {/* Disclaimer button */}
                <motion.div layout transition={{ duration: 0.2, ease: "easeInOut" }}>
                  <Button
                    variant="ghost"
                    onClick={onToggleDisclaimer}
                    className={cn(
                      "text-foreground h-7 rounded-md px-2 text-xs font-medium transition-colors",
                      "hover:bg-muted/50 focus:ring-0 focus:outline-none",
                    )}
                  >
                    Disclaimer
                  </Button>
                </motion.div>

                {/* Arcade menu */}
                <motion.div layout transition={{ duration: 0.2, ease: "easeInOut" }}>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "text-foreground h-7 rounded-md px-2 text-xs font-medium transition-colors",
                          "hover:bg-muted/50 focus:ring-0 focus:outline-none",
                        )}
                      >
                        Arcade
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="border-border/50 bg-card/95 w-56 backdrop-blur-xl"
                    >
                      <DropdownMenuItem
                        onClick={onTogglePongGame}
                        className="text-foreground hover:bg-muted/50 focus:bg-muted/50 cursor-pointer"
                      >
                        <Gamepad2 className="mr-2 size-4" />
                        <span className="text-sm">Pong</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              </div>
            </LayoutGroup>
          </div>

          {/* Right section - Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Transaction History button - Mobile only */}
            <Button
              onClick={onToggleTransactionHistory}
              variant="ghost"
              className={cn(
                "text-foreground h-7 rounded-md p-1.5 transition-colors lg:hidden",
                "hover:bg-muted/50 focus:ring-0 focus:outline-none",
              )}
              aria-label="Transaction History"
            >
              <History className="size-4" />
            </Button>

            <div className="bg-border/30 hidden h-4 w-px sm:block lg:hidden" />

            <NetworkToggle />

            <div className="bg-border/30 hidden h-4 w-px sm:block" />

            <ThemeToggle />

            <div className="bg-border/30 hidden h-4 w-px sm:block" />

            <NotificationBell />

            <div className="bg-border/30 hidden h-4 w-px sm:block" />

            {isConnected ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "text-foreground h-7 w-[90px] rounded-md px-1.5 transition-colors sm:h-8 sm:min-w-[100px] sm:px-2.5",
                      "hover:bg-muted/50 focus:ring-0 focus:outline-none",
                      "flex items-center justify-center gap-1 sm:gap-1.5",
                    )}
                  >
                    <div className="size-1.5 rounded-full bg-green-500" />
                    <span className="text-[11px] font-medium sm:text-xs">
                      {walletAddress?.slice(0, 4)}...
                      {walletAddress?.slice(-3)}
                    </span>
                    <ChevronDown className="size-2.5 sm:size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-border/50 bg-card/95 w-48 backdrop-blur-xl"
                >
                  <DropdownMenuItem
                    onClick={onManageWallets}
                    className="text-foreground hover:bg-muted/50 focus:bg-muted/50 cursor-pointer"
                  >
                    <User className="mr-2 size-3.5" />
                    <span className="text-sm">Manage Wallets</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/30" />
                  <DropdownMenuItem
                    onClick={onLogout}
                    className="hover:bg-muted/50 focus:bg-muted/50 cursor-pointer text-red-600 hover:text-red-600 focus:text-red-600 dark:text-red-400 dark:hover:text-red-400 dark:focus:text-red-400"
                  >
                    <LogOut className="mr-2 size-3.5" />
                    <span className="text-sm">Disconnect</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={onConnectWallet}
                variant="ghost"
                className={cn(
                  "text-foreground h-7 w-[90px] rounded-md px-1.5 transition-colors sm:h-8 sm:min-w-[100px] sm:px-2.5",
                  "hover:bg-muted/50 focus:ring-0 focus:outline-none",
                  "flex items-center justify-center gap-1 sm:gap-1.5",
                )}
              >
                <Wallet className="size-3 sm:size-3.5" />
                <span className="text-[11px] font-medium sm:text-xs">
                  Connect
                </span>
              </Button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-16" />

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
              className="fixed inset-0 z-300 bg-black/60 backdrop-blur-sm"
              onClick={onCloseDynamicProfile}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-1/2 left-1/2 z-300 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
            >
              <div className="border-border/50 bg-background rounded-2xl border shadow-2xl">
                <DynamicEmbeddedWidget background="default" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Transaction History Window - Desktop only */}
      <AnimatePresence>
        {showTransactionHistory && (
          <>
            <DraggableTransactionHistory onClose={onCloseTransactionHistory} />
            <MobileTransactionHistoryDrawer
              onClose={onCloseTransactionHistory}
            />
          </>
        )}
      </AnimatePresence>

      {/* Notification Panel */}
      <NotificationPanel />

      {/* Disclaimer Window */}
      <AnimatePresence>
        {showDisclaimer && (
          <>
            <DraggableDisclaimerWindow onClose={onCloseDisclaimer} />
            <MobileDisclaimerDrawer onClose={onCloseDisclaimer} />
          </>
        )}
      </AnimatePresence>

      {/* Pong Game Window */}
      <AnimatePresence>
        {showPongGame && (
          <>
            <DraggablePongWindow onClose={onClosePongGame} />
            <MobilePongDrawer onClose={onClosePongGame} />
          </>
        )}
      </AnimatePresence>

      {/* Command Palette (cmd+k) */}
      <CommandPalette
        onOpenTransactionHistory={onOpenTransactionHistory}
        onOpenDisclaimer={onOpenDisclaimer}
        onOpenGame={onOpenPongGame}
      />
    </>
  );
}
