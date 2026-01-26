import {
  BridgeKit,
  resolveChainIdentifier,
  type BridgeResult,
} from "@circle-fin/bridge-kit";
import type { AdapterContext } from "@circle-fin/bridge-kit";
import { nanoid } from "nanoid";
import {
  createWalletClient,
  custom,
  encodeFunctionData,
  defineChain,
  type Chain,
} from "viem";
import type { IWallet } from "~/lib/wallet/types";
import type { AttestationMessage } from "./attestation";
import type {
  BridgeEstimate,
  BridgeParams,
  BridgeTransaction,
  IBridgeService,
  TokenBalance,
  TransferMethod,
} from "./types";
import { BridgeStorage } from "./storage";
import { NETWORK_CONFIGS, isRouteSupported } from "./networks";
import type { SupportedChainId } from "./networks";
import {
  getAdapterFactory,
  type AdapterFactory,
  EVMAdapterCreator,
} from "./adapters/factory";
import { getBalanceService, type BalanceService } from "./balance/service";
import { getAttestationTime } from "./attestation-times";
import { BridgeEventManager } from "./event-manager";
import { useBridgeStore } from "./store";
import { fetchAttestation, requestReAttestation } from "./attestation";
import { getViemChain } from "./chain-utils";

/**
 * Get CCTP configuration for a chain from the SDK
 * Returns contract addresses, chain ID, and RPC endpoints
 */
function getChainCctpConfig(chainId: SupportedChainId) {
  try {
    const chainDef = resolveChainIdentifier(chainId);

    if (!chainDef.cctp?.contracts?.v2) {
      return null;
    }

    const v2Contracts = chainDef.cctp.contracts.v2;

    // Handle both 'split' and 'unified' contract types
    const messageTransmitter =
      "messageTransmitter" in v2Contracts
        ? v2Contracts.messageTransmitter
        : null;

    if (!messageTransmitter) {
      return null;
    }

    return {
      messageTransmitter: messageTransmitter as `0x${string}`,
      chainId: chainDef.type === "evm" ? chainDef.chainId : null,
      rpcEndpoints: chainDef.rpcEndpoints,
      name: chainDef.name,
      nativeCurrency: chainDef.nativeCurrency,
    };
  } catch (error) {
    console.error(`[Recovery] Failed to resolve chain ${chainId}:`, error);
    return null;
  }
}

/**
 * Create a viem chain definition from SDK chain config
 */
function createViemChainFromSdk(chainId: SupportedChainId): Chain | null {
  const config = getChainCctpConfig(chainId);
  if (!config?.chainId) {
    return null;
  }

  const network = NETWORK_CONFIGS[chainId];

  return defineChain({
    id: config.chainId,
    name: config.name,
    nativeCurrency: config.nativeCurrency,
    rpcUrls: {
      default: { http: [...config.rpcEndpoints] },
    },
    blockExplorers: network
      ? {
          default: { name: "Explorer", url: network.explorerUrl },
        }
      : undefined,
  });
}

/**
 * MessageTransmitter ABI for receiveMessage function
 */
