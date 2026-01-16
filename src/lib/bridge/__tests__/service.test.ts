import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { BridgeTransaction } from "../types";

// Mock external dependencies BEFORE imports
vi.mock("@circle-fin/bridge-kit", () => {
  return {
    BridgeKit: class MockBridgeKit {
      estimate = vi.fn().mockResolvedValue({
        gasFees: [
          {
            name: "Burn",
            token: "ETH",
            blockchain: "Ethereum",
            fees: { gas: 100000n, gasPrice: 10n, fee: "0.001" },
          },
        ],
        fees: [],
      });
      bridge = vi.fn().mockResolvedValue({
        state: "success",
        steps: [
          { name: "Approve", state: "success", txHash: "0xapprove" },
          { name: "Burn", state: "success", txHash: "0xburn" },
          { name: "Mint", state: "success", txHash: "0xmint" },
        ],
      });
      retry = vi.fn().mockResolvedValue({
        state: "success",
        steps: [{ name: "Mint", state: "success", txHash: "0xretry-mint" }],
      });
      on = vi.fn();
      off = vi.fn();
    },
  };
});

// Mock the store module
vi.mock("../store", () => ({
  useBridgeStore: {
    getState: vi.fn().mockReturnValue({
      setCurrentTransaction: vi.fn(),
      updateTransaction: vi.fn(),
      updateTransactionInWindow: vi.fn(),
    }),
  },
}));

// Create mock adapter factory
const createMockAdapterFactory = () => ({
  getAdapter: vi.fn().mockResolvedValue({ type: "mock-adapter" }),
  clearCache: vi.fn(),
  getCreator: vi.fn().mockReturnValue({
    canHandle: vi.fn().mockReturnValue(true),
  }),
  supports: vi.fn().mockReturnValue(true),
});

// Create mock balance service
const createMockBalanceService = () => ({
  getUSDCBalance: vi.fn().mockResolvedValue({
    balance: "1000.00",
    decimals: 6,
    symbol: "USDC",
  }),
});

// Create mock storage
const createMockStorage = () => ({
  saveTransaction: vi.fn(),
  getTransaction: vi.fn(),
  getTransactionsByUser: vi.fn().mockResolvedValue([]),
  getTransactionsByUserAndStatus: vi.fn().mockResolvedValue([]),
  getRecentTransactions: vi.fn().mockResolvedValue([]),
  updateTransactionStatus: vi.fn(),
  updateTransactionStep: vi.fn(),
  deleteTransaction: vi.fn(),
  clearUserTransactions: vi.fn(),
  getRetryableTransactions: vi.fn().mockResolvedValue([]),
});

// Create mock wallet
const createMockWallet = (address: string, type: "evm" | "solana" = "evm") => ({
  address,
  type,
  connector: { key: type === "evm" ? "metamask" : "phantom" },
  getWalletClient: vi.fn().mockResolvedValue({}),
  getConnection: vi
    .fn()
    .mockResolvedValue({ rpcEndpoint: "https://api.devnet.solana.com" }),
});

// Import service after mocks
import { CCTPBridgeService } from "../service";
import type { BridgeServiceConfig } from "../service";

