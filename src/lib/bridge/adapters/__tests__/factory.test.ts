import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdapterFactory, EVMAdapterCreator, SolanaAdapterCreator } from "../factory";
import type { IAdapterCreator } from "../factory";

// Mock the external dependencies
vi.mock("@circle-fin/adapter-viem-v2", () => ({
  createViemAdapterFromProvider: vi.fn().mockResolvedValue({ type: "evm-adapter" }),
}));

vi.mock("@circle-fin/adapter-solana", () => ({
  createSolanaAdapterFromProvider: vi.fn().mockResolvedValue({ type: "solana-adapter" }),
}));

vi.mock("@dynamic-labs/ethereum", () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  isEthereumWallet: vi.fn((wallet) => wallet?.type === "evm"),
}));

vi.mock("@dynamic-labs/solana", () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  isSolanaWallet: vi.fn((wallet) => wallet?.type === "solana"),
}));

vi.mock("~/lib/solana/provider", () => {
  return {
    DynamicSolanaWalletAdapter: class MockDynamicSolanaWalletAdapter {
      isConnected = true;
      publicKey = { toString: () => "mock-public-key" };
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      constructor() {}
    },
  };
});

vi.mock("@solana/web3.js", () => {
  return {
    Connection: class MockConnection {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      constructor() {}
    },
  };
});

// Create mock wallets
const createMockEVMWallet = (address: string) => ({
  type: "evm",
  address,
  connector: { key: "metamask" },
  getWalletClient: vi.fn().mockResolvedValue({ provider: "mock-provider" }),
});

const createMockSolanaWallet = (address: string) => ({
  type: "solana",
  address,
  connector: { key: "phantom" },
  getConnection: vi.fn().mockResolvedValue({ rpcEndpoint: "https://api.devnet.solana.com" }),
});

describe("AdapterFactory", () => {
  let factory: AdapterFactory;

  beforeEach(() => {
    factory = new AdapterFactory();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should register EVM and Solana creators by default", () => {
      expect(factory.supports("evm")).toBe(true);
      expect(factory.supports("solana")).toBe(true);
    });

    it("should not support unregistered network types", () => {
      expect(factory.supports("sui")).toBe(false);
    });
  });

  describe("registerCreator", () => {
    it("should register a new adapter creator", () => {
      const mockCreator: IAdapterCreator = {
        networkType: "sui",
        canHandle: vi.fn().mockReturnValue(true),
        createAdapter: vi.fn().mockResolvedValue({ type: "sui-adapter" }),
      };

      factory.registerCreator(mockCreator);

      expect(factory.supports("sui")).toBe(true);
    });

    it("should overwrite existing creator with warning", () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const newEVMCreator: IAdapterCreator = {
        networkType: "evm",
        canHandle: vi.fn().mockReturnValue(true),
        createAdapter: vi.fn().mockResolvedValue({ type: "custom-evm-adapter" }),
      };

      factory.registerCreator(newEVMCreator);

      expect(warnSpy).toHaveBeenCalledWith(
        "Overwriting existing adapter creator for evm"
      );
      warnSpy.mockRestore();
    });
  });

  describe("getAdapter", () => {
    it("should create and cache EVM adapter", async () => {
      const wallet = createMockEVMWallet("0x1234567890123456789012345678901234567890");

      const adapter1 = await factory.getAdapter(wallet as unknown as Parameters<typeof factory.getAdapter>[0], "evm");
      const adapter2 = await factory.getAdapter(wallet as unknown as Parameters<typeof factory.getAdapter>[0], "evm");

      // Should return cached adapter
      expect(adapter1).toBe(adapter2);
      // Wallet client should only be called once due to caching
      expect(wallet.getWalletClient).toHaveBeenCalledTimes(1);
    });

    it("should create different adapters for different network types", async () => {
      const evmWallet = createMockEVMWallet("0x1234567890123456789012345678901234567890");
      const solanaWallet = createMockSolanaWallet("DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK");

      const evmAdapter = await factory.getAdapter(evmWallet as unknown as Parameters<typeof factory.getAdapter>[0], "evm");
      const solanaAdapter = await factory.getAdapter(solanaWallet as unknown as Parameters<typeof factory.getAdapter>[0], "solana");

      expect(evmAdapter).not.toBe(solanaAdapter);
    });

    it("should cache adapters separately for different chainIds", async () => {
      // Import the mock to track calls
      const { createSolanaAdapterFromProvider } = await import("@circle-fin/adapter-solana");
      const mockCreate = createSolanaAdapterFromProvider as ReturnType<typeof vi.fn>;
      mockCreate.mockClear();

      const solanaWallet = createMockSolanaWallet("DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK");

      // Get adapter for mainnet
      await factory.getAdapter(
        solanaWallet as unknown as Parameters<typeof factory.getAdapter>[0],
        "solana",
        "Solana"
      );

      // Get adapter for devnet - should create a NEW adapter (different cache key)
      await factory.getAdapter(
        solanaWallet as unknown as Parameters<typeof factory.getAdapter>[0],
        "solana",
        "Solana_Devnet"
      );

      // Both should be created (2 calls total) - proving different cache keys
      expect(mockCreate).toHaveBeenCalledTimes(2);

      // Getting mainnet again should use cache (no additional call)
      await factory.getAdapter(
        solanaWallet as unknown as Parameters<typeof factory.getAdapter>[0],
        "solana",
        "Solana"
      );
      expect(mockCreate).toHaveBeenCalledTimes(2); // Still 2, not 3
    });

    it("should throw error for unregistered network type", async () => {
      const wallet = createMockEVMWallet("0x123");

      await expect(
        factory.getAdapter(wallet as unknown as Parameters<typeof factory.getAdapter>[0], "sui")
      ).rejects.toThrow("No adapter creator registered for sui");
    });

    it("should throw error when wallet is incompatible with network type", async () => {
      const evmWallet = createMockEVMWallet("0x123");

      // EVM wallet trying to create Solana adapter
      await expect(
        factory.getAdapter(evmWallet as unknown as Parameters<typeof factory.getAdapter>[0], "solana")
      ).rejects.toThrow(/is not compatible with solana/);
    });
  });

  describe("clearCache", () => {
    it("should clear all cached adapters", async () => {
      const wallet = createMockEVMWallet("0x1234567890123456789012345678901234567890");

      await factory.getAdapter(wallet as unknown as Parameters<typeof factory.getAdapter>[0], "evm");
      factory.clearCache();

      // Getting adapter again should create a new one
      await factory.getAdapter(wallet as unknown as Parameters<typeof factory.getAdapter>[0], "evm");

      expect(wallet.getWalletClient).toHaveBeenCalledTimes(2);
    });

    it("should clear cache for specific wallet address only", async () => {
      const wallet1 = createMockEVMWallet("0x1111111111111111111111111111111111111111");
      const wallet2 = createMockEVMWallet("0x2222222222222222222222222222222222222222");

      await factory.getAdapter(wallet1 as unknown as Parameters<typeof factory.getAdapter>[0], "evm");
      await factory.getAdapter(wallet2 as unknown as Parameters<typeof factory.getAdapter>[0], "evm");

      // Clear only wallet1's cache
      factory.clearCache("0x1111111111111111111111111111111111111111");

      // wallet1 should need new adapter
      await factory.getAdapter(wallet1 as unknown as Parameters<typeof factory.getAdapter>[0], "evm");
      expect(wallet1.getWalletClient).toHaveBeenCalledTimes(2);

      // wallet2 should still use cached adapter
      await factory.getAdapter(wallet2 as unknown as Parameters<typeof factory.getAdapter>[0], "evm");
      expect(wallet2.getWalletClient).toHaveBeenCalledTimes(1);
    });
  });

  describe("getSupportedNetworkTypes", () => {
    it("should return all registered network types", () => {
      const types = factory.getSupportedNetworkTypes();

      expect(types).toContain("evm");
      expect(types).toContain("solana");
    });
  });

  describe("getCreator", () => {
    it("should return the creator for a registered network type", () => {
      const creator = factory.getCreator("evm");

      expect(creator).toBeDefined();
      expect(creator?.networkType).toBe("evm");
    });

    it("should return undefined for unregistered network type", () => {
      const creator = factory.getCreator("sui");

      expect(creator).toBeUndefined();
    });
  });
});

