import { BridgeKit, type BridgeResult } from "@circle-fin/bridge-kit";
import type { AdapterContext } from "@circle-fin/bridge-kit";
import { nanoid } from "nanoid";
import type { IWallet } from "~/lib/wallet/types";
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
    this.kit = new BridgeKit();
    this.adapterFactory = config.adapterFactory ?? getAdapterFactory();
    this.balanceService = config.balanceService ?? getBalanceService();
    this.storage = config.storage ?? BridgeStorage;
    this.eventManager = new BridgeEventManager(this.kit, this.storage);
  }

  /**
   * Sync transaction state to all consumers (store, windows)
   * Uses queueMicrotask to ensure React processes updates immediately
   */
  private syncTransactionState(transaction: BridgeTransaction): void {
    queueMicrotask(() => {
      const state = useBridgeStore.getState();
      state.updateTransaction(transaction.id, transaction);
      state.setCurrentTransaction(transaction);
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
    await this.storage.saveTransaction(transaction);

    // Set current transaction before starting so event callbacks can update it
    useBridgeStore.getState().setCurrentTransaction(transaction);

    this.eventManager.trackTransaction(transaction.id, (updatedTx) => {
      this.syncTransactionState(updatedTx);
    });

    try {
      await this.executeBridgeOperation(context, transaction);
    } catch (error) {
      await this.handleBridgeError(transaction, error);
    } finally {
      this.eventManager.untrackTransaction(transaction.id);
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

    const fromAdapter = await this.getAdapterForChain(originalTx.fromChain);
    const toAdapter = await this.getAdapterForChain(originalTx.toChain);
    const bridgeResult = originalTx.bridgeResult as BridgeResult;

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

    this.eventManager.trackTransaction(transaction.id, (updatedTx) => {
      this.syncTransactionState(updatedTx);
    });

    try {
      transaction.status = "bridging";
      const stepToRetry = transaction.steps.find((s) => s.status === "pending");
      if (stepToRetry) {
        stepToRetry.status = "in_progress";
      }
      await this.storage.saveTransaction(transaction);

      const retryResult = await this.kit.retry(bridgeResult, {
        from: fromAdapter,
        to: toAdapter,
      });

      transaction.bridgeResult = retryResult;
      await this.processBridgeResult(transaction, retryResult);
    } catch (error) {
      await this.handleBridgeError(transaction, error);
    } finally {
      this.eventManager.untrackTransaction(transaction.id);
    }

    transaction.updatedAt = Date.now();
    await this.storage.saveTransaction(transaction);
    this.syncTransactionState(transaction);

    return transaction;
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

    // Switch EVM wallets to correct network before creating adapters
    if (toNetwork.type === "evm" && toNetwork.evmChainId && params.destWallet) {
      await EVMAdapterCreator.switchNetwork(
        params.destWallet,
        toNetwork.evmChainId,
      );
    }

    if (
      fromNetwork.type === "evm" &&
      fromNetwork.evmChainId &&
      params.sourceWallet
    ) {
      await EVMAdapterCreator.switchNetwork(
        params.sourceWallet,
        fromNetwork.evmChainId,
      );
    }

    // Create adapters using explicit wallets if provided
    const fromAdapter = await this.getAdapterForChainWithWallet(
      params.fromChain,
      params.sourceWallet,
    );
    const toAdapter = await this.getAdapterForChainWithWallet(
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
    };
  }

  /**
   * Execute the bridge operation
   */
  private async executeBridgeOperation(
    context: BridgeOperationContext,
    transaction: BridgeTransaction,
  ): Promise<void> {
    transaction.status = "bridging";
    const firstStep = transaction.steps[0];
    if (firstStep) {
      firstStep.status = "in_progress";
    }

    transaction.recipientAddress = context.recipientAddress;

    await this.storage.saveTransaction(transaction);

    const result: BridgeResult = await this.kit.bridge({
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