describe("CCTPBridgeService", () => {
  let service: CCTPBridgeService;
  let mockAdapterFactory: ReturnType<typeof createMockAdapterFactory>;
  let mockBalanceService: ReturnType<typeof createMockBalanceService>;
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    mockAdapterFactory = createMockAdapterFactory();
    mockBalanceService = createMockBalanceService();
    mockStorage = createMockStorage();

    const config: BridgeServiceConfig = {
      adapterFactory:
        mockAdapterFactory as unknown as BridgeServiceConfig["adapterFactory"],
      balanceService:
        mockBalanceService as unknown as BridgeServiceConfig["balanceService"],
      storage: mockStorage as unknown as BridgeServiceConfig["storage"],
    };

    service = new CCTPBridgeService(config);
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (service) {
      service.reset();
    }
  });

  describe("initialize", () => {
    it("should initialize with EVM wallet address (preserves case)", async () => {
      const address = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
      const wallet = createMockWallet(address);

      await service.initialize(
        wallet as unknown as Parameters<typeof service.initialize>[0],
        [wallet] as unknown as Parameters<typeof service.initialize>[1],
      );

      // The address should be preserved as-is (not lowercased)
      await service.getTransactions();
      expect(mockStorage.getTransactionsByUser).toHaveBeenCalledWith(address);
    });

    it("should initialize with Solana wallet address (preserves case - critical for Base58)", async () => {
      const address = "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK";
      const wallet = createMockWallet(address, "solana");

      await service.initialize(
        wallet as unknown as Parameters<typeof service.initialize>[0],
        [wallet] as unknown as Parameters<typeof service.initialize>[1],
      );

      // The Solana address should be preserved exactly (case-sensitive Base58)
      await service.getTransactions();
      expect(mockStorage.getTransactionsByUser).toHaveBeenCalledWith(address);

      // Verify it wasn't lowercased (which would break Solana)
      expect(mockStorage.getTransactionsByUser).not.toHaveBeenCalledWith(
        address.toLowerCase(),
      );
    });

    it("should throw error when wallet address is missing", async () => {
      const wallet = { connector: { key: "metamask" } };

      await expect(
        service.initialize(
          wallet as unknown as Parameters<typeof service.initialize>[0],
        ),
      ).rejects.toThrow("Address is required");
    });

    it("should clear adapter cache on initialization", async () => {
      const wallet = createMockWallet(
        "0x1234567890123456789012345678901234567890",
      );

      await service.initialize(
        wallet as unknown as Parameters<typeof service.initialize>[0],
        [wallet] as unknown as Parameters<typeof service.initialize>[1],
      );

      expect(mockAdapterFactory.clearCache).toHaveBeenCalled();
    });
  });

  describe("estimate", () => {
    beforeEach(async () => {
      const wallet = createMockWallet(
        "0x1234567890123456789012345678901234567890",
      );
      await service.initialize(
        wallet as unknown as Parameters<typeof service.initialize>[0],
        [wallet] as unknown as Parameters<typeof service.initialize>[1],
      );
    });

    it("should return estimate for valid bridge params", async () => {
      const estimate = await service.estimate({
        fromChain: "Ethereum",
        toChain: "Base",
        amount: "100.00",
      });

      expect(estimate).toBeDefined();
      expect(estimate.fees).toBeDefined();
      expect(estimate.estimatedTime).toBeDefined();
      expect(estimate.receiveAmount).toBeDefined();
    });

    it("should throw error when service not initialized", async () => {
      service.reset();

      await expect(
        service.estimate({
          fromChain: "Ethereum",
          toChain: "Base",
          amount: "100.00",
        }),
      ).rejects.toThrow("Bridge service not initialized");
    });

    it("should throw error for same source and destination chain", async () => {
      await expect(
        service.estimate({
          fromChain: "Ethereum",
          toChain: "Ethereum",
          amount: "100.00",
        }),
      ).rejects.toThrow("Source and destination chains must be different");
    });

    it("should throw error for invalid amount", async () => {
      await expect(
        service.estimate({
          fromChain: "Ethereum",
          toChain: "Base",
          amount: "0",
        }),
      ).rejects.toThrow("Amount must be greater than 0");

      await expect(
        service.estimate({
          fromChain: "Ethereum",
          toChain: "Base",
          amount: "-10",
        }),
      ).rejects.toThrow("Amount must be greater than 0");
    });

    it("should throw error for too many decimal places", async () => {
      await expect(
        service.estimate({
          fromChain: "Ethereum",
          toChain: "Base",
          amount: "100.1234567", // 7 decimals, max is 6 for USDC
        }),
      ).rejects.toThrow("Amount has too many decimal places");
    });
  });

  describe("bridge", () => {
    beforeEach(async () => {
      const wallet = createMockWallet(
        "0x1234567890123456789012345678901234567890",
      );
      await service.initialize(
        wallet as unknown as Parameters<typeof service.initialize>[0],
        [wallet] as unknown as Parameters<typeof service.initialize>[1],
      );
    });

    it("should execute bridge and save transaction", async () => {
      const result = await service.bridge({
        fromChain: "Ethereum",
        toChain: "Base",
        amount: "100.00",
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBe("completed");
      expect(mockStorage.saveTransaction).toHaveBeenCalled();
    });

    it("should throw error for unsupported route", async () => {
      await expect(
        service.bridge({
          fromChain: "Ethereum",
          toChain: "Ethereum_Sepolia", // Cross-environment not supported
          amount: "100.00",
        }),
      ).rejects.toThrow("Route not supported");
    });

    it("should throw error when service not initialized", async () => {
      service.reset();

      await expect(
        service.bridge({
          fromChain: "Ethereum",
          toChain: "Base",
          amount: "100.00",
        }),
      ).rejects.toThrow("Bridge service not initialized");
    });

    it("should include recipient address when provided", async () => {
      const recipientAddress = "0x9876543210987654321098765432109876543210";

      const result = await service.bridge({
        fromChain: "Ethereum",
        toChain: "Base",
        amount: "100.00",
        recipientAddress,
      });

      expect(result.recipientAddress).toBe(recipientAddress);
    });
  });

  describe("retry", () => {
    beforeEach(async () => {
      const wallet = createMockWallet(
        "0x1234567890123456789012345678901234567890",
      );
      await service.initialize(
        wallet as unknown as Parameters<typeof service.initialize>[0],
        [wallet] as unknown as Parameters<typeof service.initialize>[1],
      );
    });

    it("should throw error when service not initialized", async () => {
      service.reset();

      await expect(service.retry("tx-123")).rejects.toThrow(
        "Bridge service not initialized",
      );
    });

    it("should throw error when transaction not found", async () => {
      mockStorage.getTransaction.mockResolvedValue(undefined);

      await expect(service.retry("non-existent")).rejects.toThrow(
        "Transaction not found",
      );
    });

    it("should throw error when transaction belongs to different user", async () => {
      mockStorage.getTransaction.mockResolvedValue({
        id: "tx-123",
        userAddress: "0x9999999999999999999999999999999999999999",
        status: "failed",
        bridgeResult: {},
      });

      await expect(service.retry("tx-123")).rejects.toThrow(
        "Transaction does not belong to current user",
      );
    });

    it("should throw error when transaction is not failed", async () => {
      mockStorage.getTransaction.mockResolvedValue({
        id: "tx-123",
        userAddress: "0x1234567890123456789012345678901234567890",
        status: "completed",
        bridgeResult: {},
      });

      await expect(service.retry("tx-123")).rejects.toThrow(
        "Only failed transactions can be retried",
      );
    });

    it("should throw error when bridgeResult is missing", async () => {
      mockStorage.getTransaction.mockResolvedValue({
        id: "tx-123",
        userAddress: "0x1234567890123456789012345678901234567890",
        status: "failed",
        // No bridgeResult
      });

      await expect(service.retry("tx-123")).rejects.toThrow(
        "Cannot retry: original bridge result not found",
      );
    });
  });

  describe("getBalance", () => {
    beforeEach(async () => {
      const wallet = createMockWallet(
        "0x1234567890123456789012345678901234567890",
      );
      await service.initialize(
        wallet as unknown as Parameters<typeof service.initialize>[0],
        [wallet] as unknown as Parameters<typeof service.initialize>[1],
      );
    });

    it("should return balance for valid chain", async () => {
      const balance = await service.getBalance("Ethereum");

      expect(balance).toBeDefined();
      expect(balance.balance).toBe("1000.00");
      expect(mockBalanceService.getUSDCBalance).toHaveBeenCalledWith(
        expect.anything(),
        "Ethereum",
        "0x1234567890123456789012345678901234567890",
      );
    });

    it("should throw error when service not initialized", async () => {
      service.reset();

      await expect(service.getBalance("Ethereum")).rejects.toThrow(
        "Service not initialized",
      );
    });

    it("should use compatible wallet address for each chain type (multi-wallet)", async () => {
      const evmAddress = "0x95BE86F56dF18E6F6a60427527df0fDE09D0Cce8";
      const solanaAddress = "Bv8kLPjUvREWG3S1oZiGqRhAYB4mYZmxrSSZ3MqfkPj3";

      const evmWallet = createMockWallet(evmAddress, "evm");
      const solanaWallet = createMockWallet(solanaAddress, "solana");

      // Update mock to return different canHandle results based on wallet/network type
      mockAdapterFactory.getCreator.mockImplementation(
        (networkType: string) => ({
          canHandle: (wallet: { type: string }) => wallet.type === networkType,
        }),
      );

      // Initialize with EVM as primary, both wallets available
      await service.initialize(
        evmWallet as unknown as Parameters<typeof service.initialize>[0],
        [evmWallet, solanaWallet] as unknown as Parameters<
          typeof service.initialize
        >[1],
      );

      // Get Solana balance - should use Solana wallet's address, NOT EVM
      await service.getBalance("Solana_Devnet");

      expect(mockBalanceService.getUSDCBalance).toHaveBeenCalledWith(
        expect.anything(),
        "Solana_Devnet",
        solanaAddress, // Must be Solana address, not EVM address
      );

      // Verify EVM balance still uses EVM address
      await service.getBalance("Ethereum");

      expect(mockBalanceService.getUSDCBalance).toHaveBeenCalledWith(
        expect.anything(),
        "Ethereum",
        evmAddress,
      );
    });
  });

  describe("supportsRoute", () => {
    it("should return true for valid mainnet routes", async () => {
      expect(await service.supportsRoute("Ethereum", "Base")).toBe(true);
      expect(await service.supportsRoute("Ethereum", "Solana")).toBe(true);
      expect(await service.supportsRoute("Base", "Arbitrum")).toBe(true);
    });

    it("should return true for valid testnet routes", async () => {
      expect(
        await service.supportsRoute("Ethereum_Sepolia", "Base_Sepolia"),
      ).toBe(true);
      expect(
        await service.supportsRoute("Ethereum_Sepolia", "Solana_Devnet"),
      ).toBe(true);
    });

    it("should return false for cross-environment routes", async () => {
      expect(await service.supportsRoute("Ethereum", "Ethereum_Sepolia")).toBe(
        false,
      );
      expect(await service.supportsRoute("Solana", "Solana_Devnet")).toBe(
        false,
      );
    });

    it("should return false for same chain routes", async () => {
      expect(await service.supportsRoute("Ethereum", "Ethereum")).toBe(false);
      expect(await service.supportsRoute("Solana", "Solana")).toBe(false);
    });
  });

  describe("getTransactions", () => {
    it("should return empty array when not initialized", async () => {
      const transactions = await service.getTransactions();
      expect(transactions).toEqual([]);
    });

    it("should return user transactions when initialized", async () => {
      const wallet = createMockWallet(
        "0x1234567890123456789012345678901234567890",
      );
      await service.initialize(
        wallet as unknown as Parameters<typeof service.initialize>[0],
        [wallet] as unknown as Parameters<typeof service.initialize>[1],
      );

      const mockTxs: BridgeTransaction[] = [
        {
          id: "tx-1",
          userAddress: "0x1234567890123456789012345678901234567890",
          fromChain: "Ethereum",
          toChain: "Base",
          amount: "100",
          token: "USDC",
          status: "completed",
          steps: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      mockStorage.getTransactionsByUser.mockResolvedValue(mockTxs);

      const transactions = await service.getTransactions();

      expect(transactions).toEqual(mockTxs);
      expect(mockStorage.getTransactionsByUser).toHaveBeenCalledWith(
        "0x1234567890123456789012345678901234567890",
      );
    });
  });

  describe("reset", () => {
    it("should clear user address and wallet", async () => {
      const wallet = createMockWallet(
        "0x1234567890123456789012345678901234567890",
      );
      await service.initialize(
        wallet as unknown as Parameters<typeof service.initialize>[0],
        [wallet] as unknown as Parameters<typeof service.initialize>[1],
      );

      service.reset();

      // After reset, getTransactions should return empty (no user)
      const transactions = await service.getTransactions();
      expect(transactions).toEqual([]);
    });

    it("should clear adapter cache", async () => {
      const wallet = createMockWallet(
        "0x1234567890123456789012345678901234567890",
      );
      await service.initialize(
        wallet as unknown as Parameters<typeof service.initialize>[0],
        [wallet] as unknown as Parameters<typeof service.initialize>[1],
      );

      service.reset();

      // clearCache is called once on initialize and once on reset
      expect(mockAdapterFactory.clearCache).toHaveBeenCalled();
    });
  });
});
