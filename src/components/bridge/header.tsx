"use client";

import {
  motion,
  AnimatePresence,
  useDragControls,
} from "motion/react";
import { useState, useRef, useEffect } from "react";
import {
  Wallet,
  ChevronDown,
  LogOut,
  User,
  History,
  Github,
  Twitter,
  FileText,
  AlertTriangle,
  Gamepad2,
} from "lucide-react";
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
import {
  useActiveWindow,
  useSetActiveWindow,
  useWindowPositions,
  useSetWindowPosition,
  useHasHydrated,
  validateOrResetPosition,
  getWindowDimensions,
  constrainToViewport,
  useEnvironment,
  DEFAULT_WINDOW_POSITIONS,
} from "~/lib/bridge";
import type { WindowType } from "~/lib/bridge";
import {
  NotificationBell,
  NotificationPanel,
} from "~/components/notifications";
import { CommandPalette } from "~/components/ui/command-palette";

export function BridgeHeader() {
  const {
    setShowAuthFlow,
    primaryWallet,
    handleLogOut,
    setShowDynamicUserProfile,
    showDynamicUserProfile,
  } = useDynamicContext();

  const isConnected = !!primaryWallet;
  const environment = useEnvironment();
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showPongGame, setShowPongGame] = useState(false);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="border-border/40 bg-card/95 fixed top-0 right-0 left-0 z-50 h-12 w-full border-b backdrop-blur-xl"
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
            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {/* View menu */}
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
                    onClick={() =>
                      setShowTransactionHistory(!showTransactionHistory)
                    }
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

              {/* Faucet menu - Only visible on testnet */}
              {environment === "testnet" && (
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
                      onClick={() => window.open("https://faucet.circle.com/", "_blank", "noopener,noreferrer")}
                      className="text-foreground hover:bg-muted/50 focus:bg-muted/50 cursor-pointer"
                    >
                      <span className="text-sm">Circle Faucet</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Resources menu */}
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
                    onClick={() => window.open("https://github.com", "_blank", "noopener,noreferrer")}
                    className="text-foreground hover:bg-muted/50 focus:bg-muted/50 cursor-pointer"
                  >
                    <Github className="mr-2 size-4" />
                    <span className="text-sm">GitHub</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => window.open("https://twitter.com", "_blank", "noopener,noreferrer")}
                    className="text-foreground hover:bg-muted/50 focus:bg-muted/50 cursor-pointer"
                  >
                    <Twitter className="mr-2 size-4" />
                    <span className="text-sm">Twitter</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/30" />
                  <DropdownMenuItem
                    onClick={() => window.open("https://developers.circle.com/stablecoins/docs/cctp-getting-started", "_blank", "noopener,noreferrer")}
                    className="text-foreground hover:bg-muted/50 focus:bg-muted/50 cursor-pointer"
                  >
                    <FileText className="mr-2 size-4" />
                    <span className="text-sm">CCTP Documentation</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Disclaimer button */}
              <Button
                variant="ghost"
                onClick={() => setShowDisclaimer(!showDisclaimer)}
                className={cn(
                  "text-foreground h-7 rounded-md px-2 text-xs font-medium transition-colors",
                  "hover:bg-muted/50 focus:ring-0 focus:outline-none",
                )}
              >
                Disclaimer
              </Button>

              {/* Arcade menu */}
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
                    onClick={() => setShowPongGame(!showPongGame)}
                    className="text-foreground hover:bg-muted/50 focus:bg-muted/50 cursor-pointer"
                  >
                    <Gamepad2 className="mr-2 size-4" />
                    <span className="text-sm">Pong</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Right section - Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Transaction History button - Mobile only */}
            <Button
              onClick={() => setShowTransactionHistory(!showTransactionHistory)}
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
                      "text-foreground h-7 rounded-md px-1.5 transition-colors sm:h-8 sm:px-2.5",
                      "hover:bg-muted/50 focus:ring-0 focus:outline-none",
                      "flex items-center gap-1 sm:gap-1.5",
                    )}
                  >
                    <div className="size-1.5 rounded-full bg-green-500" />
                    <span className="text-[11px] font-medium sm:text-xs">
                      {primaryWallet.address?.slice(0, 4)}...
                      {primaryWallet.address?.slice(-3)}
                    </span>
                    <ChevronDown className="size-2.5 sm:size-3" />
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
                  "text-foreground h-7 rounded-md px-1.5 transition-colors sm:h-8 sm:px-2.5",
                  "hover:bg-muted/50 focus:ring-0 focus:outline-none",
                  "flex items-center gap-1 sm:gap-1.5",
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

      {/* Transaction History Window - Desktop only */}
      <AnimatePresence>
        {showTransactionHistory && (
          <>
            <DraggableTransactionHistory
              onClose={() => setShowTransactionHistory(false)}
            />
            <MobileTransactionHistoryDrawer
              onClose={() => setShowTransactionHistory(false)}
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
            <DraggableDisclaimerWindow onClose={() => setShowDisclaimer(false)} />
            <MobileDisclaimerDrawer onClose={() => setShowDisclaimer(false)} />
          </>
        )}
      </AnimatePresence>

      {/* Pong Game Window */}
      <AnimatePresence>
        {showPongGame && (
          <>
            <DraggablePongWindow onClose={() => setShowPongGame(false)} />
            <MobilePongDrawer onClose={() => setShowPongGame(false)} />
          </>
        )}
      </AnimatePresence>

      {/* Command Palette (cmd+k) */}
      <CommandPalette
        onOpenTransactionHistory={() => setShowTransactionHistory(true)}
        onOpenDisclaimer={() => setShowDisclaimer(true)}
        onOpenGame={() => setShowPongGame(true)}
      />
    </>
  );
}

