/**
 * Dynamic Solana Wallet Provider Adapter
 * Wraps Dynamic's Solana wallet to match the SolanaWalletProvider interface required by Circle's adapter
 */

import type {
  Connection,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import type { SolanaWallet } from "@dynamic-labs/solana-core";

/**
 * SolanaWalletProvider interface required by @circle-fin/adapter-solana
 */
export interface SolanaWalletProvider {
  /** Whether the wallet is currently connected */
  isConnected: boolean;
  /** The current public key of the connected wallet */
  publicKey?: {
    toString(): string;
  };
  /** Connect to the wallet */
  connect(): Promise<{
    publicKey: {
      toString(): string;
    };
  }>;
  /** Disconnect from the wallet */
  disconnect(): Promise<void>;
  /** Sign a transaction */
  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
  ): Promise<T>;
  /** Sign multiple transactions */
  signAllTransactions?<T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ): Promise<T[]>;
  /** Sign a message */
  signMessage?(message: Uint8Array): Promise<{
    signature: Uint8Array;
  }>;
}

/**
 * Adapter that wraps Dynamic's Solana wallet to match the SolanaWalletProvider interface
 */
export class DynamicSolanaWalletAdapter implements SolanaWalletProvider {
  private wallet: SolanaWallet;
  private _publicKey: string | null = null;
  private _isConnected = false;

  constructor(wallet: SolanaWallet) {
    this.wallet = wallet;

    this._publicKey = wallet.address;
    // Check if wallet appears to be connected (has address)
    this._isConnected = !!wallet.address;
  }

  get isConnected(): boolean {
    return this._isConnected && !!this._publicKey;
  }

  get publicKey():
    | {
        toString(): string;
      }
    | undefined {
    if (!this._publicKey) return undefined;

    return {
      toString: () => this._publicKey!,
    };
  }

  async connect(): Promise<{
    publicKey: {
      toString(): string;
    };
  }> {
    try {
      // Ensure wallet is connected
      if (!this.wallet.address) {
        await this.wallet.connector.connect();
      }

      this._publicKey = this.wallet.address;
      this._isConnected = true;

      if (!this._publicKey) {
        throw new Error("Failed to get wallet address");
      }

      return {
        publicKey: {
          toString: () => this._publicKey!,
        },
      };
    } catch (error) {
      console.error("Failed to connect Solana wallet:", error);
      throw new Error(
        `Failed to connect: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.wallet.connector.endSession();
      this._isConnected = false;
      this._publicKey = null;
    } catch (error) {
      console.error("Failed to disconnect Solana wallet:", error);
      throw error;
    }
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
  ): Promise<T> {
    if (!this.isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      const signer = await this.wallet.getSigner();
      return await signer.signTransaction(transaction);
    } catch (error) {
      console.error("Failed to sign transaction:", error);
      throw new Error(
        `Failed to sign transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ): Promise<T[]> {
    if (!this.isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      const signer = await this.wallet.getSigner();

      // Sign all transactions if the signer supports it
      if (signer.signAllTransactions) {
        return await signer.signAllTransactions(transactions);
      }

      // Otherwise, sign them one by one
      const signedTxs: T[] = [];
      for (const tx of transactions) {
        const signed = await signer.signTransaction(tx);
        signedTxs.push(signed);
      }
      return signedTxs;
    } catch (error) {
      console.error("Failed to sign transactions:", error);
      throw new Error(
        `Failed to sign transactions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async signMessage(message: Uint8Array): Promise<{
    signature: Uint8Array;
  }> {
    if (!this.isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      const signer = await this.wallet.getSigner();

      const { signature } = await signer.signMessage(message);
      return {
        signature,
      };
    } catch (error) {
      console.error("Failed to sign message:", error);
      throw new Error(
        `Failed to sign message: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get Solana connection from the wallet
   */
  async getConnection(): Promise<Connection> {
    try {
      return await this.wallet.getConnection();
    } catch (error) {
      console.error("Failed to get connection:", error);
      throw new Error(
        `Failed to get connection: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
