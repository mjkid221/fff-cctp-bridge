/**
 * Aggregate stats storage for bridge operations
 *
 * Stores lifetime stats per user separately from transaction history,
 * enabling safe pruning of old transactions without losing stats.
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

interface StatsDB extends DBSchema {
  stats: {
    key: string;
    value: UserStats;
  };
}

export interface UserStats {
  userAddress: string;
  totalBridged: number;
  totalTransactions: number;
  totalFeesPaid: number;
  fastTransactions: number;
  standardTransactions: number;
  lastUpdated: number;
}

const DB_NAME = "cctp-bridge-stats";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<StatsDB> | null = null;

async function getDB(): Promise<IDBPDatabase<StatsDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<StatsDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore("stats", { keyPath: "userAddress" });
    },
  });

  return dbInstance;
}

export class StatsStorage {
  static async get(userAddress: string): Promise<UserStats | undefined> {
    const db = await getDB();
    return db.get("stats", userAddress);
  }

  static async getOrCreate(userAddress: string): Promise<UserStats> {
    const existing = await this.get(userAddress);
    if (existing) return existing;

    const newStats: UserStats = {
      userAddress,
      totalBridged: 0,
      totalTransactions: 0,
      totalFeesPaid: 0,
      fastTransactions: 0,
      standardTransactions: 0,
      lastUpdated: Date.now(),
    };

    await this.save(newStats);
    return newStats;
  }

  static async save(stats: UserStats): Promise<void> {
    const db = await getDB();
    await db.put("stats", { ...stats, lastUpdated: Date.now() });
  }

  static async incrementOnComplete(
    userAddress: string,
    amount: number,
    isFast: boolean,
    providerFee = 0,
  ): Promise<void> {
    const stats = await this.getOrCreate(userAddress);

    stats.totalBridged += amount;
    stats.totalTransactions += 1;

    if (isFast) {
      stats.fastTransactions += 1;
      stats.totalFeesPaid += providerFee;
    } else {
      stats.standardTransactions += 1;
    }

    await this.save(stats);
  }

  static async clear(userAddress: string): Promise<void> {
    const db = await getDB();
    await db.delete("stats", userAddress);
  }
}
