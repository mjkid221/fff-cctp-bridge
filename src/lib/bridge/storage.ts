import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { BridgeTransaction } from "./types";

/**
 * Page result for cursor-based pagination
 */
export interface TransactionPage {
  transactions: BridgeTransaction[];
  nextCursor: number | null; // createdAt of last item, null if no more
}

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
      "by-user-and-created": [string, number];
    };
  };
}

const DB_NAME = "cctp-bridge";
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<BridgeDB> | null = null;

/**
 * Initialize and get database instance for transactions
 */
async function getDB(): Promise<IDBPDatabase<BridgeDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<BridgeDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      if (oldVersion < 1) {
        const txStore = db.createObjectStore("transactions", {
          keyPath: "id",
        });

        txStore.createIndex("by-user", "userAddress");
        txStore.createIndex("by-status", "status");
        txStore.createIndex("by-user-and-status", ["userAddress", "status"]);
        txStore.createIndex("by-created", "createdAt");
        txStore.createIndex("by-user-and-created", [
          "userAddress",
          "createdAt",
        ]);
      }

      if (oldVersion >= 1 && oldVersion < 2) {
        const txStore = transaction.objectStore("transactions");
        txStore.createIndex("by-user-and-created", [
          "userAddress",
          "createdAt",
        ]);
      }
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
   * Get recent transactions for a user using cursor-based query
   */
  static async getRecentTransactions(
    userAddress: string,
    limit = 100,
  ): Promise<BridgeTransaction[]> {
    const db = await getDB();
    const results: BridgeTransaction[] = [];

    const range = IDBKeyRange.bound(
      [userAddress, 0],
      [userAddress, Date.now()],
    );

    let cursor = await db
      .transaction("transactions")
      .store.index("by-user-and-created")
      .openCursor(range, "prev");

    while (cursor && results.length < limit) {
      results.push(cursor.value);
      cursor = await cursor.continue();
    }

    return results;
  }

  /**
   * Get transactions with cursor-based pagination for useInfiniteQuery
   * @param userAddress User's wallet address
   * @param limit Number of items per page
   * @param cursor createdAt timestamp to fetch items older than
   */
  static async getTransactionPage(
    userAddress: string,
    limit = 10,
    cursor?: number,
  ): Promise<TransactionPage> {
    const db = await getDB();
    const results: BridgeTransaction[] = [];

    // +1 to include current timestamp on first page
    const upperBound = cursor ?? Date.now() + 1;
    const range = IDBKeyRange.bound(
      [userAddress, 0],
      [userAddress, upperBound],
      false, // Include lower bound
      true, // Exclude upper bound (items with createdAt < cursor)
    );

    let dbCursor = await db
      .transaction("transactions")
      .store.index("by-user-and-created")
      .openCursor(range, "prev");

    while (dbCursor && results.length < limit) {
      results.push(dbCursor.value);
      dbCursor = await dbCursor.continue();
    }

    const lastItem = results[results.length - 1];
    const nextCursor = lastItem ? lastItem.createdAt : null;

    const hasMore = dbCursor !== null;

    return {
      transactions: results,
      nextCursor: hasMore ? nextCursor : null,
    };
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
   * Prune old transactions, keeping only the most recent ones
   * @returns Number of transactions deleted
   */
  static async pruneOldTransactions(
    userAddress: string,
    keep = 100,
  ): Promise<number> {
    const db = await getDB();
    const allTxs = await db.getAllFromIndex(
      "transactions",
      "by-user",
      userAddress,
    );

    if (allTxs.length <= keep) return 0;

    const sorted = allTxs.sort((a, b) => b.createdAt - a.createdAt);
    const toDelete = sorted.slice(keep);

    const tx = db.transaction("transactions", "readwrite");
    await Promise.all(toDelete.map((t) => tx.store.delete(t.id)));
    await tx.done;

    return toDelete.length;
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
