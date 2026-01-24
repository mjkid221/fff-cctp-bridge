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
   * Get all notifications (sorted by timestamp desc)
   */
  static async getAll(): Promise<Notification[]> {
    const db = await getDB();
    const all = await db.getAll("notifications");
    return all.sort((a, b) => b.timestamp - a.timestamp);
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
  static async getRecent(limit = 50): Promise<Notification[]> {
    const all = await this.getAll();
    return all.slice(0, limit);
  }
}
