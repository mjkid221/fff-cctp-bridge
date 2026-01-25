"use client";

import { useMemo, useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup, Reorder } from "motion/react";
import { DynamicEmbeddedWidget } from "@dynamic-labs/sdk-react-core";
import { TokenUSDC } from "@web3icons/react";
import {
  NotificationPanel,
  MobileNotificationDrawer,
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
import { StatsWindow, MobileStatsDrawer } from "./stats-window";
import { CCTPExplainerView } from "../cctp-explainer";
import { NavMenuEntry, NAV_MENU_CONFIG } from "./nav-menu";
import {
  HeaderControlEntry,
  getHeaderControl,
  MobileMenu,
} from "./header-controls";
import { NetworkToggle } from "../network-toggle";
import type { BridgeHeaderViewProps } from "./bridge-header.types";

export function BridgeHeaderView(props: BridgeHeaderViewProps) {
  const {
    showDynamicUserProfile,
    showTransactionHistory,
    showDisclaimer,
    showPongGame,
    showStats,
    showExplainer,
    commandPaletteOpen,
    headerControlOrder,
    onReorderHeaderControls,
    onDragStartControls,
    onDragEndControls,
    onCloseDynamicProfile,
    onCloseTransactionHistory,
    onCloseDisclaimer,
    onClosePongGame,
    onCloseStats,
    onCloseExplainer,
    onOpenTransactionHistory,
    onOpenDisclaimer,
    onOpenPongGame,
    onOpenStats,
    onOpenExplainer,
    onOpenCommandPalette,
    onCloseCommandPalette,
  } = props;

  // Filter controls for desktop reorder (exclude mobile-only items to fix invisible gap)
  const desktopControls = useMemo(() => {
    return headerControlOrder.filter((id) => {
      const control = getHeaderControl(id);
      return control && control.visibleBreakpoint !== "mobile";
    });
  }, [headerControlOrder]);

  // Handle reorder while preserving hidden items
  const handleDesktopReorder = useCallback(
    (newOrder: string[]) => {
      // Get items that were filtered out (mobile-only)
      const hiddenItems = headerControlOrder.filter(
        (id) => !desktopControls.includes(id),
      );
      // Append hidden items at the end to preserve them
      onReorderHeaderControls([...newOrder, ...hiddenItems]);
    },
    [headerControlOrder, desktopControls, onReorderHeaderControls],
  );

  // Get wallet control for mobile rendering
  const walletControl = getHeaderControl("wallet");

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
                {NAV_MENU_CONFIG.map((menu) => (
                  <NavMenuEntry key={menu.id} menu={menu} viewProps={props} />
                ))}
              </div>
            </LayoutGroup>
          </div>

          {/* Right section - Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop: Reorderable controls */}
            <Reorder.Group
              as="div"
              axis="x"
              values={desktopControls}
              onReorder={handleDesktopReorder}
              className="hidden items-center gap-1.5 lg:flex lg:gap-2"
            >
              {desktopControls.map((controlId: string) => {
                const control = getHeaderControl(controlId);
                if (!control) return null;
                return (
                  <Reorder.Item
                    as="div"
                    key={controlId}
                    value={controlId}
                    onDragStart={() => onDragStartControls()}
                    onDragEnd={() => onDragEndControls()}
                    className="flex cursor-grab items-center justify-center active:cursor-grabbing"
                  >
                    <HeaderControlEntry control={control} viewProps={props} />
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>

            {/* Mobile Menu */}
            <div className="flex items-center gap-1.5 lg:hidden">
              <NetworkToggle />
              <MobileMenu viewProps={props} />
              {walletControl && (
                <HeaderControlEntry control={walletControl} viewProps={props} />
              )}
            </div>
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

      {/* Notification Panel - Desktop dropdown, Mobile drawer */}
      <NotificationPanel />
      <MobileNotificationDrawer />

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

      {/* Stats Window */}
      <AnimatePresence>
        {showStats && (
          <>
            <StatsWindow onClose={onCloseStats} />
            <MobileStatsDrawer onClose={onCloseStats} />
          </>
        )}
      </AnimatePresence>

      {/* CCTP Explainer Modal */}
      <CCTPExplainerView isOpen={showExplainer} onClose={onCloseExplainer} />

      {/* Command Palette (cmd+k) */}
      <CommandPalette
        onOpenTransactionHistory={onOpenTransactionHistory}
        onOpenDisclaimer={onOpenDisclaimer}
        onOpenGame={onOpenPongGame}
        onOpenStats={onOpenStats}
        onOpenExplainer={onOpenExplainer}
        open={commandPaletteOpen}
        onOpenChange={(open) =>
          open ? onOpenCommandPalette() : onCloseCommandPalette()
        }
      />
    </>
  );
}
