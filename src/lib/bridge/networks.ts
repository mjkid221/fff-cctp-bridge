/**
 * Network configuration for CCTP Bridge
 * Supports Ethereum, Base, Arbitrum, and Solana (mainnet and testnet)
 */

export type NetworkEnvironment = "mainnet" | "testnet";

export type SupportedChainId =
  | "Ethereum"
  | "Ethereum_Sepolia"
  | "Base"
  | "Base_Sepolia"
  | "Arbitrum"
  | "Arbitrum_Sepolia"
  | "Solana"
  | "Solana_Devnet";

export type NetworkType = "evm" | "solana" | "sui";

export interface NetworkConfig {
  id: SupportedChainId;
  name: string;
  displayName: string;
  type: NetworkType;
  environment: NetworkEnvironment;
  icon: string;
  color: string;
  explorerUrl: string;
  dynamicChainId?: string; // Dynamic's network identifier for programmatic switching
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const NETWORK_CONFIGS: Record<SupportedChainId, NetworkConfig> = {
  // Mainnet Networks
  Ethereum: {
    id: "Ethereum",
    name: "Ethereum",
    displayName: "Ethereum",
    type: "evm",
    environment: "mainnet",
    icon: "⟠",
    color: "from-blue-500/20 to-blue-600/20",
    explorerUrl: "https://etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  Base: {
    id: "Base",
    name: "Base",
    displayName: "Base",
    type: "evm",
    environment: "mainnet",
    icon: "◐",
    color: "from-blue-600/20 to-indigo-600/20",
    explorerUrl: "https://basescan.org",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  Arbitrum: {
    id: "Arbitrum",
    name: "Arbitrum",
    displayName: "Arbitrum",
    type: "evm",
    environment: "mainnet",
    icon: "◆",
    color: "from-cyan-500/20 to-blue-500/20",
    explorerUrl: "https://arbiscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  Solana: {
    id: "Solana",
    name: "Solana",
    displayName: "Solana",
    type: "solana",
    environment: "mainnet",
    dynamicChainId: "101",
    icon: "◎",
    color: "from-violet-500/20 to-fuchsia-500/20",
    explorerUrl: "https://solscan.io",
    nativeCurrency: {
      name: "Solana",
      symbol: "SOL",
      decimals: 9,
    },
  },

  // Testnet Networks
  Ethereum_Sepolia: {
    id: "Ethereum_Sepolia",
    name: "Ethereum Sepolia",
    displayName: "Ethereum (Sepolia)",
    type: "evm",
    environment: "testnet",
    icon: "⟠",
    color: "from-blue-500/20 to-blue-600/20",
    explorerUrl: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  Base_Sepolia: {
    id: "Base_Sepolia",
    name: "Base Sepolia",
    displayName: "Base (Sepolia)",
    type: "evm",
    environment: "testnet",
    icon: "◐",
    color: "from-blue-600/20 to-indigo-600/20",
    explorerUrl: "https://sepolia.basescan.org",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  Arbitrum_Sepolia: {
    id: "Arbitrum_Sepolia",
    name: "Arbitrum Sepolia",
    displayName: "Arbitrum (Sepolia)",
    type: "evm",
    environment: "testnet",
    icon: "◆",
    color: "from-cyan-500/20 to-blue-500/20",
    explorerUrl: "https://sepolia.arbiscan.io",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  Solana_Devnet: {
    id: "Solana_Devnet",
    name: "Solana Devnet",
    displayName: "Solana (Devnet)",
    type: "solana",
    environment: "testnet",
    dynamicChainId: "103",
    icon: "◎",
    color: "from-violet-500/20 to-fuchsia-500/20",
    explorerUrl: "https://solscan.io",
    nativeCurrency: {
      name: "Solana",
      symbol: "SOL",
      decimals: 9,
    },
  },
};

/**
 * Get networks for a specific environment
 */
export function getNetworksByEnvironment(
  environment: NetworkEnvironment,
): NetworkConfig[] {
  return Object.values(NETWORK_CONFIGS).filter(
    (network) => network.environment === environment,
  );
}

/**
 * Get mainnet equivalent of a testnet network (and vice versa)
 */
export function getNetworkCounterpart(
  chainId: SupportedChainId,
): SupportedChainId | null {
  const network = NETWORK_CONFIGS[chainId];
  if (!network) return null;

  const baseName = network.name.replace(" Sepolia", "").replace(" Devnet", "");

  if (network.environment === "mainnet") {
    // Find testnet equivalent
    const testnetKey = Object.keys(NETWORK_CONFIGS).find((key) => {
      const net = NETWORK_CONFIGS[key as SupportedChainId];
      return net?.environment === "testnet" && net.name.startsWith(baseName);
    });
    return (testnetKey as SupportedChainId) ?? null;
  } else {
    // Find mainnet equivalent
    const mainnetKey = Object.keys(NETWORK_CONFIGS).find((key) => {
      const net = NETWORK_CONFIGS[key as SupportedChainId];
      return net?.environment === "mainnet" && baseName.startsWith(net.name);
    });
    return (mainnetKey as SupportedChainId) ?? null;
  }
}

/**
 * Check if a route is supported
 */
export function isRouteSupported(
  from: SupportedChainId,
  to: SupportedChainId,
): boolean {
  const fromNetwork = NETWORK_CONFIGS[from];
  const toNetwork = NETWORK_CONFIGS[to];

  if (!fromNetwork || !toNetwork) return false;

  // Can't bridge to the same network
  if (from === to) return false;

  // Must be on the same environment (mainnet <-> mainnet, testnet <-> testnet)
  return fromNetwork.environment === toNetwork.environment;
}