// Draggable macOS-style transaction history window
function DraggableTransactionHistory({ onClose }: { onClose: () => void }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const activeWindow = useActiveWindow();
  const setActiveWindow = useSetActiveWindow();
  const windowPositions = useWindowPositions();
  const setWindowPosition = useSetWindowPosition();
  const hasHydrated = useHasHydrated();

  const isActive = activeWindow === "transaction-history";
  const zIndex = isActive ? "z-20" : "z-10";

  // Get saved position and validate it's within viewport
  const defaultPosition = { x: 100, y: 150 };
  const dimensions = getWindowDimensions("transaction-history", isMaximized);

  // Only use saved position after store has been hydrated from localStorage
  // Otherwise we'll get stale default values
  const savedPosition = hasHydrated
    ? windowPositions["transaction-history"]
    : defaultPosition;
  const initialPosition = validateOrResetPosition(
    savedPosition,
    dimensions,
    defaultPosition,
  );

  // Track current position for spring-back animation
  const [currentPosition, setCurrentPosition] = useState(initialPosition);

  // Update current position when initial position changes (e.g., on reopen)
  useEffect(() => {
    setCurrentPosition(initialPosition);
  }, [initialPosition.x, initialPosition.y]);

  // Log position for debugging
  useEffect(() => {
    console.log(
      "[TX History] Component mounted - hasHydrated:",
      hasHydrated,
      "savedPosition:",
      savedPosition,
      "initialPosition:",
      initialPosition,
    );
    console.log("[TX History] Full windowPositions:", windowPositions);
  }, []); // Only log on mount

  // Prevent text selection and background interactions during drag
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    } else {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging]);

  // Handle drag start - prevent text selection
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Handle drag end - constrain position and spring back if needed
  const handleDragEnd = () => {
    setIsDragging(false);
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      const draggedPosition = {
        x: rect.left,
        y: rect.top,
      };

      // Constrain position to keep window partially visible
      const constrainedPosition = constrainToViewport(
        draggedPosition,
        dimensions,
      );

      console.log(
        "[TX History] Drag end - dragged:",
        draggedPosition,
        "constrained:",
        constrainedPosition,
      );

      // Always update to dragged position first to reset Motion's animation target
      setCurrentPosition(draggedPosition);

      // If position needs to be constrained, spring back after a tick
      if (
        draggedPosition.x !== constrainedPosition.x ||
        draggedPosition.y !== constrainedPosition.y
      ) {
        // Use setTimeout to ensure state update happens after currentPosition is set to draggedPosition
        setTimeout(() => {
          setCurrentPosition(constrainedPosition);
        }, 0);
      }

      // Save the constrained position
      setWindowPosition("transaction-history", constrainedPosition);
    }
  };

  // Save position when closing
  const handleClose = () => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      const newPosition = {
        x: rect.left,
        y: rect.top,
      };
      console.log("[TX History] Saving position on close:", newPosition);
      setWindowPosition("transaction-history", newPosition);
    }
    onClose();
  };

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
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        initial={{
          opacity: 0,
          scale: 0.95,
          x: initialPosition.x,
          y: initialPosition.y,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          x: currentPosition.x,
          y: currentPosition.y,
        }}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 300,
        }}
        className={cn("fixed top-0 left-0 hidden lg:block", zIndex)}
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
            className="bg-muted/40 group border-border/30 flex cursor-grab items-center justify-between border-b px-3 py-2.5 active:cursor-grabbing"
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
                  handleClose();
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

