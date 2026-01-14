import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { BridgeTransaction } from "./types";

/**
 * IndexedDB schema for bridge transactions
 */
interface BridgeDB extends DBSchema {
  transactions: {
    key: string;
    value: BridgeTransaction;
    indexes: {
      "by-user": string;
      "by-status": string;
      "by-user-and-status": [string, string];
      "by-created": number;
    };
  };
}

const DB_NAME = "cctp-bridge";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<BridgeDB> | null = null;

/**
 * Initialize and get database instance for transactions
 */
async function getDB(): Promise<IDBPDatabase<BridgeDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<BridgeDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const txStore = db.createObjectStore("transactions", {
        keyPath: "id",
      });

      txStore.createIndex("by-user", "userAddress");
      txStore.createIndex("by-status", "status");
      txStore.createIndex("by-user-and-status", ["userAddress", "status"]);
      txStore.createIndex("by-created", "createdAt");
    },
  });

  return dbInstance;
}

/**
 * Storage service for bridge transactions
 */
export class BridgeStorage {
  /**
   * Save a transaction
   */
  static async saveTransaction(transaction: BridgeTransaction): Promise<void> {
    const db = await getDB();
    await db.put("transactions", transaction);
  }

  /**
   * Get a transaction by ID
   */
  static async getTransaction(
    id: string,
  ): Promise<BridgeTransaction | undefined> {
    const db = await getDB();
    return db.get("transactions", id);
  }

  /**
   * Get all transactions for a user
   */
  static async getTransactionsByUser(
    userAddress: string,
  ): Promise<BridgeTransaction[]> {
    const db = await getDB();
    return db.getAllFromIndex("transactions", "by-user", userAddress);
  }

  /**
   * Get transactions by user and status
   */
  static async getTransactionsByUserAndStatus(
    userAddress: string,
    status: string,
  ): Promise<BridgeTransaction[]> {
    const db = await getDB();
    return db.getAllFromIndex("transactions", "by-user-and-status", [
      userAddress,
      status,
    ]);
  }

  /**
   * Get recent transactions for a user
   */
  static async getRecentTransactions(
    userAddress: string,
    limit = 10,
  ): Promise<BridgeTransaction[]> {
    const db = await getDB();
    const allTxs = await db.getAllFromIndex(
      "transactions",
      "by-user",
      userAddress,
    );

    return allTxs.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }

  /**
   * Update transaction status
   */
  static async updateTransactionStatus(
    id: string,
    status: BridgeTransaction["status"],
    error?: string,
  ): Promise<void> {
    const db = await getDB();
    const tx = await db.get("transactions", id);

    if (tx) {
      tx.status = status;
      tx.updatedAt = Date.now();
      if (error) tx.error = error;
      if (status === "completed") tx.completedAt = Date.now();

      await db.put("transactions", tx);
    }
  }

  /**
   * Update transaction step
   */
  static async updateTransactionStep(
    id: string,
    stepId: string,
    updates: Partial<BridgeTransaction["steps"][0]>,
  ): Promise<void> {
    const db = await getDB();
    const tx = await db.get("transactions", id);

    if (tx) {
      const stepIndex = tx.steps.findIndex((s) => s.id === stepId);
      if (stepIndex !== -1 && tx.steps[stepIndex]) {
        tx.steps[stepIndex] = { ...tx.steps[stepIndex], ...updates };
        tx.updatedAt = Date.now();
        await db.put("transactions", tx);
      }
    }
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(id: string): Promise<void> {
    const db = await getDB();
    await db.delete("transactions", id);
  }

  /**
   * Clear all transactions for a user
   */
  static async clearUserTransactions(userAddress: string): Promise<void> {
    const db = await getDB();
    const txs = await db.getAllFromIndex(
      "transactions",
      "by-user",
      userAddress,
    );

    const deletePromises = txs.map((tx) => db.delete("transactions", tx.id));
    await Promise.all(deletePromises);
  }

  /**
   * Get failed transactions that can be retried
   */
  static async getRetryableTransactions(
    userAddress: string,
  ): Promise<BridgeTransaction[]> {
    const db = await getDB();
    const failedTxs = await db.getAllFromIndex(
      "transactions",
      "by-user-and-status",
      [userAddress, "failed"],
    );

    // Filter transactions that have actionable failures
    return failedTxs.filter((tx) => {
      // Check if any step failed but transaction was partially completed
      const hasCompletedSteps = tx.steps.some((s) => s.status === "completed");
      const hasFailedSteps = tx.steps.some((s) => s.status === "failed");
      return hasCompletedSteps && hasFailedSteps;
    });
  }
}
