"use client";

import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
  useDragControls,
} from "motion/react";
import { useState, useRef } from "react";
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
import { TokenUSDC } from "@web3icons/react";
import { RecentTransactions } from "./recent-transactions";
import { useActiveWindow, useSetActiveWindow } from "~/lib/bridge";

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
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);

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
        className="border-border/40 bg-card/95 fixed top-0 right-0 left-0 z-50 h-12 w-full border-b backdrop-blur-xl"
      >
        <div className="flex h-full items-center justify-between px-6">
          {/* Left section - Logo, app name, and menu */}
          <div className="flex items-center gap-3">
            <TokenUSDC variant="mono" size={24} color="currentColor" />

            <span className="text-foreground text-sm font-semibold select-none">
              CCTP Bridge
            </span>

            <div className="bg-border/30 ml-2 h-4 w-px" />

            {/* View menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "text-foreground h-7 rounded-md px-2 text-xs font-medium transition-colors",
                    "hover:bg-muted/50 focus:outline-none focus:ring-0",
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
                  onClick={() => setShowTransactionHistory(!showTransactionHistory)}
                  className="text-foreground hover:bg-muted/50 focus:bg-muted/50 cursor-pointer"
                >
                  <span className="text-sm">
                    {showTransactionHistory ? "Hide" : "Show"} Transaction History
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right section - Controls */}
          <div className="flex items-center gap-2">
            <NetworkToggle />

            <div className="bg-border/30 h-4 w-px" />

            <ThemeToggle />

            <div className="bg-border/30 h-4 w-px" />

            {isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "text-foreground h-8 rounded-md px-2.5 transition-colors",
                      "hover:bg-muted/50 focus:ring-0 focus:outline-none",
                      "flex items-center gap-1.5",
                    )}
                  >
                    <div className="size-1.5 rounded-full bg-green-500" />
                    <span className="text-xs font-medium">
                      {primaryWallet.address?.slice(0, 4)}...
                      {primaryWallet.address?.slice(-3)}
                    </span>
                    <ChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-border/50 bg-card/95 w-48 backdrop-blur-xl"
                >
                  <DropdownMenuItem
                    onClick={() => setShowDynamicUserProfile(true)}
                    className="text-foreground hover:bg-muted/50 focus:bg-muted/50 cursor-pointer"
                  >
                    <User className="mr-2 size-3.5" />
                    <span className="text-sm">Manage Wallets</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/30" />
                  <DropdownMenuItem
                    onClick={() => void handleLogOut()}
                    className="hover:bg-muted/50 focus:bg-muted/50 cursor-pointer text-red-600 hover:text-red-600 focus:text-red-600 dark:text-red-400 dark:hover:text-red-400 dark:focus:text-red-400"
                  >
                    <LogOut className="mr-2 size-3.5" />
                    <span className="text-sm">Disconnect</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setShowAuthFlow(true)}
                variant="ghost"
                className={cn(
                  "text-foreground h-8 rounded-md px-2.5 transition-colors",
                  "hover:bg-muted/50 focus:ring-0 focus:outline-none",
                  "flex items-center gap-1.5",
                )}
              >
                <Wallet className="size-3.5" />
                <span className="text-xs font-medium">Connect</span>
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

      {/* Transaction History Window */}
      <AnimatePresence>
        {showTransactionHistory && (
          <DraggableTransactionHistory
            onClose={() => setShowTransactionHistory(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Draggable macOS-style transaction history window
function DraggableTransactionHistory({ onClose }: { onClose: () => void }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const activeWindow = useActiveWindow();
  const setActiveWindow = useSetActiveWindow();

  const isActive = activeWindow === "transaction-history";
  const zIndex = isActive ? "z-20" : "z-10";

  return (
    <>
      {/* Draggable window */}
      <motion.div
        ref={windowRef}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragElastic={0}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.95, x: 100, y: 150 }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 300,
        }}
        className={cn("fixed left-0 top-0 hidden lg:block", zIndex)}
        style={{
          touchAction: "none",
        }}
        onPointerDown={() => setActiveWindow("transaction-history")}
      >
        <div
          className={cn(
            "border-border/50 bg-card/95 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-2xl transition-all duration-300",
            isMaximized ? "w-[800px]" : "w-[600px]",
          )}
        >
          {/* macOS-style title bar - Only this part is draggable */}
          <div
            className="bg-muted/40 group flex cursor-grab items-center justify-between border-b border-border/30 px-3 py-2.5 active:cursor-grabbing"
            onPointerDown={(e) => dragControls.start(e)}
            onDoubleClick={() => setIsMaximized(!isMaximized)}
          >
            {/* Traffic light buttons */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="group/btn relative size-3 rounded-full bg-red-500 transition-all hover:bg-red-600"
                aria-label="Close window"
              >
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-red-900 opacity-0 transition-opacity group-hover/btn:opacity-100">
                  ×
                </span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="group/btn relative size-3 rounded-full bg-yellow-500 transition-all hover:bg-yellow-600"
                aria-label="Minimize window"
              >
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-yellow-900 opacity-0 transition-opacity group-hover/btn:opacity-100">
                  −
                </span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMaximized(!isMaximized);
                }}
                className="group/btn relative size-3 rounded-full bg-green-500 transition-all hover:bg-green-600"
                aria-label={isMaximized ? "Restore window" : "Maximize window"}
              >
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-green-900 opacity-0 transition-opacity group-hover/btn:opacity-100">
                  {isMaximized ? "−" : "+"}
                </span>
              </motion.button>
            </div>

            {/* Window title */}
            <div className="text-muted-foreground pointer-events-none absolute left-1/2 -translate-x-1/2 text-xs font-medium">
              Transaction History
            </div>

            {/* Spacer for centering */}
            <div className="w-[52px]" />
          </div>

          {/* Window content - Not draggable */}
          <motion.div
            animate={{
              height: isMinimized ? 0 : "auto",
              opacity: isMinimized ? 0 : 1,
            }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="max-h-[600px] overflow-y-auto p-4">
              <RecentTransactions />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
