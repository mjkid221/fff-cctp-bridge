"use client";

import { useState, useCallback } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useEnvironment } from "~/lib/bridge";

export function useHeaderState() {
  const {
    setShowAuthFlow,
    primaryWallet,
    handleLogOut,
    setShowDynamicUserProfile,
    showDynamicUserProfile,
  } = useDynamicContext();

  const environment = useEnvironment();
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showPongGame, setShowPongGame] = useState(false);

  const isConnected = !!primaryWallet;
  const walletAddress = primaryWallet?.address ?? null;

  const handleConnectWallet = useCallback(() => {
    setShowAuthFlow(true);
  }, [setShowAuthFlow]);

  const handleManageWallets = useCallback(() => {
    setShowDynamicUserProfile(true);
  }, [setShowDynamicUserProfile]);

  const handleLogout = useCallback(() => {
    void handleLogOut();
  }, [handleLogOut]);

  const handleCloseDynamicProfile = useCallback(() => {
    setShowDynamicUserProfile(false);
  }, [setShowDynamicUserProfile]);

  const handleToggleTransactionHistory = useCallback(() => {
    setShowTransactionHistory((prev) => !prev);
  }, []);

  const handleToggleDisclaimer = useCallback(() => {
    setShowDisclaimer((prev) => !prev);
  }, []);

  const handleTogglePongGame = useCallback(() => {
    setShowPongGame((prev) => !prev);
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

  const handleOpenTransactionHistory = useCallback(() => {
    setShowTransactionHistory(true);
  }, []);

  const handleOpenDisclaimer = useCallback(() => {
    setShowDisclaimer(true);
  }, []);

  const handleOpenPongGame = useCallback(() => {
    setShowPongGame(true);
  }, []);

  return {
    // Wallet state
    isConnected,
    walletAddress,
    showDynamicUserProfile,

    // Panel visibility
    showTransactionHistory,
    showDisclaimer,
    showPongGame,

    // Environment
    environment,

    // Actions
    onConnectWallet: handleConnectWallet,
    onManageWallets: handleManageWallets,
    onLogout: handleLogout,
    onCloseDynamicProfile: handleCloseDynamicProfile,
    onToggleTransactionHistory: handleToggleTransactionHistory,
    onToggleDisclaimer: handleToggleDisclaimer,
    onTogglePongGame: handleTogglePongGame,
    onCloseTransactionHistory: handleCloseTransactionHistory,
    onCloseDisclaimer: handleCloseDisclaimer,
    onClosePongGame: handleClosePongGame,
    onOpenTransactionHistory: handleOpenTransactionHistory,
    onOpenDisclaimer: handleOpenDisclaimer,
    onOpenPongGame: handleOpenPongGame,
  };
}
