/**
 * Bridge Event Manager
 *
 * Creates per-transaction BridgeKit instances to provide isolated event streams
 * for concurrent bridge operations. Each transaction gets its own kit with
 * dedicated event listeners, enabling multiple bridges to run simultaneously
 * without event cross-contamination.
 */

import { BridgeKit } from "@circle-fin/bridge-kit";
import type { BridgeTransaction } from "./types";
import type { BridgeStorage } from "./storage";

/**
 * Extract the event payload type from BridgeKit's wildcard event handler
 * This ensures type compatibility with the actual Bridge Kit event structure
 */
type BridgeKitEventHandler = Parameters<Parameters<BridgeKit["on"]>[1]>[0];

/**
 * Normalized event structure for internal use
 * Provides a simpler interface for handling Bridge Kit events
 */
interface NormalizedBridgeEvent {
  method: string;
  values?: {
    txHash?: string;
    data?: unknown;
  };
}

/**
 * Entry for tracking a transaction's kit instance and cleanup
 */
interface TransactionKitEntry {
  kit: BridgeKit;
  callback: (tx: BridgeTransaction) => void;
  cleanup: () => void;
}

/**
 * Centralized manager for Bridge Kit instances per transaction.
 * Each transaction gets its own BridgeKit with isolated event streams,
 * enabling true concurrent transaction support.
 */
export class BridgeEventManager {
  private storage: typeof BridgeStorage;
  private transactionKits: Map<string, TransactionKitEntry>;
  private cancelledTransactions = new Set<string>();

  constructor(storage: typeof BridgeStorage) {
    this.storage = storage;
    this.transactionKits = new Map();
  }

  /**
   * Mark a transaction as cancelled.
   * Disposes the kit (removes event listeners) and blocks future event processing.
   */
  markCancelled(txId: string): void {
    this.cancelledTransactions.add(txId);
    this.disposeTransactionKit(txId);
  }

  /**
   * Check if a transaction has been cancelled.
   */
  isCancelled(txId: string): boolean {
    return this.cancelledTransactions.has(txId);
  }

  /**
   * Create a new BridgeKit instance for a transaction.
   * Each transaction gets its own kit with isolated event streams.
   *
   * @param txId - Transaction ID to create kit for
   * @param callback - Called when transaction is updated by events
   * @returns The BridgeKit instance to use for this transaction
   */
  createTransactionKit(
    txId: string,
    callback: (tx: BridgeTransaction) => void,
  ): BridgeKit {
    // Dispose any existing kit for this transaction (e.g., retry scenario)
    this.disposeTransactionKit(txId);

    const kit = new BridgeKit();

    // Setup event listener scoped to this specific transaction
    const handler = (event: BridgeKitEventHandler) => {
      // Guard: ignore stale events from disposed/replaced kits
      // This prevents race conditions where events from a previous kit
      // (after dispose/recreate) could update the wrong transaction
      if (this.transactionKits.get(txId)?.kit !== kit) return;

      const normalizedEvent: NormalizedBridgeEvent = {
        method: event.method,
        values: event.values as NormalizedBridgeEvent["values"],
      };
      void this.handleStepUpdate(txId, normalizedEvent, callback);
    };

    kit.on("*", handler);
    const cleanup = () => kit.off("*", handler);

    this.transactionKits.set(txId, { kit, callback, cleanup });
    return kit;
  }

  /**
   * Clean up kit when transaction completes.
   * Removes event listeners and deletes from tracking map.
   *
   * @param txId - Transaction ID to stop tracking
   */
  disposeTransactionKit(txId: string): void {
    const entry = this.transactionKits.get(txId);
    if (entry) {
      entry.cleanup();
      this.transactionKits.delete(txId);
    }
  }

  /**
   * Clean up all event listeners and kits.
   * Should be called when service is reset or disposed.
   */
  dispose(): void {
    this.transactionKits.forEach((entry) => entry.cleanup());
    this.transactionKits.clear();
  }

  /**
   * Handle a step update from a Bridge Kit event.
   * Updates the transaction in storage and calls the callback.
   */
  private async handleStepUpdate(
    txId: string,
    event: NormalizedBridgeEvent,
    callback: (tx: BridgeTransaction) => void,
  ): Promise<void> {
    const stepMapping: Record<string, string> = {
      approve: "approve",
      burn: "burn",
      fetchAttestation: "attestation",
      mint: "mint",
    };

    const stepId = stepMapping[event.method];
    if (!stepId) return;

    // Skip updates for cancelled transactions
    if (this.cancelledTransactions.has(txId)) return;

    const tx = await this.storage.getTransaction(txId);
    if (!tx) return;

    const step = tx.steps.find((s) => s.id === stepId);
    if (!step) return;

    step.status = "completed";
    step.timestamp = Date.now();

    if (event.values?.txHash) {
      step.txHash = String(event.values.txHash);
    }

    // Handle special case: attestation completes when fetchAttestation fires
    if (stepId === "attestation" && typeof event.values?.data === "string") {
      tx.attestationHash = event.values.data; // Circle's attestation
    }

    // Step progression: When a step completes, mark the NEXT step as in_progress
    // Bridge Kit only emits events on step COMPLETION, not when steps START
    // So we need to advance the next step to in_progress here
    const stepOrder = ["approve", "burn", "attestation", "mint"];
    const currentIndex = stepOrder.indexOf(stepId);
    if (currentIndex >= 0 && currentIndex < stepOrder.length - 1) {
      const nextStepId = stepOrder[currentIndex + 1];
      const nextStep = tx.steps.find((s) => s.id === nextStepId);

      // Only advance if next step is pending (not already in_progress/completed)
      if (nextStep?.status === "pending") {
        nextStep.status = "in_progress";
        nextStep.timestamp = Date.now();
      }
    }

    tx.updatedAt = Date.now();
    await this.storage.saveTransaction(tx);

    callback(tx);
  }
}
