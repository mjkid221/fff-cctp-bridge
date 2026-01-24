"use client";

import { useState, useCallback } from "react";
import { useWalletContext } from "~/lib/wallet/wallet-context";
import {
  useEnvironment,
  useHeaderControlOrder,
  useSetHeaderControlOrder,
} from "~/lib/bridge";
import { useCCTPExplainer } from "../cctp-explainer";

export function useHeaderState() {
  const walletContext = useWalletContext();
  const { primaryWallet, isWalletManagerOpen } = walletContext;

  const environment = useEnvironment();
  const headerControlOrder = useHeaderControlOrder();
  const setHeaderControlOrder = useSetHeaderControlOrder();
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showPongGame, setShowPongGame] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isDraggingControls, setIsDraggingControls] = useState(false);

  // CCTP Explainer (managed via store)
  const {
    isOpen: showExplainer,
    onClose: handleCloseExplainer,
    onOpen: handleOpenExplainer,
  } = useCCTPExplainer();

  const isConnected = !!primaryWallet;
  const walletAddress = primaryWallet?.address ?? null;

  const handleConnectWallet = useCallback(() => {
    walletContext.showConnectModal();
  }, [walletContext]);

  const handleManageWallets = useCallback(() => {
    walletContext.showWalletManager();
  }, [walletContext]);

  const handleLogout = useCallback(() => {
    void walletContext.disconnect();
  }, [walletContext]);

  const handleCloseDynamicProfile = useCallback(() => {
    walletContext.hideWalletManager();
  }, [walletContext]);

  const handleToggleTransactionHistory = useCallback(() => {
    setShowTransactionHistory((prev) => !prev);
  }, []);

  const handleToggleDisclaimer = useCallback(() => {
    setShowDisclaimer((prev) => !prev);
  }, []);

  const handleTogglePongGame = useCallback(() => {
    setShowPongGame((prev) => !prev);
  }, []);

  const handleToggleStats = useCallback(() => {
    setShowStats((prev) => !prev);
  }, []);

  const handleCloseTransactionHistory = useCallback(() => {
    setShowTransactionHistory(false);
  }, []);

  const handleCloseDisclaimer = useCallback(() => {
    setShowDisclaimer(false);
  }, []);

  const handleClosePongGame = useCallback(() => {
    setShowPongGame(false);
  }, []);

  const handleCloseStats = useCallback(() => {
    setShowStats(false);
  }, []);

  const handleOpenTransactionHistory = useCallback(() => {
    setShowTransactionHistory(true);
  }, []);

  const handleOpenDisclaimer = useCallback(() => {
    setShowDisclaimer(true);
  }, []);

  const handleOpenPongGame = useCallback(() => {
    setShowPongGame(true);
  }, []);

  const handleOpenStats = useCallback(() => {
    setShowStats(true);
  }, []);

  const handleOpenCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  const handleCloseCommandPalette = useCallback(() => {
    setCommandPaletteOpen(false);
  }, []);

  const handleDragStart = useCallback(() => {
    setIsDraggingControls(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    // Small delay to prevent click events from firing after drag ends
    setTimeout(() => setIsDraggingControls(false), 100);
  }, []);

  return {
    // Wallet state
    isConnected,
    walletAddress,
    showDynamicUserProfile: isWalletManagerOpen,

    // Panel visibility
    showTransactionHistory,
    showDisclaimer,
    showPongGame,
    showStats,
    showExplainer,
    commandPaletteOpen,

    // Environment
    environment,

    // Header control order (for drag-to-reorder)
    headerControlOrder,
    onReorderHeaderControls: setHeaderControlOrder,
    isDraggingControls,
    onDragStartControls: handleDragStart,
    onDragEndControls: handleDragEnd,

    // Actions
    onConnectWallet: handleConnectWallet,
    onManageWallets: handleManageWallets,
    onLogout: handleLogout,
    onCloseDynamicProfile: handleCloseDynamicProfile,
    onToggleTransactionHistory: handleToggleTransactionHistory,
    onToggleDisclaimer: handleToggleDisclaimer,
    onTogglePongGame: handleTogglePongGame,
    onToggleStats: handleToggleStats,
    onCloseTransactionHistory: handleCloseTransactionHistory,
    onCloseDisclaimer: handleCloseDisclaimer,
    onClosePongGame: handleClosePongGame,
    onCloseStats: handleCloseStats,
    onCloseExplainer: handleCloseExplainer,
    onOpenTransactionHistory: handleOpenTransactionHistory,
    onOpenDisclaimer: handleOpenDisclaimer,
    onOpenPongGame: handleOpenPongGame,
    onOpenStats: handleOpenStats,
    onOpenExplainer: handleOpenExplainer,
    onOpenCommandPalette: handleOpenCommandPalette,
    onCloseCommandPalette: handleCloseCommandPalette,
  };
}
