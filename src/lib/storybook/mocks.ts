/**
 * Centralized mock data for Storybook stories
 */

import type {
  BridgeTransaction,
  BridgeStep,
  BridgeEstimate,
  WalletOption,
} from "~/lib/bridge";
import type { Notification } from "~/lib/notifications";
import type { SupportedChainId } from "~/lib/bridge/networks";

// ============================================================================
// Mock Wallets
// ============================================================================

export const mockWallets: WalletOption[] = [
  {
    id: "wallet-1",
    address: "0x1234567890abcdef1234567890abcdef12345678",
    connector: { key: "metamask", name: "MetaMask" },
  },
  {
    id: "wallet-2",
    address: "0xabcdef1234567890abcdef1234567890abcdef12",
    connector: { key: "coinbase", name: "Coinbase Wallet" },
  },
  {
    id: "wallet-3",
    address: "0x9876543210fedcba9876543210fedcba98765432",
    connector: { key: "walletconnect", name: "WalletConnect" },
  },
];

export const mockSolanaWallets: WalletOption[] = [
  {
    id: "wallet-sol-1",
    address: "7nYBp9LGy4oPzXwMq8rJh2kFtNv3sAeW1cDuE6fZ4oPz",
    connector: { key: "phantom", name: "Phantom" },
  },
  {
    id: "wallet-sol-2",
    address: "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",
    connector: { key: "solflare", name: "Solflare" },
  },
];

// ============================================================================
// Mock Bridge Steps
// ============================================================================

const createMockStep = (
  name: string,
  status: BridgeStep["status"],
  txHash?: string,
  error?: string,
): BridgeStep => ({
  id: `step-${name}`,
  name,
  status,
  txHash,
  error,
  timestamp: Date.now(),
});

export const mockSteps = {
  pending: [
    createMockStep("approve", "pending"),
    createMockStep("burn", "pending"),
    createMockStep("attestation", "pending"),
    createMockStep("mint", "pending"),
  ],
  inProgress: [
    createMockStep("approve", "completed", "0xabc123..."),
    createMockStep("burn", "completed", "0xdef456..."),
    createMockStep("attestation", "in_progress"),
    createMockStep("mint", "pending"),
  ],
  completed: [
    createMockStep("approve", "completed", "0xabc123..."),
    createMockStep("burn", "completed", "0xdef456..."),
    createMockStep("attestation", "completed", "0xghi789..."),
    createMockStep("mint", "completed", "0xjkl012..."),
  ],
  failed: [
    createMockStep("approve", "completed", "0xabc123..."),
    createMockStep("burn", "failed", undefined, "Insufficient gas"),
    createMockStep("attestation", "pending"),
    createMockStep("mint", "pending"),
  ],
};

// ============================================================================
// Mock Transactions
// ============================================================================

const createMockTransaction = (
  id: string,
  status: BridgeTransaction["status"],
  fromChain: SupportedChainId,
  toChain: SupportedChainId,
  steps: BridgeStep[],
  error?: string,
): BridgeTransaction => ({
  id,
  userAddress: "0x1234567890abcdef1234567890abcdef12345678",
  fromChain,
  toChain,
  amount: "100.00",
  token: "USDC",
  status,
  steps,
  sourceTxHash:
    status !== "pending"
      ? "0xabc123def456abc123def456abc123def456abc123def456abc123def456abcd"
      : undefined,
  destinationTxHash:
    status === "completed"
      ? "0xdef456abc123def456abc123def456abc123def456abc123def456abc123defg"
      : undefined,
  error,
  createdAt: Date.now() - 900000, // 15 minutes ago
  updatedAt: Date.now(),
  completedAt: status === "completed" ? Date.now() : undefined,
  estimatedTime: 780000, // 13 minutes
  fees: {
    network: "0.001",
    bridge: "0",
    total: "0.001",
  },
  transferMethod: "standard",
});

export const mockTransactions = {
  pending: createMockTransaction(
    "tx-pending",
    "pending",
    "Ethereum",
    "Base",
    mockSteps.pending,
  ),
  inProgress: createMockTransaction(
    "tx-in-progress",
    "bridging",
    "Ethereum",
    "Arbitrum",
    mockSteps.inProgress,
  ),
  completed: createMockTransaction(
    "tx-completed",
    "completed",
    "Base",
    "Ethereum",
    mockSteps.completed,
  ),
  failed: createMockTransaction(
    "tx-failed",
    "failed",
    "Arbitrum",
    "Base",
    mockSteps.failed,
    "Insufficient gas for transaction",
  ),
  cancelled: createMockTransaction(
    "tx-cancelled",
    "cancelled",
    "Ethereum",
    "Solana",
    mockSteps.pending,
  ),
};

