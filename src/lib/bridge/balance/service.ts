/**
 * Balance Service - Fetch USDC balances for all supported networks
 * Uses direct contract reads via adapters
 */

import type { AdapterContext } from "@circle-fin/bridge-kit";
import type { SupportedChainId } from "../networks";
import type { TokenBalance } from "../types";
import { NETWORK_CONFIGS } from "../networks";

/**
 * Balance Service for fetching token balances across all networks
 */
export class BalanceService {
  /**
   * Get USDC balance for a specific chain
   */
  async getUSDCBalance(
    adapter: AdapterContext["adapter"],
    chain: SupportedChainId,
    walletAddress: string,
  ): Promise<TokenBalance> {
    const network = NETWORK_CONFIGS[chain];

    try {
      switch (network.type) {
        case "evm":
          return await this.getEVMBalance(adapter, chain, walletAddress);
        case "solana":
          return await this.getSolanaBalance(adapter, chain, walletAddress);
        case "sui":
          // TODO: Implement SUI balance fetching when SUI adapter is available
          throw new Error("SUI balance fetching not yet implemented");
        default: {
          const _exhaustive: never = network.type;
          throw new Error(`Unsupported network type: ${String(_exhaustive)}`);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch balance for ${chain}:`, error);
      // Return zero balance on error instead of throwing
      return {
        balance: "0",
        formatted: "0.00",
        decimals: 6,
        symbol: "USDC",
      };
    }
  }

  /**
   * Get EVM token balance using Circle's adapter prepare/execute pattern
   */
  private async getEVMBalance(
    adapter: AdapterContext["adapter"],
    chain: SupportedChainId,
    walletAddress: string,
  ): Promise<TokenBalance> {
    try {
      const balanceRequest = await adapter.prepareAction(
        "usdc.balanceOf",
        {
          walletAddress,
        },
        { chain },
      );
      const balance = await balanceRequest.execute();

      const decimals = 6; // USDC has 6 decimals
      const formatted = this.formatBalance(balance, decimals);

      return {
        balance,
        formatted,
        decimals,
        symbol: "USDC",
      };
    } catch (error) {
      console.error("Failed to fetch EVM balance:", error);
      return {
        balance: "0",
        formatted: "0.00",
        decimals: 6,
        symbol: "USDC",
      };
    }
  }

  /**
   * Get Solana token balance using Circle's adapter prepareAction pattern
   * Uses SPL token associated token account balance
   */
  private async getSolanaBalance(
    adapter: AdapterContext["adapter"],
    chain: SupportedChainId,
    walletAddress: string,
  ): Promise<TokenBalance> {
    try {
      // Use Circle's Solana adapter pattern for USDC balance
      // Based on @circle-fin/adapter-solana balanceOf implementation
      const prepared = await adapter.prepareAction(
        "usdc.balanceOf",
        {
          walletAddress,
        },
        { chain },
      );

      // Execute the prepared read-only contract call
      const balanceStr = await prepared.execute();

      const decimals = 6; // USDC has 6 decimals
      const formatted = this.formatBalance(balanceStr, decimals);

      return {
        balance: balanceStr,
        formatted,
        decimals,
        symbol: "USDC",
      };
    } catch (error) {
      console.error("Failed to fetch Solana balance:", error);
      // Return zero balance for missing ATA or other errors
      return {
        balance: "0",
        formatted: "0.00",
        decimals: 6,
        symbol: "USDC",
      };
    }
  }

  /**
   * Format raw balance to human-readable string
   */
  private formatBalance(rawBalance: string, decimals: number): string {
    try {
      const balance = BigInt(rawBalance);
      const divisor = BigInt(10 ** decimals);

      // Get integer and fractional parts
      const integerPart = balance / divisor;
      const fractionalPart = balance % divisor;

      // Format fractional part with leading zeros
      const fractionalStr = fractionalPart
        .toString()
        .padStart(decimals, "0")
        .slice(0, 2); // Show 2 decimal places

      return `${integerPart}.${fractionalStr}`;
    } catch (error) {
      console.error("Failed to format balance:", error);
      return "0.00";
    }
  }

  /**
   * Batch fetch balances for multiple chains
   */
  async getBalances(
    getAdapter: (chain: SupportedChainId) => Promise<AdapterContext["adapter"]>,
    chains: SupportedChainId[],
    walletAddress: string,
  ): Promise<Record<SupportedChainId, TokenBalance>> {
    const balancePromises = chains.map(async (chain) => {
      try {
        const adapter = await getAdapter(chain);
        const balance = await this.getUSDCBalance(
          adapter,
          chain,
          walletAddress,
        );
        return [chain, balance] as const;
      } catch (error) {
        console.error(`Failed to fetch balance for ${chain}:`, error);
        return [
          chain,
          {
            balance: "0",
            formatted: "0.00",
            decimals: 6,
            symbol: "USDC",
          },
        ] as const;
      }
    });

    const results = await Promise.all(balancePromises);
    return Object.fromEntries(results) as Record<
      SupportedChainId,
      TokenBalance
    >;
  }
}

// Singleton instance
let balanceServiceInstance: BalanceService | null = null;

/**
 * Get balance service instance
 */
export function getBalanceService(): BalanceService {
  if (!balanceServiceInstance) {
    balanceServiceInstance = new BalanceService();
  }
  return balanceServiceInstance;
}
