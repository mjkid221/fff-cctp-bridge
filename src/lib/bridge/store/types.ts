/**
 * Bridge store type definitions
 */

import type { NetworkEnvironment, SupportedChainId } from "../networks";
import type { BridgeTransaction, TransferMethod } from "../types";
import type { WindowPosition, WindowType } from "../window-utils";

/**
 * Transaction window state for multi-window support
 */
export interface TransactionWindow {
  transactionId: string;
  transaction: BridgeTransaction;
  position: WindowPosition;
  zIndex: number;
  isMinimized: boolean;
}

/**
 * Hydration slice state
 */
export interface HydrationSlice {
  _hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
}

/**
 * Environment slice state
 */
export interface EnvironmentSlice {
  environment: NetworkEnvironment;
  setEnvironment: (environment: NetworkEnvironment) => void;
}

/**
 * Transfer method slice state
 */
export interface TransferSlice {
  transferMethod: TransferMethod;
  setTransferMethod: (method: TransferMethod) => void;
}

/**
 * User slice state
 */
export interface UserSlice {
  userAddress: string | null;
  setUserAddress: (address: string | null) => void;
}

/**
 * Chains slice state
 */
export interface ChainsSlice {
  fromChain: SupportedChainId | null;
  toChain: SupportedChainId | null;
  setFromChain: (chain: SupportedChainId) => void;
  setToChain: (chain: SupportedChainId) => void;
  swapChains: () => void;
}

/**
 * Transaction slice state
 */
export interface TransactionSlice {
  currentTransaction: BridgeTransaction | null;
  setCurrentTransaction: (transaction: BridgeTransaction | null) => void;
  transactions: BridgeTransaction[];
  setTransactions: (transactions: BridgeTransaction[]) => void;
  addTransaction: (transaction: BridgeTransaction) => void;
  updateTransaction: (id: string, updates: Partial<BridgeTransaction>) => void;
  cancelTransaction: (id: string) => Promise<void>;
  loadTransactions: () => Promise<void>;
  clearTransactions: () => Promise<void>;
}

/**
 * Windows slice state (non-transaction windows like fee-details)
 */
export interface WindowsSlice {
  activeWindow: WindowType | null;
  setActiveWindow: (window: WindowType | null) => void;
  windowPositions: Record<WindowType, WindowPosition>;
  setWindowPosition: (window: WindowType, position: WindowPosition) => void;
  windowZIndexes: Record<WindowType, number>;
  focusWindow: (window: WindowType) => void;
}

/**
 * Transaction windows slice state (multi-window transaction panels)
 */
export interface TransactionWindowsSlice {
  openTransactionWindows: Map<string, TransactionWindow>;
  nextZIndex: number;
  openTransactionWindow: (
    transaction: BridgeTransaction,
    position?: WindowPosition,
  ) => void;
  closeTransactionWindow: (transactionId: string) => void;
  focusTransactionWindow: (transactionId: string) => void;
  updateTransactionWindowPosition: (
    transactionId: string,
    position: WindowPosition,
  ) => void;
  updateTransactionInWindow: (
    transactionId: string,
    updates: Partial<BridgeTransaction>,
  ) => void;
  minimizeTransactionWindow: (
    transactionId: string,
    isMinimized: boolean,
  ) => void;
}

/**
 * UI slice state
 */
export interface UISlice {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  hasSeenCCTPExplainer: boolean;
  setHasSeenCCTPExplainer: (seen: boolean) => void;
  showCCTPExplainer: boolean;
  setShowCCTPExplainer: (show: boolean) => void;
  headerControlOrder: string[];
  setHeaderControlOrder: (order: string[]) => void;
}

/**
 * Combined bridge store state
 */
export type BridgeState = HydrationSlice &
  EnvironmentSlice &
  TransferSlice &
  UserSlice &
  ChainsSlice &
  TransactionSlice &
  WindowsSlice &
  TransactionWindowsSlice &
  UISlice;