export const mockTransactionsList: BridgeTransaction[] = [
  mockTransactions.completed,
  mockTransactions.inProgress,
  mockTransactions.failed,
  mockTransactions.pending,
];

// ============================================================================
// Mock Notifications
// ============================================================================

const createMockNotification = (
  id: string,
  type: Notification["type"],
  status: Notification["status"],
  title: string,
  message: string,
  read: boolean,
  extras?: Partial<Notification>,
): Notification => ({
  id,
  type,
  status,
  title,
  message,
  timestamp: Date.now() - 300000, // 5 minutes ago
  read,
  ...extras,
});

export const mockNotifications = {
  unreadBridgeSuccess: createMockNotification(
    "notif-1",
    "bridge",
    "success",
    "Bridge Complete",
    "Your USDC has been successfully bridged from Ethereum to Base.",
    false,
    {
      fromChain: "Ethereum",
      toChain: "Base",
      amount: "100",
      token: "USDC",
      bridgeTransactionId: "tx-completed",
    },
  ),
  readBridgeSuccess: createMockNotification(
    "notif-2",
    "bridge",
    "success",
    "Bridge Complete",
    "Your USDC has arrived on Arbitrum.",
    true,
    {
      fromChain: "Base",
      toChain: "Arbitrum",
      amount: "250.50",
      token: "USDC",
    },
  ),
  bridgePending: createMockNotification(
    "notif-3",
    "bridge",
    "pending",
    "Bridge Started",
    "Your transfer is being processed.",
    false,
    {
      fromChain: "Ethereum",
      toChain: "Solana",
      amount: "500",
      token: "USDC",
    },
  ),
  bridgeInProgress: createMockNotification(
    "notif-4",
    "bridge",
    "in_progress",
    "Waiting for Attestation",
    "Circle is verifying your transaction.",
    false,
    {
      fromChain: "Arbitrum",
      toChain: "Base",
      amount: "75",
      token: "USDC",
    },
  ),
  failedWithRetry: createMockNotification(
    "notif-5",
    "bridge",
    "failed",
    "Bridge Failed",
    "Transaction failed due to insufficient gas. Please retry.",
    false,
    {
      actionLabel: "Retry",
      actionType: "retry",
      bridgeTransactionId: "tx-failed",
    },
  ),
  systemInfo: createMockNotification(
    "notif-6",
    "system",
    "info",
    "System Update",
    "CCTP Bridge has been updated with new features.",
    true,
  ),
  systemWarning: createMockNotification(
    "notif-7",
    "warning",
    "info",
    "Network Congestion",
    "Ethereum network is experiencing high traffic. Transactions may take longer.",
    false,
  ),
};

export const mockNotificationsList: Notification[] = [
  mockNotifications.unreadBridgeSuccess,
  mockNotifications.bridgeInProgress,
  mockNotifications.failedWithRetry,
  mockNotifications.readBridgeSuccess,
  mockNotifications.systemInfo,
];

// ============================================================================
// Mock Fee Estimates
// ============================================================================

export const mockEstimates = {
  standard: {
    fees: {
      network: "0.0012",
      bridge: "0",
      total: "0.0012",
    },
    gasFees: {
      source: "0.0008",
      destination: "0.0004",
    },
    estimatedTime: 780000, // 13 minutes
    receiveAmount: "100.00",
  } as BridgeEstimate,
  fast: {
    fees: {
      network: "0.0015",
      bridge: "0.10",
      total: "0.1015",
    },
    gasFees: {
      source: "0.0010",
      destination: "0.0005",
    },
    estimatedTime: 30000, // 30 seconds
    receiveAmount: "99.90",
  } as BridgeEstimate,
};

// ============================================================================
// Mock Chain Data
// ============================================================================

export const mockChains = {
  mainnet: [
    { id: "Ethereum" as SupportedChainId, name: "Ethereum" },
    { id: "Base" as SupportedChainId, name: "Base" },
    { id: "Arbitrum" as SupportedChainId, name: "Arbitrum" },
    { id: "Solana" as SupportedChainId, name: "Solana" },
  ],
  testnet: [
    { id: "Ethereum_Sepolia" as SupportedChainId, name: "Ethereum Sepolia" },
    { id: "Base_Sepolia" as SupportedChainId, name: "Base Sepolia" },
    { id: "Arbitrum_Sepolia" as SupportedChainId, name: "Arbitrum Sepolia" },
    { id: "Solana_Devnet" as SupportedChainId, name: "Solana Devnet" },
  ],
};
