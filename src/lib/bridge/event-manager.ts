/**
 * Bridge Event Manager
 *
 * Subscribes to Bridge Kit events and provides real-time step updates
 * to storage and UI as bridge operations execute.
 */

import type { BridgeKit } from "@circle-fin/bridge-kit";
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
 * Centralized manager for Bridge Kit event subscriptions
 * Handles real-time step updates as bridge operations execute
 */
export class BridgeEventManager {
  private kit: BridgeKit;
  private storage: typeof BridgeStorage;
  private trackedTransactions: Map<string, (tx: BridgeTransaction) => void>;
  private eventHandlers: Array<() => void>; // Cleanup functions

  constructor(kit: BridgeKit, storage: typeof BridgeStorage) {
    this.kit = kit;
    this.storage = storage;
    this.trackedTransactions = new Map();
    this.eventHandlers = [];

    this.setupEventListeners();
  }

  /**
   * Subscribe to all Bridge Kit events using wildcard listener
   */
  private setupEventListeners(): void {
    const handler = (event: BridgeKitEventHandler) => {
      // Normalize the event for internal handling
      const normalizedEvent: NormalizedBridgeEvent = {
        method: event.method,
        values: event.values as NormalizedBridgeEvent["values"],
      };
      // Update all tracked transactions based on event
      for (const [txId, callback] of this.trackedTransactions.entries()) {
        void this.handleStepUpdate(txId, normalizedEvent, callback);
      }
    };

    this.kit.on("*", handler);

    // Store cleanup function
    this.eventHandlers.push(() => this.kit.off("*", handler));
  }

  /**
   * Handle a step update from a Bridge Kit event
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

  /**
   * Start tracking a transaction's events
   *
   * @param txId - Transaction ID to track
   * @param callback - Called when transaction is updated by events
   */
  trackTransaction(
    txId: string,
    callback: (tx: BridgeTransaction) => void,
  ): void {
    this.trackedTransactions.set(txId, callback);
  }

  /**
   * Stop tracking a transaction
   *
   * @param txId - Transaction ID to stop tracking
   */
  untrackTransaction(txId: string): void {
    this.trackedTransactions.delete(txId);
  }

  /**
   * Clean up all event listeners
   * Should be called when service is reset or disposed
   */
  dispose(): void {
    // Clean up all event listeners
    this.eventHandlers.forEach((cleanup) => cleanup());
    this.eventHandlers = [];
    this.trackedTransactions.clear();
  }
}
