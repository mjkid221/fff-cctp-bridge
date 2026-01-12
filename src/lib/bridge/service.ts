import { BridgeKit, type BridgeResult } from "@circle-fin/bridge-kit";
import type { AdapterContext } from "@circle-fin/bridge-kit";
import { nanoid } from "nanoid";
import type {
  Wallet,
  WalletConnectorCore,
} from "@dynamic-labs/wallet-connector-core";
import type {
  BridgeEstimate,
  BridgeParams,
  BridgeTransaction,
  IBridgeService,
} from "./types";
import { BridgeStorage } from "./storage";
import { NETWORK_CONFIGS, isRouteSupported } from "./networks";
import type { SupportedChainId } from "./networks";
import { getAdapterFactory, type AdapterFactory, EVMAdapterCreator } from "./adapters/factory";
import { getBalanceService, type BalanceService } from "./balance/service";
import type { TokenBalance } from "./balance/service";
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
  fromAdapter: AdapterContext["adapter"];
  toAdapter: AdapterContext["adapter"];
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
  private wallet: Wallet<WalletConnectorCore.WalletConnector> | null = null;
  private wallets: Wallet<WalletConnectorCore.WalletConnector>[] = [];

  constructor(config: BridgeServiceConfig = {}) {
    this.kit = new BridgeKit();
    this.adapterFactory = config.adapterFactory ?? getAdapterFactory();
    this.balanceService = config.balanceService ?? getBalanceService();
    this.storage = config.storage ?? BridgeStorage;
    this.eventManager = new BridgeEventManager(this.kit, this.storage);
  }

  /**
   * Initialize the bridge service with user wallet
   */
  async initialize(
    wallet?: Wallet<WalletConnectorCore.WalletConnector>,
    allWallets?: Wallet<WalletConnectorCore.WalletConnector>[],
  ): Promise<void> {
    if (!wallet?.address) {
      throw new Error("Address is required");
    }

    this.userAddress = wallet?.address ?? null;
    this.wallet = wallet ?? null;
    this.wallets = allWallets ?? (wallet ? [wallet] : []);

    // Clear adapter cache for previous wallet
    this.adapterFactory.clearCache();

    console.log(
      `Bridge service initialized for ${this.userAddress} with ${this.wallets.length} wallet(s)`,
    );
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
    wallet?: Wallet<WalletConnectorCore.WalletConnector>,
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

    const adapter = await this.getAdapterForChain(chain);
    return this.balanceService.getUSDCBalance(adapter, chain, this.userAddress);
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
      });

      // Process the estimate result
      const gasFees = estimate.gasFees ?? [];
      const providerFees = estimate.fees ?? [];

      // Calculate total gas fees
      const totalGasFee = gasFees
        .reduce((sum, fee) => {
          const feeAmount = parseFloat(fee?.fees?.fee ?? "0");
          return sum + feeAmount;
        }, 0)
        .toFixed(9);

      // Calculate total provider fees
      const totalProviderFee = providerFees
        .reduce((sum, fee) => {
          const feeAmount = parseFloat(fee?.amount ?? "0");
          return sum + feeAmount;
        }, 0)
        .toFixed(6);

      // Get first gas fee for network info
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
        estimatedTime: getAttestationTime(params.fromChain), // Chain-specific attestation time
        receiveAmount: (
          parseFloat(params.amount) - parseFloat(totalProviderFee)
        ).toString(), // Subtract provider fees
        // Add detailed breakdown
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

    // Validate the route
    if (!isRouteSupported(params.fromChain, params.toChain)) {
      throw new Error(
        `Route not supported: ${params.fromChain} -> ${params.toChain}`,
      );
    }

    // Create operation context
    const context = await this.createOperationContext(params);

    // Create initial transaction record
    const transaction = this.createInitialTransaction(context);

    // Save to storage
    await this.storage.saveTransaction(transaction);

    // Set as current transaction BEFORE starting bridge
    // This allows event callbacks to update it during execution
    useBridgeStore.getState().setCurrentTransaction(transaction);

    // Start tracking events BEFORE bridge executes
    this.eventManager.trackTransaction(transaction.id, (updatedTx) => {
      // Use queueMicrotask to ensure React processes the state update
      // Without this, updates may be batched and not render until execution completes
      queueMicrotask(() => {
        const state = useBridgeStore.getState();

        // Update the transactions array
        state.updateTransaction(transaction.id, updatedTx);

        // Update currentTransaction for UI reactivity
        state.setCurrentTransaction(updatedTx);

        // Update the transaction in any open windows (multi-window support)
        state.updateTransactionInWindow(transaction.id, updatedTx);

        console.log(
          `[Bridge Service] Updated transaction ${transaction.id.substring(0, 8)}... in store and windows`,
        );
      });
    });

    try {
      // Execute the bridge operation
      await this.executeBridgeOperation(context, transaction);
    } catch (error) {
      // Handle bridge execution errors
      await this.handleBridgeError(transaction, error);
    } finally {
      // Stop tracking when done
      this.eventManager.untrackTransaction(transaction.id);
    }

    // Save final state
    transaction.updatedAt = Date.now();
    await this.storage.saveTransaction(transaction);

    // Update the store with the final transaction state
    // This is needed because processBridgeResult updates the transaction after
    // the last EventManager callback fires, so the store may not have the final state
    const state = useBridgeStore.getState();
    state.updateTransaction(transaction.id, transaction);
    state.setCurrentTransaction(transaction);
    state.updateTransactionInWindow(transaction.id, transaction);

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

    // Get adapters for retry
    const fromAdapter = await this.getAdapterForChain(originalTx.fromChain);
    const toAdapter = await this.getAdapterForChain(originalTx.toChain);

    // Get completed steps from the original bridgeResult
    const bridgeResult = originalTx.bridgeResult as BridgeResult;

    // Reuse the existing transaction - update in place instead of creating new
    // This keeps the same ID, so windows and event tracking work automatically
    const transaction = originalTx;

    // Reset transaction state for retry
    transaction.status = "pending";
    transaction.error = undefined;
    transaction.updatedAt = Date.now();

    // Reset failed/pending steps, keep completed steps
    transaction.steps = transaction.steps.map((step) => {
      // Keep completed steps as-is
      if (step.status === "completed") {
        return {
          ...step,
          error: undefined, // Clear any stale error
        };
      }

      // FALLBACK: Check bridgeResult.steps for SDK's knowledge
      // This handles edge cases where our steps weren't updated
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

      // Reset non-completed steps for retry
      return {
        ...step,
        status: "pending" as const,
        txHash: undefined,
        error: undefined,
        timestamp: Date.now(),
      };
    });

    // Save updated transaction (same ID)
    await this.storage.saveTransaction(transaction);

    // Set as current transaction BEFORE starting retry
    useBridgeStore.getState().setCurrentTransaction(transaction);

    // Start tracking events BEFORE retry executes
    // Same transaction ID means existing window will receive updates
    this.eventManager.trackTransaction(transaction.id, (updatedTx) => {
      queueMicrotask(() => {
        const state = useBridgeStore.getState();
        state.updateTransaction(transaction.id, updatedTx);
        state.setCurrentTransaction(updatedTx);
        state.updateTransactionInWindow(transaction.id, updatedTx);

        console.log(
          `[Bridge Service] Updated transaction ${transaction.id.substring(0, 8)}... in store and windows (retry)`,
        );
      });
    });

    try {
      // Update status to bridging
      transaction.status = "bridging";
      // Find the first pending step (the one that needs retry) and set it to in_progress
      const stepToRetry = transaction.steps.find((s) => s.status === "pending");
      if (stepToRetry) {
        stepToRetry.status = "in_progress";
      }
      await this.storage.saveTransaction(transaction);

      // Use Bridge Kit's retry API with the original bridgeResult
      const retryResult = await this.kit.retry(bridgeResult, {
        from: fromAdapter,
        to: toAdapter,
      });

      // Store the retry result
      transaction.bridgeResult = retryResult;

      // Process the result
      await this.processBridgeResult(transaction, retryResult);
    } catch (error) {
      // Handle retry errors
      await this.handleBridgeError(transaction, error);
    } finally {
      // Stop tracking when done
      this.eventManager.untrackTransaction(transaction.id);
    }

    // Save final state
    transaction.updatedAt = Date.now();
    await this.storage.saveTransaction(transaction);

    // Update the store with the final transaction state
    const state = useBridgeStore.getState();
    state.updateTransaction(transaction.id, transaction);
    state.setCurrentTransaction(transaction);
    state.updateTransactionInWindow(transaction.id, transaction);

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
    _token = "USDC",
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
    this.wallet = null;
    this.wallets = [];
    console.log("Bridge service reset");
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

    // CRITICAL: For EVM destination chains, switch the EVM wallet to the correct network
    // BEFORE creating the adapter. This prevents "Unrecognized chain ID" errors when
    // the primary wallet is a different chain type (e.g., Solana)
    if (toNetwork.type === "evm" && toNetwork.evmChainId && params.destWallet) {
      console.log(
        `[Bridge Service] Switching destination EVM wallet to chain ${toNetwork.evmChainId} (${params.toChain})`,
      );
      await EVMAdapterCreator.switchNetwork(
        params.destWallet,
        toNetwork.evmChainId,
      );
    }

    // Similarly handle source chain EVM network switching if needed
    if (fromNetwork.type === "evm" && fromNetwork.evmChainId && params.sourceWallet) {
      console.log(
        `[Bridge Service] Switching source EVM wallet to chain ${fromNetwork.evmChainId} (${params.fromChain})`,
      );
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
      estimatedTime: getAttestationTime(context.fromChain), // Chain-specific attestation time
    };
  }

  /**
   * Execute the bridge operation
   */
  private async executeBridgeOperation(
    context: BridgeOperationContext,
    transaction: BridgeTransaction,
  ): Promise<void> {
    // Update status to bridging
    transaction.status = "bridging";
    const firstStep = transaction.steps[0];
    if (firstStep) {
      firstStep.status = "in_progress";
    }

    // Store recipient address for retry
    transaction.recipientAddress = context.recipientAddress;

    await this.storage.saveTransaction(transaction);

    // Execute bridge through Circle's Bridge Kit
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
    });

    // Store the bridge result for potential retry
    transaction.bridgeResult = result;

    // Process the result
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

      // Update steps from result (marks as completed and extracts hashes)
      this.updateStepsFromResult(transaction, result);

      // Mark any remaining steps as completed (in case result has fewer steps)
      transaction.steps.forEach((step) => {
        if (step.status !== "completed") {
          step.status = "completed";
        }
      });

      // Extract transaction hashes
      this.extractTransactionHashes(transaction, result);
    } else {
      transaction.status = "failed";

      // Extract error information
      const errorMessage = this.extractErrorMessage(result);
      transaction.error = errorMessage;

      // Update steps based on result
      this.updateStepsFromResult(transaction, result);
    }

    // Save transaction with updated steps immediately
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

    // Find burn step
    const burnStep = result.steps.find((s) =>
      s.name?.toLowerCase().includes("burn"),
    );
    if (burnStep && "txHash" in burnStep && burnStep.txHash) {
      transaction.sourceTxHash = String(burnStep.txHash);
    }

    // Find mint step
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
      // Match by step name (case-insensitive)
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

      // Update step status based on Bridge Kit state
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

      // Extract transaction hash if available
      if ("txHash" in resultStep && resultStep.txHash) {
        matchingStep.txHash = String(resultStep.txHash);
      }

      // Extract error if step failed
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

      // Update timestamp
      matchingStep.timestamp = Date.now();
    });

    // Manage virtual attestation step
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

    // Mark first step as failed
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
