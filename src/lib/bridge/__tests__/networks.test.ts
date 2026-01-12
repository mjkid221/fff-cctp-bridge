import { describe, it, expect } from "vitest";
import {
  NETWORK_CONFIGS,
  getNetworksByEnvironment,
  isRouteSupported,
  getExplorerTxUrl,
} from "../networks";
import type { SupportedChainId } from "../networks";

describe("Network Configuration", () => {
  describe("NETWORK_CONFIGS", () => {
    it("should contain all expected mainnet networks", () => {
      const mainnetIds: SupportedChainId[] = ["Ethereum", "Base", "Arbitrum", "Solana"];
      mainnetIds.forEach((id) => {
        expect(NETWORK_CONFIGS[id]).toBeDefined();
        expect(NETWORK_CONFIGS[id].environment).toBe("mainnet");
      });
    });

    it("should contain all expected testnet networks", () => {
      const testnetIds: SupportedChainId[] = [
        "Ethereum_Sepolia",
        "Base_Sepolia",
        "Arbitrum_Sepolia",
        "Solana_Devnet",
      ];
      testnetIds.forEach((id) => {
        expect(NETWORK_CONFIGS[id]).toBeDefined();
        expect(NETWORK_CONFIGS[id].environment).toBe("testnet");
      });
    });

    it("should have correct network types", () => {
      expect(NETWORK_CONFIGS.Ethereum.type).toBe("evm");
      expect(NETWORK_CONFIGS.Base.type).toBe("evm");
      expect(NETWORK_CONFIGS.Arbitrum.type).toBe("evm");
      expect(NETWORK_CONFIGS.Solana.type).toBe("solana");

      expect(NETWORK_CONFIGS.Ethereum_Sepolia.type).toBe("evm");
      expect(NETWORK_CONFIGS.Solana_Devnet.type).toBe("solana");
    });

    it("should have required fields for all networks", () => {
      Object.values(NETWORK_CONFIGS).forEach((config) => {
        expect(config.id).toBeDefined();
        expect(config.name).toBeDefined();
        expect(config.displayName).toBeDefined();
        expect(config.type).toBeDefined();
        expect(config.environment).toBeDefined();
        expect(config.icon).toBeDefined();
        expect(config.color).toBeDefined();
        expect(config.explorerUrl).toBeDefined();
        expect(config.nativeCurrency).toBeDefined();
        expect(config.nativeCurrency.name).toBeDefined();
        expect(config.nativeCurrency.symbol).toBeDefined();
        expect(config.nativeCurrency.decimals).toBeDefined();
      });
    });

    it("should have valid explorer URLs", () => {
      Object.values(NETWORK_CONFIGS).forEach((config) => {
        expect(config.explorerUrl).toMatch(/^https:\/\//);
      });
    });
  });

  describe("getNetworksByEnvironment", () => {
    it("should return only mainnet networks for mainnet environment", () => {
      const mainnetNetworks = getNetworksByEnvironment("mainnet");

      expect(mainnetNetworks.length).toBe(4);
      mainnetNetworks.forEach((network) => {
        expect(network.environment).toBe("mainnet");
      });

      const mainnetIds = mainnetNetworks.map((n) => n.id);
      expect(mainnetIds).toContain("Ethereum");
      expect(mainnetIds).toContain("Base");
      expect(mainnetIds).toContain("Arbitrum");
      expect(mainnetIds).toContain("Solana");
    });

    it("should return only testnet networks for testnet environment", () => {
      const testnetNetworks = getNetworksByEnvironment("testnet");

      expect(testnetNetworks.length).toBe(4);
      testnetNetworks.forEach((network) => {
        expect(network.environment).toBe("testnet");
      });

      const testnetIds = testnetNetworks.map((n) => n.id);
      expect(testnetIds).toContain("Ethereum_Sepolia");
      expect(testnetIds).toContain("Base_Sepolia");
      expect(testnetIds).toContain("Arbitrum_Sepolia");
      expect(testnetIds).toContain("Solana_Devnet");
    });
  });

  describe("isRouteSupported", () => {
    describe("Valid routes", () => {
      it("should support mainnet EVM to EVM routes", () => {
        expect(isRouteSupported("Ethereum", "Base")).toBe(true);
        expect(isRouteSupported("Base", "Arbitrum")).toBe(true);
        expect(isRouteSupported("Arbitrum", "Ethereum")).toBe(true);
      });

      it("should support mainnet EVM to Solana routes", () => {
        expect(isRouteSupported("Ethereum", "Solana")).toBe(true);
        expect(isRouteSupported("Base", "Solana")).toBe(true);
        expect(isRouteSupported("Arbitrum", "Solana")).toBe(true);
      });

      it("should support mainnet Solana to EVM routes", () => {
        expect(isRouteSupported("Solana", "Ethereum")).toBe(true);
        expect(isRouteSupported("Solana", "Base")).toBe(true);
        expect(isRouteSupported("Solana", "Arbitrum")).toBe(true);
      });

      it("should support testnet EVM to EVM routes", () => {
        expect(isRouteSupported("Ethereum_Sepolia", "Base_Sepolia")).toBe(true);
        expect(isRouteSupported("Base_Sepolia", "Arbitrum_Sepolia")).toBe(true);
      });

      it("should support testnet EVM to Solana routes", () => {
        expect(isRouteSupported("Ethereum_Sepolia", "Solana_Devnet")).toBe(true);
        expect(isRouteSupported("Base_Sepolia", "Solana_Devnet")).toBe(true);
      });

      it("should support testnet Solana to EVM routes", () => {
        expect(isRouteSupported("Solana_Devnet", "Ethereum_Sepolia")).toBe(true);
        expect(isRouteSupported("Solana_Devnet", "Base_Sepolia")).toBe(true);
      });
    });

    describe("Invalid routes", () => {
      it("should not support same chain routes", () => {
        expect(isRouteSupported("Ethereum", "Ethereum")).toBe(false);
        expect(isRouteSupported("Solana", "Solana")).toBe(false);
        expect(isRouteSupported("Ethereum_Sepolia", "Ethereum_Sepolia")).toBe(false);
      });

      it("should not support cross-environment routes (mainnet to testnet)", () => {
        expect(isRouteSupported("Ethereum", "Ethereum_Sepolia")).toBe(false);
        expect(isRouteSupported("Ethereum", "Base_Sepolia")).toBe(false);
        expect(isRouteSupported("Solana", "Solana_Devnet")).toBe(false);
      });

      it("should not support cross-environment routes (testnet to mainnet)", () => {
        expect(isRouteSupported("Ethereum_Sepolia", "Ethereum")).toBe(false);
        expect(isRouteSupported("Base_Sepolia", "Base")).toBe(false);
        expect(isRouteSupported("Solana_Devnet", "Solana")).toBe(false);
      });

      it("should return false for invalid chain IDs", () => {
        expect(isRouteSupported("InvalidChain" as SupportedChainId, "Ethereum")).toBe(false);
        expect(isRouteSupported("Ethereum", "InvalidChain" as SupportedChainId)).toBe(false);
      });
    });
  });

  describe("getExplorerTxUrl", () => {
    it("should return correct explorer URL for EVM mainnet chains", () => {
      const txHash = "0x1234567890abcdef";

      expect(getExplorerTxUrl("Ethereum", txHash)).toBe(
        `https://etherscan.io/tx/${txHash}`
      );
      expect(getExplorerTxUrl("Base", txHash)).toBe(
        `https://basescan.org/tx/${txHash}`
      );
      expect(getExplorerTxUrl("Arbitrum", txHash)).toBe(
        `https://arbiscan.io/tx/${txHash}`
      );
    });

    it("should return correct explorer URL for EVM testnet chains", () => {
      const txHash = "0xabcdef1234567890";

      expect(getExplorerTxUrl("Ethereum_Sepolia", txHash)).toBe(
        `https://sepolia.etherscan.io/tx/${txHash}`
      );
      expect(getExplorerTxUrl("Base_Sepolia", txHash)).toBe(
        `https://sepolia.basescan.org/tx/${txHash}`
      );
      expect(getExplorerTxUrl("Arbitrum_Sepolia", txHash)).toBe(
        `https://sepolia.arbiscan.io/tx/${txHash}`
      );
    });

    it("should return correct explorer URL for Solana mainnet", () => {
      const txHash = "5xYz...abc";

      expect(getExplorerTxUrl("Solana", txHash)).toBe(
        `https://solscan.io/tx/${txHash}`
      );
    });

    it("should append ?cluster=devnet for Solana devnet", () => {
      const txHash = "3abc...xyz";

      expect(getExplorerTxUrl("Solana_Devnet", txHash)).toBe(
        `https://solscan.io/tx/${txHash}?cluster=devnet`
      );
    });

    it("should return empty string for invalid chain ID", () => {
      expect(getExplorerTxUrl("InvalidChain" as SupportedChainId, "0x123")).toBe("");
    });
  });
});