describe("EVMAdapterCreator", () => {
  let creator: EVMAdapterCreator;

  beforeEach(() => {
    creator = new EVMAdapterCreator();
    vi.clearAllMocks();
  });

  describe("canHandle", () => {
    it("should return true for EVM wallets", () => {
      const wallet = createMockEVMWallet("0x123");
      expect(creator.canHandle(wallet as unknown as Parameters<typeof creator.canHandle>[0])).toBe(true);
    });

    it("should return false for non-EVM wallets", () => {
      const wallet = createMockSolanaWallet("DYw8j...");
      expect(creator.canHandle(wallet as unknown as Parameters<typeof creator.canHandle>[0])).toBe(false);
    });
  });

  describe("createAdapter", () => {
    it("should throw for non-EVM wallets", async () => {
      const wallet = createMockSolanaWallet("DYw8j...");

      await expect(
        creator.createAdapter(wallet as unknown as Parameters<typeof creator.createAdapter>[0])
      ).rejects.toThrow("Wallet is not an Ethereum wallet");
    });
  });
});

describe("SolanaAdapterCreator", () => {
  let creator: SolanaAdapterCreator;

  beforeEach(() => {
    creator = new SolanaAdapterCreator();
    vi.clearAllMocks();
  });

  describe("canHandle", () => {
    it("should return true for Solana wallets", () => {
      const wallet = createMockSolanaWallet("DYw8j...");
      expect(creator.canHandle(wallet as unknown as Parameters<typeof creator.canHandle>[0])).toBe(true);
    });

    it("should return false for non-Solana wallets", () => {
      const wallet = createMockEVMWallet("0x123");
      expect(creator.canHandle(wallet as unknown as Parameters<typeof creator.canHandle>[0])).toBe(false);
    });
  });

  describe("createAdapter", () => {
    it("should throw for non-Solana wallets", async () => {
      const wallet = createMockEVMWallet("0x123");

      await expect(
        creator.createAdapter(wallet as unknown as Parameters<typeof creator.createAdapter>[0])
      ).rejects.toThrow("Wallet is not a Solana wallet");
    });
  });
});