const MESSAGE_TRANSMITTER_ABI = [
  {
    inputs: [
      { name: "message", type: "bytes" },
      { name: "attestation", type: "bytes" },
    ],
    name: "receiveMessage",
    outputs: [{ name: "success", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

/**
 * Bridge service configuration
 */
export interface BridgeServiceConfig {
  adapterFactory?: AdapterFactory;
  balanceService?: BalanceService;
  storage?: typeof BridgeStorage;
}

/**
 * Bridge operation context
 * Contains all information needed for a bridge operation
 */
interface BridgeOperationContext {
  transactionId: string;
  userAddress: string;
  fromChain: SupportedChainId;
  toChain: SupportedChainId;
  amount: string;
  token: string;
  recipientAddress?: string;
  transferSpeed: "FAST" | "SLOW";
  fromAdapter: AdapterContext["adapter"];
  toAdapter: AdapterContext["adapter"];
  /** Actual wallet address on source chain */
  sourceAddress: string;
  /** Actual wallet address on destination chain */
  destinationAddress: string;
}

/**
 * Map transfer method to Bridge Kit's transfer speed
 * - 'standard' -> 'SLOW' (0% bridge fee, ~15-19 min finality)
 * - 'fast' -> 'FAST' (1-14 bps fee, seconds)
 */
function getTransferSpeed(
  method: TransferMethod = "standard",
): "FAST" | "SLOW" {
  return method === "fast" ? "FAST" : "SLOW";
}

/**
 * CCTP Bridge Service Implementation
 * Orchestrates cross-chain USDC transfers using Circle's CCTP protocol
 */
export class CCTPBridgeService implements IBridgeService {
  private readonly kit: BridgeKit;
  private readonly adapterFactory: AdapterFactory;
  private readonly balanceService: BalanceService;
  private readonly storage: typeof BridgeStorage;
  private readonly eventManager: BridgeEventManager;

  private userAddress: string | null = null;
  private wallets: IWallet[] = [];

  constructor(config: BridgeServiceConfig = {}) {
    this.kit = new BridgeKit(); // Keep for estimate() - read-only operations don't need event isolation
    this.adapterFactory = config.adapterFactory ?? getAdapterFactory();
    this.balanceService = config.balanceService ?? getBalanceService();
    this.storage = config.storage ?? BridgeStorage;
    this.eventManager = new BridgeEventManager(this.storage);
  }

  /**
   * Sync transaction state to all consumers (store, windows)
   * Uses queueMicrotask to ensure React processes updates immediately
   *
   * Note: We deliberately do NOT call setCurrentTransaction here to avoid
   * overwriting state when multiple transactions run concurrently.
   * Each window maintains its own transaction copy via updateTransactionInWindow.
   */
  private syncTransactionState(transaction: BridgeTransaction): void {
    queueMicrotask(() => {
      const state = useBridgeStore.getState();
      state.updateTransaction(transaction.id, transaction);
      state.updateTransactionInWindow(transaction.id, transaction);
    });
  }

  /**
   * Initialize the bridge service with user wallet
   */
  async initialize(wallet?: IWallet, allWallets?: IWallet[]): Promise<void> {
    if (!wallet?.address) {
      throw new Error("Address is required");
    }

    this.userAddress = wallet?.address ?? null;
    this.wallets = allWallets ?? (wallet ? [wallet] : []);
    this.adapterFactory.clearCache();
  }

  /**
   * Get adapter for a specific chain
   * Uses the adapter factory for extensible chain support
   * Finds the correct wallet from all connected wallets based on network type
   */
  private async getAdapterForChain(
    chain: SupportedChainId,
  ): Promise<AdapterContext["adapter"]> {
    const network = NETWORK_CONFIGS[chain];
    if (!network) {
      throw new Error(`Invalid chain: ${chain}`);
    }

    // Find a compatible wallet for this network type
    const compatibleWallet = this.wallets.find((w) => {
      try {
        // Check if this wallet can handle this network type
        const creator = this.adapterFactory.getCreator(network.type);
        return creator?.canHandle(w) ?? false;
      } catch {
        return false;
      }
    });

    if (!compatibleWallet) {
      throw new Error(
        `No compatible wallet connected for ${network.type} network. Please connect a ${network.type.toUpperCase()} wallet first.`,
      );
    }

    try {
      // Pass chain ID for environment-specific RPC selection (important for Solana devnet/mainnet)
      return await this.adapterFactory.getAdapter(
        compatibleWallet,
        network.type,
        chain,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to get adapter for ${chain}: ${message}`);
    }
  }

  /**
   * Get adapter for a specific chain using an explicit wallet
   * This allows passing a specific wallet rather than auto-finding one
   */
  private async getAdapterForChainWithWallet(
    chain: SupportedChainId,
    wallet?: IWallet,
  ): Promise<AdapterContext["adapter"]> {
    const network = NETWORK_CONFIGS[chain];
    if (!network) {
      throw new Error(`Invalid chain: ${chain}`);
    }

    // Use provided wallet or find a compatible one
    const targetWallet =
      wallet ??
      this.wallets.find((w) => {
        try {
          const creator = this.adapterFactory.getCreator(network.type);
          return creator?.canHandle(w) ?? false;
        } catch {
          return false;
        }
      });

    if (!targetWallet) {
      throw new Error(
        `No compatible wallet for ${network.type} network. Please connect a ${network.type.toUpperCase()} wallet first.`,
      );
    }

    try {
      return await this.adapterFactory.getAdapter(
        targetWallet,
        network.type,
        chain,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to get adapter for ${chain}: ${message}`);
    }
  }

  /**
   * Get a fresh (uncached) adapter for a specific chain
   * Use this for bridge/retry/resume operations to avoid concurrent transaction conflicts
   * where multiple transactions sharing the same adapter can cause duplicate wallet popups
   */
  private async getTransactionAdapterForChain(
    chain: SupportedChainId,
  ): Promise<AdapterContext["adapter"]> {
    const network = NETWORK_CONFIGS[chain];
    if (!network) {
      throw new Error(`Invalid chain: ${chain}`);
    }

    const compatibleWallet = this.wallets.find((w) => {
      try {
        const creator = this.adapterFactory.getCreator(network.type);
        return creator?.canHandle(w) ?? false;
      } catch {
        return false;
      }
    });

    if (!compatibleWallet) {
      throw new Error(
        `No compatible wallet connected for ${network.type} network. Please connect a ${network.type.toUpperCase()} wallet first.`,
      );
    }

    try {
      return await this.adapterFactory.createTransactionAdapter(
        compatibleWallet,
        network.type,
        chain,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to get adapter for ${chain}: ${message}`);
    }
  }

  /**
   * Get a fresh (uncached) adapter for a specific chain using an explicit wallet
   * Use this for bridge/retry/resume operations to avoid concurrent transaction conflicts
   */
  private async getTransactionAdapterForChainWithWallet(
    chain: SupportedChainId,
    wallet?: IWallet,
  ): Promise<AdapterContext["adapter"]> {
    const network = NETWORK_CONFIGS[chain];
    if (!network) {
      throw new Error(`Invalid chain: ${chain}`);
    }

    const targetWallet =
      wallet ??
      this.wallets.find((w) => {
        try {
          const creator = this.adapterFactory.getCreator(network.type);
          return creator?.canHandle(w) ?? false;
        } catch {
          return false;
        }
      });

    if (!targetWallet) {
      throw new Error(
        `No compatible wallet for ${network.type} network. Please connect a ${network.type.toUpperCase()} wallet first.`,
      );
    }

    try {
      return await this.adapterFactory.createTransactionAdapter(
        targetWallet,
        network.type,
        chain,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to get adapter for ${chain}: ${message}`);
    }
  }

  /**
   * Get the wallet address for a specific chain
   * Returns the address of the provided wallet or finds a compatible wallet
   */
  private getWalletAddressForChain(
    chain: SupportedChainId,
    wallet?: IWallet,
  ): string {
    const network = NETWORK_CONFIGS[chain];
    if (!network) {
      throw new Error(`Invalid chain: ${chain}`);
    }

    // Use provided wallet or find a compatible one
    const targetWallet =
      wallet ??
      this.wallets.find((w) => {
        try {
          const creator = this.adapterFactory.getCreator(network.type);
          return creator?.canHandle(w) ?? false;
        } catch {
          return false;
        }
      });

    if (!targetWallet) {
      throw new Error(
        `No compatible wallet for ${network.type} network. Please connect a ${network.type.toUpperCase()} wallet first.`,
      );
    }

    return targetWallet.address;
  }

  /**
   * Get USDC balance for a specific chain
   */
  async getBalance(chain: SupportedChainId): Promise<TokenBalance> {
    if (!this.userAddress) {
      throw new Error("Service not initialized");
    }

    const network = NETWORK_CONFIGS[chain];
    if (!network) {
      throw new Error(`Invalid chain: ${chain}`);
    }

    // Find the compatible wallet for this chain type to get the correct address
    const compatibleWallet = this.wallets.find((w) => {
      try {
        const creator = this.adapterFactory.getCreator(network.type);
        return creator?.canHandle(w) ?? false;
      } catch {
        return false;
      }
    });

    if (!compatibleWallet) {
      throw new Error(`No compatible wallet for ${network.type} network`);
    }

    const adapter = await this.getAdapterForChain(chain);
    return this.balanceService.getUSDCBalance(
      adapter,
      chain,
      compatibleWallet.address,
    );
  }

  /**
   * Estimate bridge costs and fees
   */
  async estimate(params: BridgeParams): Promise<BridgeEstimate> {
    this.validateBridgeParams(params);

    if (!this.userAddress) {
      throw new Error("Bridge service not initialized");
    }

    const fromAdapter = await this.getAdapterForChain(params.fromChain);
    const toAdapter = await this.getAdapterForChain(params.toChain);

    try {
      const transferSpeed = getTransferSpeed(params.transferMethod);
      const estimate = await this.kit.estimate({
        from: { adapter: fromAdapter, chain: params.fromChain },
        to: {
          adapter: toAdapter,
          chain: params.toChain,
          ...(params.recipientAddress && {
            recipientAddress: params.recipientAddress,
          }),
        },
        amount: params.amount,
        config: { transferSpeed },
      });

      const gasFees = estimate.gasFees ?? [];
      const providerFees = estimate.fees ?? [];

      const totalGasFee = gasFees
        .reduce((sum, fee) => {
          const feeAmount = parseFloat(fee?.fees?.fee ?? "0");
          return sum + feeAmount;
        }, 0)
        .toFixed(9);

      const totalProviderFee = providerFees
        .reduce((sum, fee) => {
          const feeAmount = parseFloat(fee?.amount ?? "0");
          return sum + feeAmount;
        }, 0)
        .toFixed(6);

      const firstGasFee = gasFees[0];

      return {
        fees: {
          network: firstGasFee?.blockchain ?? "unknown",
          bridge: "0", // CCTP has no bridge fees
          total: totalGasFee,
        },
        gasFees: {
          source: gasFees.find((f) => f.name === "Burn")?.fees?.fee ?? "0",
          destination: gasFees.find((f) => f.name === "Mint")?.fees?.fee,
        },
        estimatedTime: getAttestationTime(
          params.fromChain,
          params.transferMethod === "fast",
        ),
        receiveAmount: (
          parseFloat(params.amount) - parseFloat(totalProviderFee)
        ).toString(),
        detailedGasFees: gasFees.map((fee) => ({
          name: fee.name,
          token: fee.token,
          blockchain: fee.blockchain,
          fees: {
            gas: fee.fees?.gas ?? 0n,
            gasPrice: fee.fees?.gasPrice ?? 0n,
            fee: fee.fees?.fee ?? "0",
          },
        })),
        providerFees: providerFees.map((fee) => ({
          type: fee.type,
          token: fee.token,
          amount: fee.amount ?? "0",
        })),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to estimate bridge costs: ${message}`);
    }
  }

  /**
   * Execute a bridge transaction
   */
  async bridge(params: BridgeParams): Promise<BridgeTransaction> {
    this.validateBridgeParams(params);

    if (!this.userAddress) {
      throw new Error("Bridge service not initialized");
    }

    if (!isRouteSupported(params.fromChain, params.toChain)) {
      throw new Error(
        `Route not supported: ${params.fromChain} -> ${params.toChain}`,
      );
    }

    const context = await this.createOperationContext(params);
    const transaction = this.createInitialTransaction(context);

    // Capture provider fee for fast transfers (for auditing/stats)
    if (params.transferMethod === "fast") {
      try {
        const estimate = await this.estimate(params);
        if (estimate.providerFees?.length) {
          const totalProviderFee = estimate.providerFees.reduce(
            (sum, fee) => sum + parseFloat(fee.amount),
            0,
          );
          transaction.providerFeeUsdc = totalProviderFee.toString();
        }
      } catch {
        // Non-critical: continue without fee tracking if estimate fails
        console.warn("[Bridge] Failed to capture provider fee for tracking");
      }
    }

    await this.storage.saveTransaction(transaction);

    // Add transaction to Zustand array for stats tracking (so updateTransaction can find it)
    useBridgeStore.getState().addTransaction(transaction);

    // Set current transaction before starting so event callbacks can update it
    useBridgeStore.getState().setCurrentTransaction(transaction);

    // Create dedicated kit for this transaction with isolated event stream
    const transactionKit = this.eventManager.createTransactionKit(
      transaction.id,
      (updatedTx) => this.syncTransactionState(updatedTx),
    );

    try {
      await this.executeBridgeOperation(context, transaction, transactionKit);
    } catch (error) {
      await this.handleBridgeError(transaction, error);
    } finally {
      this.eventManager.disposeTransactionKit(transaction.id);
    }

    transaction.updatedAt = Date.now();
    await this.storage.saveTransaction(transaction);
    this.syncTransactionState(transaction);

    return transaction;
  }

  /**
   * Retry a failed transaction using Bridge Kit's retry API
   */
  async retry(transactionId: string): Promise<BridgeTransaction> {
    if (!this.userAddress) {
      throw new Error("Bridge service not initialized");
    }

    const originalTx = await this.storage.getTransaction(transactionId);
    if (!originalTx) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    if (originalTx.userAddress !== this.userAddress) {
      throw new Error("Transaction does not belong to current user");
    }

    if (originalTx.status !== "failed") {
      throw new Error(
        `Only failed transactions can be retried. Current status: ${originalTx.status}`,
      );
    }

    if (!originalTx.bridgeResult) {
      throw new Error(
        "Cannot retry: original bridge result not found. Please create a new transaction instead.",
      );
    }

    // Use uncached adapters for retry to avoid concurrent transaction conflicts
    const fromAdapter = await this.getTransactionAdapterForChain(
      originalTx.fromChain,
    );
    const toAdapter = await this.getTransactionAdapterForChain(
      originalTx.toChain,
    );
    const bridgeResult = originalTx.bridgeResult as BridgeResult;

    // Ensure destination chain is added BEFORE Bridge Kit execution
    // This is critical because Bridge Kit uses raw EIP-1193 provider directly
    await this.ensureDestinationChainReady(originalTx.toChain);

    // Determine which chain to switch to based on transaction state
    // If approve/burn steps are incomplete, we need source chain; otherwise destination for mint
    const needsSourceChain = originalTx.steps.some(
      (step) =>
        (step.name.toLowerCase() === "approve" ||
          step.name.toLowerCase() === "burn") &&
        step.status !== "completed",
    );

    if (needsSourceChain) {
      // Switch to source chain for approve/burn retry
      const fromNetwork = NETWORK_CONFIGS[originalTx.fromChain];
      if (fromNetwork.type === "evm" && fromNetwork.evmChainId) {
        const evmWallet = this.wallets.find((w) => w.chainType === "evm");
        if (evmWallet) {
          await EVMAdapterCreator.switchNetwork(
            evmWallet,
            fromNetwork.evmChainId,
            originalTx.fromChain,
          );
        }
      }
      // Solana doesn't require explicit network switching
    }
    // No else needed - Bridge Kit will handle switching to destination for mint

    // Reuse existing transaction to keep same ID for windows and event tracking
    const transaction = originalTx;
    transaction.status = "pending";
    transaction.error = undefined;
    transaction.updatedAt = Date.now();

    transaction.steps = transaction.steps.map((step) => {
      if (step.status === "completed") {
        return { ...step, error: undefined };
      }

      // Check SDK's step state as fallback for edge cases
      const sdkStep = bridgeResult.steps.find(
        (s) => s.name.toLowerCase() === step.name.toLowerCase(),
      );

      if (
        sdkStep &&
        (sdkStep.state === "success" || sdkStep.state === "noop")
      ) {
        return {
          ...step,
          status: "completed" as const,
          txHash: "txHash" in sdkStep ? String(sdkStep.txHash) : step.txHash,
          error: undefined,
        };
      }

      return {
        ...step,
        status: "pending" as const,
        txHash: undefined,
        error: undefined,
        timestamp: Date.now(),
      };
    });

    await this.storage.saveTransaction(transaction);
    useBridgeStore.getState().setCurrentTransaction(transaction);

    // Create dedicated kit for retry operation with isolated event stream
    const retryKit = this.eventManager.createTransactionKit(
      transaction.id,
      (updatedTx) => this.syncTransactionState(updatedTx),
    );

    try {
      transaction.status = "bridging";
      const stepToRetry = transaction.steps.find((s) => s.status === "pending");
      if (stepToRetry) {
        stepToRetry.status = "in_progress";
      }
      await this.storage.saveTransaction(transaction);

      const retryResult = await retryKit.retry(bridgeResult, {
        from: fromAdapter,
        to: toAdapter,
      });

      transaction.bridgeResult = retryResult;
      await this.processBridgeResult(transaction, retryResult);
    } catch (error) {
      await this.handleBridgeError(transaction, error);
    } finally {
      this.eventManager.disposeTransactionKit(transaction.id);
    }

    transaction.updatedAt = Date.now();
    await this.storage.saveTransaction(transaction);
    this.syncTransactionState(transaction);

    return transaction;
  }

  /**
   * Resume an in-progress transaction after page refresh.
   * This is used to continue attestation polling and bridge completion
   * when the page is refreshed during an active bridge operation.
   *
   * @param transactionId - ID of the transaction to resume
   * @returns The resumed transaction (updated as it progresses)
   */
  async resume(transactionId: string): Promise<BridgeTransaction> {
    if (!this.userAddress) {
      throw new Error("Bridge service not initialized");
    }

    const transaction = await this.storage.getTransaction(transactionId);
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    if (transaction.userAddress !== this.userAddress) {
      throw new Error("Transaction does not belong to current user");
    }

    // Only allow resuming in-progress transactions
    const resumableStatuses = [
      "bridging",
      "confirming",
      "pending",
      "approving",
      "approved",
    ];
    if (!resumableStatuses.includes(transaction.status)) {
      if (transaction.status === "completed") {
        // Already done, just return it
        return transaction;
      }
      if (transaction.status === "failed") {
        throw new Error("Use retry() for failed transactions");
      }
      throw new Error(
        `Cannot resume transaction with status: ${transaction.status}`,
      );
    }

    // Must have bridgeResult to resume (this contains the state needed by Bridge Kit)
    if (!transaction.bridgeResult) {
      throw new Error(
        "Cannot resume: no bridge result stored. Transaction may need to be restarted.",
      );
    }

    // Use uncached adapters for resume to avoid concurrent transaction conflicts
    const fromAdapter = await this.getTransactionAdapterForChain(
      transaction.fromChain,
    );
    const toAdapter = await this.getTransactionAdapterForChain(
      transaction.toChain,
    );
    const bridgeResult = transaction.bridgeResult as BridgeResult;

    // Ensure destination chain is added BEFORE Bridge Kit execution
    // This is critical because Bridge Kit uses raw EIP-1193 provider directly
    await this.ensureDestinationChainReady(transaction.toChain);

    // Determine which chain to switch to based on transaction state
    // If approve/burn steps are incomplete, we need source chain; otherwise destination for mint
    const needsSourceChain = transaction.steps.some(
      (step) =>
        (step.name.toLowerCase() === "approve" ||
          step.name.toLowerCase() === "burn") &&
        step.status !== "completed",
    );

    if (needsSourceChain) {
      // Switch to source chain for remaining source operations
      const fromNetwork = NETWORK_CONFIGS[transaction.fromChain];
      if (fromNetwork.type === "evm" && fromNetwork.evmChainId) {
        const evmWallet = this.wallets.find((w) => w.chainType === "evm");
        if (evmWallet) {
          await EVMAdapterCreator.switchNetwork(
            evmWallet,
            fromNetwork.evmChainId,
            transaction.fromChain,
          );
        }
      }
      // Solana doesn't require explicit network switching
    }
    // No else needed - Bridge Kit will handle switching to destination for mint

    // Update store to indicate we're resuming
    useBridgeStore.getState().setCurrentTransaction(transaction);

    // Create dedicated kit for resume operation with isolated event stream
    const resumeKit = this.eventManager.createTransactionKit(
      transaction.id,
      (updatedTx) => this.syncTransactionState(updatedTx),
    );

    try {
      // Use kit.retry() to continue from where we left off
      // Bridge Kit's retry handles resumption internally based on bridgeResult state
      const retryResult = await resumeKit.retry(bridgeResult, {
        from: fromAdapter,
        to: toAdapter,
      });

      transaction.bridgeResult = retryResult;
      await this.processBridgeResult(transaction, retryResult);
    } catch (error) {
      // If retry throws, handle the error but keep transaction resumable if possible
      await this.handleBridgeError(transaction, error);
    } finally {
      this.eventManager.disposeTransactionKit(transaction.id);
    }

    transaction.updatedAt = Date.now();
    await this.storage.saveTransaction(transaction);
    this.syncTransactionState(transaction);

    return transaction;
  }

  /**
   * Recover a stuck transaction without bridgeResult.
   * Uses Circle's IRIS API directly to fetch attestation and execute mint,
   * bypassing kit.retry() entirely.
   *
   * This handles the case where user refreshes during attestation polling
   * and bridgeResult was never saved (it only exists after kit.bridge() completes).
   *
   * @param transactionId - ID of the transaction to recover
   * @returns The recovered transaction (updated as it progresses)
   */
  async recover(transactionId: string): Promise<BridgeTransaction> {
    if (!this.userAddress) {
      throw new Error("Bridge service not initialized");
    }

    const transaction = await this.storage.getTransaction(transactionId);
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    if (transaction.userAddress !== this.userAddress) {
      throw new Error("Transaction does not belong to current user");
    }

    // Guard: Early exit for terminal states to prevent repeated calls
    if (
      transaction.status === "completed" ||
      transaction.status === "cancelled"
    ) {
      console.log(
        "[Recovery] Skipping - transaction already in terminal state:",
        transaction.status,
      );
      return transaction;
    }

    // Only recover in-progress transactions
    const recoverableStatuses = [
      "bridging",
      "confirming",
      "pending",
      "approving",
      "approved",
    ];
    if (!recoverableStatuses.includes(transaction.status)) {
      if (transaction.status === "failed") {
        throw new Error("Use retry() for failed transactions");
      }
      throw new Error(
        `Cannot recover transaction with status: ${transaction.status}`,
      );
    }

    // If we have bridgeResult, use resume() instead
    if (transaction.bridgeResult) {
      return this.resume(transactionId);
    }

    // Must have burn step completed to recover (need the burn tx hash)
    const burnStep = transaction.steps.find((s) => s.id === "burn");
    if (!burnStep?.txHash) {
      throw new Error(
        "Cannot recover: burn step incomplete. Transaction may need to be restarted.",
      );
    }

    // Get chain configs
    const fromConfig = NETWORK_CONFIGS[transaction.fromChain];
    const toConfig = NETWORK_CONFIGS[transaction.toChain];

    if (!fromConfig || !toConfig) {
      throw new Error("Invalid chain configuration");
    }

    const isTestnet = fromConfig.environment === "testnet";
    const sourceDomain = fromConfig.cctpDomain;

    if (sourceDomain === undefined) {
      throw new Error(
        `CCTP domain not configured for ${transaction.fromChain}`,
      );
    }

    // Update store to indicate we're recovering
    useBridgeStore.getState().setCurrentTransaction(transaction);

    console.log("[Recovery] Starting recovery for transaction", {
      transactionId,
      burnTxHash: burnStep.txHash,
      sourceDomain,
      isTestnet,
    });

    try {
      // Update attestation step to in_progress
      const attestationStep = transaction.steps.find(
        (s) => s.id === "attestation",
      );
      if (attestationStep) {
        attestationStep.status = "in_progress";
        await this.storage.saveTransaction(transaction);
        this.syncTransactionState(transaction);
      }

      // 1. Fetch attestation from IRIS API
      let attestation = await fetchAttestation(
        sourceDomain,
        burnStep.txHash,
        isTestnet,
      );

      // 2. Handle expired attestation - request re-attestation
      if (attestation?.status === "expired") {
        console.log(
          "[Recovery] Attestation expired, requesting re-attestation",
        );
        await requestReAttestation(attestation.decodedMessage.nonce, isTestnet);
        // Poll again for fresh attestation
        attestation = await fetchAttestation(
          sourceDomain,
          burnStep.txHash,
          isTestnet,
        );
      }

      if (attestation?.status !== "complete") {
        throw new Error(
          "Attestation not ready yet. Please try again in a few minutes.",
        );
      }

      // Mark attestation step complete
      if (attestationStep) {
        attestationStep.status = "completed";
        attestationStep.timestamp = Date.now();
        transaction.attestationHash = attestation.attestation;
        await this.storage.saveTransaction(transaction);
        this.syncTransactionState(transaction);
      }

      console.log("[Recovery] Attestation fetched successfully", {
        status: attestation.status,
        hasMessage: !!attestation.message,
        hasAttestation: !!attestation.attestation,
      });

      // 3. Execute mint based on destination chain type
      const mintStep = transaction.steps.find((s) => s.id === "mint");
      if (mintStep) {
        mintStep.status = "in_progress";
        await this.storage.saveTransaction(transaction);
        this.syncTransactionState(transaction);
      }

      let mintTxHash: string;
      switch (toConfig.type) {
        case "evm":
          // Execute receiveMessage (mint) directly on destination chain
          mintTxHash = await this.executeReceiveMessage(
            transaction.toChain,
            attestation.message,
            attestation.attestation,
          );
          console.log("[Recovery] EVM mint executed successfully", {
            mintTxHash,
          });
          break;

        case "solana":
          // Execute receiveMessage via Solana adapter
          mintTxHash = await this.executeSolanaReceiveMessage(
            transaction,
            attestation,
          );
          console.log("[Recovery] Solana mint executed successfully", {
            mintTxHash,
          });
          break;

        case "sui":
          // TODO: Implement SUI mint execution when SUI adapter is available
          throw new Error("SUI recovery not yet implemented");

        default: {
          const _exhaustive: never = toConfig.type;
          throw new Error(
            `Unsupported destination chain type: ${String(_exhaustive)}`,
          );
        }
      }

      // 4. Update transaction as completed
      if (mintStep) {
        mintStep.status = "completed";
        mintStep.txHash = mintTxHash;
        mintStep.timestamp = Date.now();
      }
      transaction.destinationTxHash = mintTxHash;
      transaction.status = "completed";
      transaction.completedAt = Date.now();
    } catch (error) {
      // Mark transaction as failed but keep it recoverable
      const errorMessage =
        error instanceof Error ? error.message : "Unknown recovery error";
      transaction.error = errorMessage;

      // Only mark as failed if it's a permanent error
      if (!errorMessage.includes("not ready yet")) {
        transaction.status = "failed";
        const mintStep = transaction.steps.find((s) => s.id === "mint");
        if (mintStep?.status === "in_progress") {
          mintStep.status = "failed";
          mintStep.error = errorMessage;
        }
      }

      console.error("[Recovery] Failed:", error);
    }

    transaction.updatedAt = Date.now();
    await this.storage.saveTransaction(transaction);
    this.syncTransactionState(transaction);

    return transaction;
  }

  /**
   * Execute receiveMessage on the destination chain's MessageTransmitter contract.
   * This mints USDC by providing the CCTP message and Circle's attestation.
   */
  private async executeReceiveMessage(
    destinationChain: SupportedChainId,
    message: string,
    attestation: string,
  ): Promise<string> {
    // Get CCTP config from SDK
    const cctpConfig = getChainCctpConfig(destinationChain);
    if (!cctpConfig) {
      throw new Error(
        `CCTP not supported for ${destinationChain}. Chain may not have CCTP v2 configured.`,
      );
    }

    const viemChain = createViemChainFromSdk(destinationChain);
    if (!viemChain) {
      throw new Error(`Failed to create viem chain for ${destinationChain}`);
    }

    const network = NETWORK_CONFIGS[destinationChain];
    if (!network) {
      throw new Error(`Network config not found for ${destinationChain}`);
    }

    // Find the compatible EVM wallet for the destination chain
    const evmWallet = this.wallets.find((w) => {
      try {
        const creator = this.adapterFactory.getCreator(network.type);
        return creator?.canHandle(w) ?? false;
      } catch {
        return false;
      }
    });

    if (!evmWallet) {
      throw new Error("No EVM wallet connected for destination chain");
    }

    // Switch wallet to destination chain before executing receiveMessage
    // This is critical after page refresh when wallet may be on wrong network
    if (network.evmChainId) {
      await EVMAdapterCreator.switchNetwork(
        evmWallet,
        network.evmChainId,
        destinationChain,
      );
    }

    // Get the EIP-1193 provider from the wallet using IWallet interface
    if (!evmWallet.getEVMProvider) {
      throw new Error("Wallet does not support EVM provider");
    }
    const provider = await evmWallet.getEVMProvider();

    // Create viem wallet client
    const walletClient = createWalletClient({
      chain: viemChain,
      transport: custom(provider as Parameters<typeof custom>[0]),
    });

    // Get the account address
    const [account] = await walletClient.getAddresses();
    if (!account) {
      throw new Error("No account available in wallet");
    }

    // Encode the function call
    const data = encodeFunctionData({
      abi: MESSAGE_TRANSMITTER_ABI,
      functionName: "receiveMessage",
      args: [message as `0x${string}`, attestation as `0x${string}`],
    });

    // Send the transaction
    const txHash = await walletClient.sendTransaction({
      account,
      to: cctpConfig.messageTransmitter,
      data,
      chain: viemChain,
    });

    return txHash;
  }

  /**
   * Execute receiveMessage on Solana via the adapter's CCTP action.
   * Uses the Circle Solana adapter's built-in receiveMessage implementation
   * which handles all the complex PDA derivation and instruction building.
   */
  private async executeSolanaReceiveMessage(
    transaction: BridgeTransaction,
    attestation: AttestationMessage,
  ): Promise<string> {
    const fromConfig = NETWORK_CONFIGS[transaction.fromChain];
    const toConfig = NETWORK_CONFIGS[transaction.toChain];

    if (!fromConfig || !toConfig) {
      throw new Error("Invalid chain configuration for Solana mint");
    }

    // Get the Solana adapter
    const solanaAdapter = await this.getAdapterForChain(transaction.toChain);

    console.log("[Recovery] Executing Solana receiveMessage", {
      fromChain: transaction.fromChain,
      toChain: transaction.toChain,
      eventNonce: attestation.eventNonce,
    });

    // Resolve chain identifiers to ChainDefinition objects
    // The adapter expects ChainDefinitionWithCCTPv2, not string IDs
    // Our supported chains all have CCTP v2 support, so the cast is safe
    // ChainDefinitionWithCCTPv2 is not exported from bridge-kit, so we use any
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
    const fromChainDef = resolveChainIdentifier(transaction.fromChain) as any;
    const toChainDef = resolveChainIdentifier(transaction.toChain) as any;

    // Prepare the receiveMessage action using the adapter
    // The adapter handles all the complex Solana-specific logic:
    // - PDA derivation (message_transmitter, token_messenger, etc.)
    // - Anchor instruction building
    // - Account resolution
    const prepared = await solanaAdapter.prepareAction(
      "cctp.v2.receiveMessage",
      {
        fromChain: fromChainDef,
        toChain: toChainDef,
        message: attestation.message,
        attestation: attestation.attestation,
        eventNonce: attestation.eventNonce,
      },
      // Operation context - chain is required for the adapter
      { chain: toChainDef },
    );
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */

    // Execute the prepared transaction
    // execute() returns the transaction signature (hash) directly as a string
    const txHash = await prepared.execute();

    if (!txHash) {
      throw new Error(
        "Solana receiveMessage execution failed: no transaction hash returned",
      );
    }

    return txHash;
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(
    transactionId: string,
  ): Promise<BridgeTransaction | null> {
    const tx = await this.storage.getTransaction(transactionId);
    return tx ?? null;
  }

  /**
   * Get all transactions for current user
   */
  async getTransactions(): Promise<BridgeTransaction[]> {
    if (!this.userAddress) {
      return [];
    }

    return this.storage.getTransactionsByUser(this.userAddress);
  }

  /**
   * Check if a route is supported
   */
  async supportsRoute(
    from: SupportedChainId,
    to: SupportedChainId,
  ): Promise<boolean> {
    try {
      return isRouteSupported(from, to);
    } catch {
      return false;
    }
  }

  /**
   * Reset the service (useful when switching accounts)
   */
  reset(): void {
    this.eventManager.dispose();
    this.adapterFactory.clearCache(this.userAddress ?? undefined);
    this.userAddress = null;
    this.wallets = [];
  }

  // ==================== Private Helper Methods ====================

  /**
   * Ensure the destination chain is added to the wallet before Bridge Kit tries to use it.
   * This ONLY adds the chain - it does NOT switch to it.
   * Bridge Kit will handle switching to the destination chain during the mint step.
   */
  private async ensureDestinationChainReady(
    toChain: SupportedChainId,
  ): Promise<void> {
    const toNetwork = NETWORK_CONFIGS[toChain];

    if (toNetwork.type !== "evm" || !toNetwork.evmChainId) {
      // Non-EVM chains don't need this
      return;
    }

    const evmWallet = this.wallets.find((w) => w.chainType === "evm");
    if (!evmWallet?.addChain) {
      return;
    }

    // Get the viem chain config for this destination
    const viemChain = getViemChain(toChain);
    if (!viemChain) {
      console.warn(
        `[Bridge] No viem chain config for ${toChain}, skipping pre-add`,
      );
      return;
    }

    try {
      // ONLY add the chain - do NOT switch to it
      // wallet_addEthereumChain will no-op if chain already exists in most wallets
      await evmWallet.addChain(viemChain);
      console.log(
        `[Bridge] Destination chain ${toChain} (${toNetwork.evmChainId}) added to wallet`,
      );
    } catch (error) {
      // Log but don't fail - chain might already exist, or Bridge Kit can try later
      console.warn(`[Bridge] Failed to pre-add destination chain:`, error);
    }
  }

  /**
   * Validate bridge parameters
   */
  private validateBridgeParams(params: BridgeParams): void {
    if (!params.fromChain) {
      throw new Error("Source chain is required");
    }

    if (!params.toChain) {
      throw new Error("Destination chain is required");
    }

    if (params.fromChain === params.toChain) {
      throw new Error("Source and destination chains must be different");
    }

    if (!params.amount || parseFloat(params.amount) <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Validate amount format
    const amountNum = parseFloat(params.amount);
    if (isNaN(amountNum)) {
      throw new Error("Invalid amount format");
    }

    // USDC has 6 decimals, validate decimal places
    const decimals = params.amount.split(".")[1]?.length ?? 0;
    if (decimals > 6) {
      throw new Error("Amount has too many decimal places (max 6 for USDC)");
    }
  }

  /**
   * Create operation context with adapters
   * Handles network switching for EVM destination chains before adapter creation
   */
  private async createOperationContext(
    params: BridgeParams,
  ): Promise<BridgeOperationContext> {
    const fromNetwork = NETWORK_CONFIGS[params.fromChain];
    const toNetwork = NETWORK_CONFIGS[params.toChain];

    // Switch wallets to correct network before creating adapters
    // Source network switching FIRST - user needs this for approve/burn steps
    if (params.sourceWallet) {
      switch (fromNetwork.type) {
        case "evm":
          if (fromNetwork.evmChainId) {
            await EVMAdapterCreator.switchNetwork(
              params.sourceWallet,
              fromNetwork.evmChainId,
              params.fromChain,
            );
          }
          break;
        case "solana":
          // Solana doesn't require explicit network switching
          break;
        case "sui":
          // TODO: Add SUI network switching when SUI adapter is available
          break;
      }
    }

    // Destination network switching SECOND (for mint step, handled later by Bridge Kit)
    // Only switch if different wallet, otherwise Bridge Kit will handle mint step switching
    if (params.destWallet && params.destWallet !== params.sourceWallet) {
      switch (toNetwork.type) {
        case "evm":
          if (toNetwork.evmChainId) {
            await EVMAdapterCreator.switchNetwork(
              params.destWallet,
              toNetwork.evmChainId,
              params.toChain,
            );
          }
          break;
        case "solana":
          // Solana doesn't require explicit network switching
          break;
        case "sui":
          // TODO: Add SUI network switching when SUI adapter is available
          break;
      }
    }

    // Get wallet addresses for source and destination chains
    // These may differ from userAddress when bridging between EVM and Solana
    const sourceAddress = this.getWalletAddressForChain(
      params.fromChain,
      params.sourceWallet,
    );
    const destinationAddress =
      params.recipientAddress ??
      this.getWalletAddressForChain(params.toChain, params.destWallet);

    // Create uncached adapters for bridge operation to avoid concurrent transaction conflicts
    // where multiple transactions sharing the same adapter can cause duplicate wallet popups
    const fromAdapter = await this.getTransactionAdapterForChainWithWallet(
      params.fromChain,
      params.sourceWallet,
    );
    const toAdapter = await this.getTransactionAdapterForChainWithWallet(
      params.toChain,
      params.destWallet,
    );

    return {
      transactionId: nanoid(),
      userAddress: this.userAddress!,
      fromChain: params.fromChain,
      toChain: params.toChain,
      amount: params.amount,
      token: params.token ?? "USDC",
      recipientAddress: params.recipientAddress,
      transferSpeed: getTransferSpeed(params.transferMethod),
      fromAdapter,
      toAdapter,
      sourceAddress,
      destinationAddress,
    };
  }

  /**
   * Create initial transaction record
   */
  private createInitialTransaction(
    context: BridgeOperationContext,
  ): BridgeTransaction {
    return {
      id: context.transactionId,
      userAddress: context.userAddress,
      fromChain: context.fromChain,
      toChain: context.toChain,
      amount: context.amount,
      token: context.token,
      status: "pending",
      steps: [
        {
          id: "approve",
          name: "Approve",
          status: "pending",
          timestamp: Date.now(),
        },
        {
          id: "burn",
          name: "Burn",
          status: "pending",
          timestamp: Date.now(),
        },
        {
          id: "attestation",
          name: "Attestation",
          status: "pending",
          timestamp: Date.now(),
        },
        {
          id: "mint",
          name: "Mint",
          status: "pending",
          timestamp: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      estimatedTime: getAttestationTime(
        context.fromChain,
        context.transferSpeed === "FAST",
      ),
      // Wallet addresses for auditing (actual chain-specific addresses)
      sourceAddress: context.sourceAddress,
      destinationAddress: context.destinationAddress,
      // Transfer method tracking
      transferMethod: context.transferSpeed === "FAST" ? "fast" : "standard",
    };
  }

  /**
   * Execute the bridge operation
   */
  private async executeBridgeOperation(
    context: BridgeOperationContext,
    transaction: BridgeTransaction,
    kit: BridgeKit,
  ): Promise<void> {
    // Ensure destination chain is added BEFORE Bridge Kit tries to switch to it
    // This is critical because Bridge Kit uses the raw EIP-1193 provider directly
    await this.ensureDestinationChainReady(context.toChain);

    transaction.status = "bridging";
    const firstStep = transaction.steps[0];
    if (firstStep) {
      firstStep.status = "in_progress";
    }

    transaction.recipientAddress = context.recipientAddress;

    await this.storage.saveTransaction(transaction);

    // Sync state to UI BEFORE blocking call to kit.bridge()
    // This ensures the approve step shows "in_progress" immediately
    this.syncTransactionState(transaction);

    // Use the transaction-specific kit (events are routed to this transaction only)
    const result: BridgeResult = await kit.bridge({
      from: { adapter: context.fromAdapter, chain: context.fromChain },
      to: {
        adapter: context.toAdapter,
        chain: context.toChain,
        ...(context.recipientAddress && {
          recipientAddress: context.recipientAddress,
        }),
      },
      amount: context.amount,
      token: "USDC",
      config: { transferSpeed: context.transferSpeed },
    });

    transaction.bridgeResult = result;

    await this.processBridgeResult(transaction, result);
  }

  /**
   * Process bridge result and update transaction
   */
  private async processBridgeResult(
    transaction: BridgeTransaction,
    result: BridgeResult,
  ): Promise<void> {
    if (result.state === "success") {
      transaction.status = "completed";
      transaction.completedAt = Date.now();

      this.updateStepsFromResult(transaction, result);

      transaction.steps.forEach((step) => {
        if (step.status !== "completed") {
          step.status = "completed";
        }
      });

      this.extractTransactionHashes(transaction, result);
    } else {
      transaction.status = "failed";

      const errorMessage = this.extractErrorMessage(result);
      transaction.error = errorMessage;

      this.updateStepsFromResult(transaction, result);
    }

    transaction.updatedAt = Date.now();
    await this.storage.saveTransaction(transaction);
  }

  /**
   * Extract transaction hashes from bridge result
   */
  private extractTransactionHashes(
    transaction: BridgeTransaction,
    result: BridgeResult,
  ): void {
    if (!result.steps || result.steps.length === 0) return;

    const burnStep = result.steps.find((s) =>
      s.name?.toLowerCase().includes("burn"),
    );
    if (burnStep && "txHash" in burnStep && burnStep.txHash) {
      transaction.sourceTxHash = String(burnStep.txHash);
    }

    const mintStep = result.steps.find((s) =>
      s.name?.toLowerCase().includes("mint"),
    );
    if (mintStep && "txHash" in mintStep && mintStep.txHash) {
      transaction.destinationTxHash = String(mintStep.txHash);
    }
  }

  /**
   * Extract error message from result
   */
  private extractErrorMessage(result: BridgeResult): string {
    const errorStep = result.steps.find((s) => s.state === "error");

    if (errorStep && "errorMessage" in errorStep && errorStep.errorMessage) {
      return String(errorStep.errorMessage);
    }

    if (errorStep && "error" in errorStep && errorStep.error instanceof Error) {
      return errorStep.error.message;
    }

    return "Bridge transaction failed";
  }

  /**
   * Update transaction steps from result
   * Matches Bridge Kit steps by name to our transaction steps
   * Also manages the virtual "Attestation" step
   */
  private updateStepsFromResult(
    transaction: BridgeTransaction,
    result: BridgeResult,
  ): void {
    if (!result.steps) return;

    // Track if burn completed and mint started for attestation step
    let burnCompleted = false;
    let mintStartedOrCompleted = false;

    result.steps.forEach((resultStep) => {
      const stepName = String(resultStep.name).toLowerCase();
      const matchingStep = transaction.steps.find(
        (s) => s.name.toLowerCase() === stepName,
      );

      if (!matchingStep) {
        // Skip warning for attestation since it's not in Bridge Kit
        if (stepName !== "attestation") {
          console.warn(
            `No matching step found for Bridge Kit step: ${resultStep.name}`,
          );
        }
        return;
      }

      // Guard: Never downgrade a completed step unless Bridge Kit marks it as failed
      // This prevents losing progress when resuming and Bridge Kit returns steps as "pending"
      if (matchingStep.status === "completed" && resultStep.state !== "error") {
        // Preserve completed status, but still capture txHash if available
        if (
          "txHash" in resultStep &&
          resultStep.txHash &&
          !matchingStep.txHash
        ) {
          matchingStep.txHash = String(resultStep.txHash);
        }
        // Track state for attestation step logic
        if (stepName === "burn") burnCompleted = true;
        if (stepName === "mint") mintStartedOrCompleted = true;
        matchingStep.timestamp = Date.now();
        return; // Skip - step is already completed
      }

      if (resultStep.state === "success") {
        matchingStep.status = "completed";
        matchingStep.error = undefined; // Clear any stale errors from previous attempts
        if (stepName === "burn") burnCompleted = true;
      } else if (resultStep.state === "error") {
        matchingStep.status = "failed";
      } else if (resultStep.state === "pending") {
        matchingStep.status = "in_progress";
        if (stepName === "mint") mintStartedOrCompleted = true;
      } else if (resultStep.state === "noop") {
        // noop means the step was not needed (e.g., already approved)
        matchingStep.status = "completed";
      }

      // Track mint progress - include "error" because if mint failed,
      // it means it was attempted, which means attestation completed
      if (
        stepName === "mint" &&
        (resultStep.state === "success" ||
          resultStep.state === "pending" ||
          resultStep.state === "error")
      ) {
        mintStartedOrCompleted = true;
      }

      if ("txHash" in resultStep && resultStep.txHash) {
        matchingStep.txHash = String(resultStep.txHash);
      }

      if (resultStep.state === "error") {
        if ("errorMessage" in resultStep && resultStep.errorMessage) {
          matchingStep.error = String(resultStep.errorMessage);
        } else if ("error" in resultStep) {
          // Bridge Kit might include raw error objects
          const errorObj = resultStep.error;
          if (errorObj instanceof Error) {
            matchingStep.error = errorObj.message;
          } else if (errorObj && typeof errorObj === "object") {
            // Extract meaningful error message from object without JSON.stringify
            // Try common error message properties with type guards
            let message = "Transaction step failed";
            if ("message" in errorObj && typeof errorObj.message === "string") {
              message = errorObj.message;
            } else if (
              "reason" in errorObj &&
              typeof errorObj.reason === "string"
            ) {
              message = errorObj.reason;
            } else if (
              "code" in errorObj &&
              typeof errorObj.code === "string"
            ) {
              message = errorObj.code;
            }
            matchingStep.error = message;
          } else {
            matchingStep.error = String(errorObj);
          }
        }
      }

      matchingStep.timestamp = Date.now();
    });

    const attestationStep = transaction.steps.find(
      (s) => s.id === "attestation",
    );
    if (attestationStep) {
      if (mintStartedOrCompleted) {
        // Mint has started or completed, so attestation is done
        attestationStep.status = "completed";
        attestationStep.timestamp = Date.now();
      } else if (burnCompleted) {
        // Burn completed but mint hasn't started, attestation is in progress
        attestationStep.status = "in_progress";
        attestationStep.timestamp = Date.now();
      }
    }
  }

  /**
   * Handle bridge execution errors
   */
  private async handleBridgeError(
    transaction: BridgeTransaction,
    error: unknown,
  ): Promise<void> {
    transaction.status = "failed";
    transaction.error =
      error instanceof Error ? error.message : "Unknown bridge error";

    const firstStep = transaction.steps[0];
    if (firstStep) {
      firstStep.status = "failed";
      firstStep.error = transaction.error;
    }

    console.error("Bridge execution failed:", error);
  }
}

// Singleton instance
let bridgeServiceInstance: CCTPBridgeService | null = null;

/**
 * Get bridge service instance
 */
export function getBridgeService(): CCTPBridgeService {
  if (!bridgeServiceInstance) {
    bridgeServiceInstance = new CCTPBridgeService();
  }
  return bridgeServiceInstance;
}
