/**
 * Aggregate stats storage for bridge operations
 *
 * Stores lifetime stats per user separately from transaction history,
 * enabling safe pruning of old transactions without losing stats.
 * Stats are tracked separately for mainnet and testnet environments.
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { NetworkEnvironment } from "./networks";

interface StatsDB extends DBSchema {
  stats: {
    key: string;
    value: UserStats;
  };
}

export interface UserStats {
  userAddress: string;
  environment: NetworkEnvironment;
  totalBridged: number;
  totalTransactions: number;
  totalFeesPaid: number;
  fastTransactions: number;
  standardTransactions: number;
  lastUpdated: number;
}

const DB_NAME = "cctp-bridge-stats";
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<StatsDB> | null = null;

async function getDB(): Promise<IDBPDatabase<StatsDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<StatsDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Delete old object store if upgrading from version 1
      if (oldVersion === 1 && db.objectStoreNames.contains("stats")) {
        db.deleteObjectStore("stats");
      }
      // Create new object store without keyPath (we'll use explicit keys)
      if (!db.objectStoreNames.contains("stats")) {
        db.createObjectStore("stats");
      }
    },
  });

  return dbInstance;
}

/**
 * Generate composite key for stats lookup
 */
function getStatsKey(
  userAddress: string,
  environment: NetworkEnvironment,
): string {
  return `${userAddress.toLowerCase()}_${environment}`;
}

export class StatsStorage {
  static async get(
    userAddress: string,
    environment: NetworkEnvironment,
  ): Promise<UserStats | undefined> {
    const db = await getDB();
    const key = getStatsKey(userAddress, environment);
    return db.get("stats", key);
  }

  static async getOrCreate(
    userAddress: string,
    environment: NetworkEnvironment,
  ): Promise<UserStats> {
    const existing = await this.get(userAddress, environment);
    if (existing) return existing;

    const newStats: UserStats = {
      userAddress: userAddress.toLowerCase(),
      environment,
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
    const key = getStatsKey(stats.userAddress, stats.environment);
    await db.put("stats", { ...stats, lastUpdated: Date.now() }, key);
  }

  static async incrementOnComplete(
    userAddress: string,
    environment: NetworkEnvironment,
    amount: number,
    isFast: boolean,
    providerFee = 0,
  ): Promise<void> {
    const stats = await this.getOrCreate(userAddress, environment);

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

  static async clear(
    userAddress: string,
    environment: NetworkEnvironment,
  ): Promise<void> {
    const db = await getDB();
    const key = getStatsKey(userAddress, environment);
    await db.delete("stats", key);
  }
}
