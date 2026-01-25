/**
 * IndexedDB storage for notifications
 * Mirrors BridgeStorage pattern for consistency
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Notification } from "./types";

interface NotificationDB extends DBSchema {
  notifications: {
    key: string;
    value: Notification;
    indexes: {
      "by-timestamp": number;
      "by-status": string;
      "by-transaction": string;
    };
  };
}

const DB_NAME = "cctp-bridge-notifications";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<NotificationDB> | null = null;

/**
 * Initialize and get database instance for notifications
 */
async function getDB(): Promise<IDBPDatabase<NotificationDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<NotificationDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore("notifications", {
        keyPath: "id",
      });

      store.createIndex("by-timestamp", "timestamp");
      store.createIndex("by-status", "status");
      store.createIndex("by-transaction", "bridgeTransactionId");
    },
  });

  return dbInstance;
}

/**
 * Storage service for notifications
 */
export class NotificationStorage {
  /**
   * Get all notifications using cursor-based query (sorted by timestamp desc)
   * @param limit Optional limit for number of notifications to return
   */
  static async getAll(limit?: number): Promise<Notification[]> {
    const db = await getDB();
    const results: Notification[] = [];

    let cursor = await db
      .transaction("notifications")
      .store.index("by-timestamp")
      .openCursor(null, "prev");

    while (cursor && (limit === undefined || results.length < limit)) {
      results.push(cursor.value);
      cursor = await cursor.continue();
    }

    return results;
  }

  /**
   * Save a notification
   */
  static async save(notification: Notification): Promise<void> {
    const db = await getDB();
    await db.put("notifications", notification);
  }

  /**
   * Get a notification by ID
   */
  static async get(id: string): Promise<Notification | undefined> {
    const db = await getDB();
    return db.get("notifications", id);
  }

  /**
   * Update a notification
   */
  static async update(
    id: string,
    updates: Partial<Omit<Notification, "id" | "timestamp">>,
  ): Promise<void> {
    const db = await getDB();
    const existing = await db.get("notifications", id);

    if (existing) {
      await db.put("notifications", { ...existing, ...updates });
    }
  }

  /**
   * Remove a notification
   */
  static async remove(id: string): Promise<void> {
    const db = await getDB();
    await db.delete("notifications", id);
  }

  /**
   * Find notification by bridge transaction ID
   */
  static async getByTransactionId(
    txId: string,
  ): Promise<Notification | undefined> {
    const db = await getDB();
    return db.getFromIndex("notifications", "by-transaction", txId);
  }

  /**
   * Clear all notifications
   */
  static async clearAll(): Promise<void> {
    const db = await getDB();
    await db.clear("notifications");
  }

  /**
   * Get recent notifications (limited)
   */
  static async getRecent(limit = 100): Promise<Notification[]> {
    return this.getAll(limit);
  }

  /**
   * Prune old notifications, keeping only the most recent ones
   * @returns Number of notifications deleted
   */
  static async pruneOld(keep = 100): Promise<number> {
    const db = await getDB();
    const all = await db.getAll("notifications");

    if (all.length <= keep) return 0;

    const sorted = all.sort((a, b) => b.timestamp - a.timestamp);
    const toDelete = sorted.slice(keep);

    const tx = db.transaction("notifications", "readwrite");
    await Promise.all(toDelete.map((n) => tx.store.delete(n.id)));
    await tx.done;

    return toDelete.length;
  }
}
