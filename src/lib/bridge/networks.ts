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
  | "Monad"
  | "Monad_Testnet"
  | "HyperEVM"
  | "HyperEVM_Testnet"
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
  evmChainId?: number; // Numeric EVM chain ID for network switching
  cctpDomain?: number; // CCTP domain ID (NOT chain ID) for Circle's attestation API
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
    evmChainId: 1,
    cctpDomain: 0,
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
    evmChainId: 8453,
    cctpDomain: 6,
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
    evmChainId: 42161,
    cctpDomain: 3,
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
    cctpDomain: 5,
    nativeCurrency: {
      name: "Solana",
      symbol: "SOL",
      decimals: 9,
    },
  },
  Monad: {
    id: "Monad",
    name: "Monad",
    displayName: "Monad",
    type: "evm",
    environment: "mainnet",
    icon: "◈",
    color: "from-purple-500/20 to-violet-600/20",
    explorerUrl: "https://monadexplorer.com",
    evmChainId: 143,
    cctpDomain: 15,
    nativeCurrency: {
      name: "Monad",
      symbol: "MON",
      decimals: 18,
    },
  },
  HyperEVM: {
    id: "HyperEVM",
    name: "HyperEVM",
    displayName: "HyperEVM",
    type: "evm",
    environment: "mainnet",
    icon: "◇",
    color: "from-emerald-500/20 to-teal-600/20",
    explorerUrl: "https://hyperscan.com",
    evmChainId: 999,
    cctpDomain: 19,
    nativeCurrency: {
      name: "Hype",
      symbol: "HYPE",
      decimals: 18,
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
    evmChainId: 11155111,
    cctpDomain: 0,
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
    evmChainId: 84532,
    cctpDomain: 6,
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
    evmChainId: 421614,
    cctpDomain: 3,
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
    cctpDomain: 5,
    nativeCurrency: {
      name: "Solana",
      symbol: "SOL",
      decimals: 9,
    },
  },
  Monad_Testnet: {
    id: "Monad_Testnet",
    name: "Monad Testnet",
    displayName: "Monad (Testnet)",
    type: "evm",
    environment: "testnet",
    icon: "◈",
    color: "from-purple-500/20 to-violet-600/20",
    explorerUrl: "https://testnet.monadexplorer.com",
    evmChainId: 10143,
    cctpDomain: 15,
    nativeCurrency: {
      name: "Monad",
      symbol: "MON",
      decimals: 18,
    },
  },
  HyperEVM_Testnet: {
    id: "HyperEVM_Testnet",
    name: "HyperEVM Testnet",
    displayName: "HyperEVM (Testnet)",
    type: "evm",
    environment: "testnet",
    icon: "◇",
    color: "from-emerald-500/20 to-teal-600/20",
    explorerUrl: "https://testnet.purrsec.com",
    evmChainId: 998,
    cctpDomain: 19,
    nativeCurrency: {
      name: "Hype",
      symbol: "HYPE",
      decimals: 18,
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

/**
 * Get the full transaction explorer URL for a given chain and transaction hash
 * Handles Solana devnet's special ?cluster=devnet query param
 */
export function getExplorerTxUrl(
  chainId: SupportedChainId,
  txHash: string,
): string {
  const network = NETWORK_CONFIGS[chainId];
  if (!network) return "";

  const baseUrl = `${network.explorerUrl}/tx/${txHash}`;

  // Solana devnet requires ?cluster=devnet query param
  if (chainId === "Solana_Devnet") {
    return `${baseUrl}?cluster=devnet`;
  }

  return baseUrl;
}

/**
 * Get the full address explorer URL for a given chain and wallet address
 * Handles Solana devnet's special ?cluster=devnet query param
 */
export function getExplorerAddressUrl(
  chainId: SupportedChainId,
  address: string,
): string {
  const network = NETWORK_CONFIGS[chainId];
  if (!network) return "#";

  const baseUrl = `${network.explorerUrl}/address/${address}`;

  // Solana devnet requires ?cluster=devnet query param
  if (chainId === "Solana_Devnet") {
    return `${baseUrl}?cluster=devnet`;
  }

  return baseUrl;
}