// Mobile drawer for transaction history
function MobileTransactionHistoryDrawer({ onClose }: { onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 300,
        }}
        className="border-border/50 bg-card/95 fixed right-0 bottom-0 left-0 z-40 flex max-h-[85vh] flex-col rounded-t-3xl border-t backdrop-blur-2xl lg:hidden"
      >
        {/* Drag handle */}
        <div className="flex items-center justify-center py-3">
          <div className="bg-muted-foreground/30 h-1.5 w-12 rounded-full" />
        </div>

        {/* Header */}
        <div className="border-border/30 flex items-center justify-between border-b px-4 pb-3">
          <h3 className="text-foreground text-lg font-semibold">
            Transaction History
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground -mr-2 rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <RecentTransactions />
        </div>
      </motion.div>
    </>
  );
}

// Draggable Disclaimer Window
function DraggableDisclaimerWindow({ onClose }: { onClose: () => void }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const activeWindow = useActiveWindow();
  const setActiveWindow = useSetActiveWindow();
  const windowPositions = useWindowPositions();
  const setWindowPosition = useSetWindowPosition();
  const hasHydrated = useHasHydrated();

  const isActive = activeWindow === "disclaimer";
  const zIndex = isActive ? "z-30" : "z-20";

  const defaultPosition = DEFAULT_WINDOW_POSITIONS["disclaimer"];
  const dimensions = getWindowDimensions("disclaimer", false);

  const savedPosition = hasHydrated
    ? windowPositions["disclaimer"]
    : defaultPosition;
  const initialPosition = validateOrResetPosition(
    savedPosition,
    dimensions,
    defaultPosition,
  );

  const [currentPosition, setCurrentPosition] = useState(initialPosition);

  useEffect(() => {
    setCurrentPosition(initialPosition);
  }, [initialPosition.x, initialPosition.y]);

  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    } else {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }
    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging]);

  const handleDragStart = () => setIsDragging(true);

  const handleDragEnd = () => {
    setIsDragging(false);
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      const draggedPosition = { x: rect.left, y: rect.top };
      const constrainedPosition = constrainToViewport(draggedPosition, dimensions);
      setCurrentPosition(draggedPosition);
      if (draggedPosition.x !== constrainedPosition.x || draggedPosition.y !== constrainedPosition.y) {
        setTimeout(() => setCurrentPosition(constrainedPosition), 0);
      }
      setWindowPosition("disclaimer", constrainedPosition);
    }
  };

  const handleClose = () => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      setWindowPosition("disclaimer", { x: rect.left, y: rect.top });
    }
    onClose();
  };

  return (
    <motion.div
      ref={windowRef}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragElastic={0}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.95, x: initialPosition.x, y: initialPosition.y }}
      animate={{ opacity: 1, scale: 1, x: currentPosition.x, y: currentPosition.y }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className={cn("fixed top-0 left-0 hidden lg:block", zIndex)}
      style={{ touchAction: "none" }}
      onPointerDown={() => setActiveWindow("disclaimer")}
    >
      <div className="border-border/50 bg-card/95 w-[500px] overflow-hidden rounded-xl border shadow-2xl backdrop-blur-2xl">
        {/* macOS-style title bar */}
        <div
          className="bg-muted/40 group border-border/30 flex cursor-grab items-center justify-between border-b px-3 py-2.5 active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
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
            <div className="size-3 rounded-full bg-gray-400" />
          </div>
          <div className="text-muted-foreground pointer-events-none absolute left-1/2 -translate-x-1/2 text-xs font-medium">
            Disclaimer
          </div>
          <div className="w-[52px]" />
        </div>

        {/* Content */}
        <motion.div
          animate={{ height: isMinimized ? 0 : "auto", opacity: isMinimized ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="max-h-[500px] space-y-4 overflow-y-auto p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10">
                <AlertTriangle className="size-5 text-amber-500" />
              </div>
              <h3 className="text-foreground text-lg font-semibold">Important Notice</h3>
            </div>

            <div className="text-muted-foreground space-y-3 text-sm leading-relaxed">
              <p>
                This is an <strong className="text-foreground">unofficial, open-source user interface</strong> for
                Circle&apos;s Cross-Chain Transfer Protocol (CCTP). This application is not developed,
                maintained, or endorsed by Circle Internet Financial, LLC.
              </p>

              <p>
                <strong className="text-foreground">Unaudited Software:</strong> This software has not undergone
                a formal security audit. While we strive for security best practices, users should be aware
                that undiscovered vulnerabilities may exist.
              </p>

              <p>
                <strong className="text-foreground">Use at Your Own Risk:</strong> By using this application,
                you acknowledge and accept all risks associated with blockchain transactions, including but
                not limited to loss of funds, failed transactions, and smart contract vulnerabilities.
              </p>

              <p>
                <strong className="text-foreground">No Warranty:</strong> This software is provided &quot;as is&quot;
                without warranty of any kind, express or implied. The developers assume no liability for any
                damages arising from the use of this application.
              </p>

              <p className="text-muted-foreground/70 text-xs">
                Always verify transaction details before confirming. Never bridge more than you can afford to lose.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Mobile Disclaimer Drawer
function MobileDisclaimerDrawer({ onClose }: { onClose: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="border-border/50 bg-card/95 fixed right-0 bottom-0 left-0 z-40 flex max-h-[85vh] flex-col rounded-t-3xl border-t backdrop-blur-2xl lg:hidden"
      >
        <div className="flex items-center justify-center py-3">
          <div className="bg-muted-foreground/30 h-1.5 w-12 rounded-full" />
        </div>
        <div className="border-border/30 flex items-center justify-between border-b px-4 pb-3">
          <h3 className="text-foreground text-lg font-semibold">Disclaimer</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground -mr-2 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="size-5 text-amber-500" />
            </div>
            <h3 className="text-foreground font-semibold">Important Notice</h3>
          </div>
          <div className="text-muted-foreground space-y-3 text-sm">
            <p>This is an <strong className="text-foreground">unofficial, open-source UI</strong> for Circle&apos;s CCTP.</p>
            <p><strong className="text-foreground">Unaudited:</strong> Not formally security audited.</p>
            <p><strong className="text-foreground">Use at Your Own Risk:</strong> You accept all blockchain transaction risks.</p>
            <p><strong className="text-foreground">No Warranty:</strong> Provided &quot;as is&quot; without warranty.</p>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// Pong Game Component
function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState({ player: 0, computer: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!gameStarted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const paddleHeight = 60;
    const paddleWidth = 8;
    const ballSize = 8;

    let playerY = canvas.height / 2 - paddleHeight / 2;
    let computerY = canvas.height / 2 - paddleHeight / 2;
    let ballX = canvas.width / 2;
    let ballY = canvas.height / 2;
    let ballSpeedX = 4;
    let ballSpeedY = 2;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      playerY = e.clientY - rect.top - paddleHeight / 2;
      playerY = Math.max(0, Math.min(canvas.height - paddleHeight, playerY));
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    const gameLoop = () => {
      // Clear canvas
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw center line
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#333";
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw paddles
      ctx.fillStyle = "#fff";
      ctx.fillRect(10, playerY, paddleWidth, paddleHeight);
      ctx.fillRect(canvas.width - 18, computerY, paddleWidth, paddleHeight);

      // Draw ball
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballSize, 0, Math.PI * 2);
      ctx.fill();

      // Move ball
      ballX += ballSpeedX;
      ballY += ballSpeedY;

      // Ball collision with top/bottom
      if (ballY <= ballSize || ballY >= canvas.height - ballSize) {
        ballSpeedY = -ballSpeedY;
      }

      // Ball collision with player paddle
      if (ballX <= 18 + ballSize && ballY >= playerY && ballY <= playerY + paddleHeight) {
        ballSpeedX = Math.abs(ballSpeedX) * 1.05;
        ballSpeedY += (ballY - (playerY + paddleHeight / 2)) * 0.1;
      }

      // Ball collision with computer paddle
      if (ballX >= canvas.width - 26 && ballY >= computerY && ballY <= computerY + paddleHeight) {
        ballSpeedX = -Math.abs(ballSpeedX) * 1.05;
        ballSpeedY += (ballY - (computerY + paddleHeight / 2)) * 0.1;
      }

      // Computer AI
      const computerCenter = computerY + paddleHeight / 2;
      if (computerCenter < ballY - 20) computerY += 3;
      if (computerCenter > ballY + 20) computerY -= 3;
      computerY = Math.max(0, Math.min(canvas.height - paddleHeight, computerY));

      // Score
      if (ballX <= 0) {
        setScore(s => ({ ...s, computer: s.computer + 1 }));
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = 4;
        ballSpeedY = 2;
      }
      if (ballX >= canvas.width) {
        setScore(s => ({ ...s, player: s.player + 1 }));
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = -4;
        ballSpeedY = 2;
      }

      // Limit ball speed
      ballSpeedX = Math.max(-12, Math.min(12, ballSpeedX));
      ballSpeedY = Math.max(-8, Math.min(8, ballSpeedY));

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameStarted]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-foreground flex items-center gap-8 text-lg font-bold">
        <span>You: {score.player}</span>
        <span>CPU: {score.computer}</span>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={250}
          className="rounded-lg border border-border/50"
        />
        {!gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <Button onClick={() => setGameStarted(true)} className="gap-2">
              <Gamepad2 className="size-4" />
              Start Game
            </Button>
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-xs">Move your mouse to control the left paddle</p>
    </div>
  );
}

// Draggable Pong Window
function DraggablePongWindow({ onClose }: { onClose: () => void }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const activeWindow = useActiveWindow();
  const setActiveWindow = useSetActiveWindow();
  const windowPositions = useWindowPositions();
  const setWindowPosition = useSetWindowPosition();
  const hasHydrated = useHasHydrated();

  const isActive = activeWindow === "pong";
  const zIndex = isActive ? "z-30" : "z-20";

  const defaultPosition = DEFAULT_WINDOW_POSITIONS["pong"];
  const dimensions = getWindowDimensions("pong", false);

  const savedPosition = hasHydrated
    ? windowPositions["pong"]
    : defaultPosition;
  const initialPosition = validateOrResetPosition(
    savedPosition,
    dimensions,
    defaultPosition,
  );

  const [currentPosition, setCurrentPosition] = useState(initialPosition);

  useEffect(() => {
    setCurrentPosition(initialPosition);
  }, [initialPosition.x, initialPosition.y]);

  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    } else {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }
    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging]);

  const handleDragStart = () => setIsDragging(true);

  const handleDragEnd = () => {
    setIsDragging(false);
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      const draggedPosition = { x: rect.left, y: rect.top };
      const constrainedPosition = constrainToViewport(draggedPosition, dimensions);
      setCurrentPosition(draggedPosition);
      if (draggedPosition.x !== constrainedPosition.x || draggedPosition.y !== constrainedPosition.y) {
        setTimeout(() => setCurrentPosition(constrainedPosition), 0);
      }
      setWindowPosition("pong", constrainedPosition);
    }
  };

  const handleClose = () => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      setWindowPosition("pong", { x: rect.left, y: rect.top });
    }
    onClose();
  };

  return (
    <motion.div
      ref={windowRef}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragElastic={0}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.95, x: initialPosition.x, y: initialPosition.y }}
      animate={{ opacity: 1, scale: 1, x: currentPosition.x, y: currentPosition.y }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className={cn("fixed top-0 left-0 hidden lg:block", zIndex)}
      style={{ touchAction: "none" }}
      onPointerDown={() => setActiveWindow("pong")}
    >
      <div className="border-border/50 bg-card/95 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-2xl">
        {/* Title bar */}
        <div
          className="bg-muted/40 group border-border/30 flex cursor-grab items-center justify-between border-b px-3 py-2.5 active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
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
            <div className="size-3 rounded-full bg-gray-400" />
          </div>
          <div className="text-muted-foreground pointer-events-none absolute left-1/2 -translate-x-1/2 text-xs font-medium">
            Pong
          </div>
          <div className="w-[52px]" />
        </div>

        {/* Content */}
        <motion.div
          animate={{ height: isMinimized ? 0 : "auto", opacity: isMinimized ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="p-4">
            <PongGame />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Mobile Pong Drawer
function MobilePongDrawer({ onClose }: { onClose: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="border-border/50 bg-card/95 fixed right-0 bottom-0 left-0 z-40 flex max-h-[85vh] flex-col rounded-t-3xl border-t backdrop-blur-2xl lg:hidden"
      >
        <div className="flex items-center justify-center py-3">
          <div className="bg-muted-foreground/30 h-1.5 w-12 rounded-full" />
        </div>
        <div className="border-border/30 flex items-center justify-between border-b px-4 pb-3">
          <h3 className="text-foreground text-lg font-semibold">Pong</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground -mr-2 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <PongGame />
        </div>
      </motion.div>
    </>
  );
}
