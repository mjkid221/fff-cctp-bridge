import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BridgeEventManager } from "../event-manager";
import type { BridgeTransaction } from "../types";

// Mock BridgeKit module
const mockOn = vi.fn();
const mockOff = vi.fn();
const mockBridge = vi.fn();
const mockRetry = vi.fn();

vi.mock("@circle-fin/bridge-kit", () => ({
  BridgeKit: vi.fn().mockImplementation(() => ({
    on: mockOn,
    off: mockOff,
    bridge: mockBridge,
    retry: mockRetry,
  })),
}));

// Mock storage
const createMockStorage = () => ({
  getTransaction: vi.fn(),
  saveTransaction: vi.fn(),
});

// Helper to create a mock transaction
function createMockTransaction(
  overrides: Partial<BridgeTransaction> = {},
): BridgeTransaction {
  return {
    id: "test-tx-id",
    userAddress: "0x1234567890123456789012345678901234567890",
    fromChain: "Ethereum",
    toChain: "Base",
    amount: "100.00",
    token: "USDC",
    status: "bridging",
    steps: [
      {
        id: "approve",
        name: "Approve",
        status: "pending",
        timestamp: Date.now(),
      },
      { id: "burn", name: "Burn", status: "pending", timestamp: Date.now() },
      {
        id: "attestation",
        name: "Attestation",
        status: "pending",
        timestamp: Date.now(),
      },
      { id: "mint", name: "Mint", status: "pending", timestamp: Date.now() },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe("BridgeEventManager", () => {
  let mockStorage: ReturnType<typeof createMockStorage>;
  let eventManager: BridgeEventManager;
  let eventHandler: (event: {
    method: string;
    values?: Record<string, unknown>;
  }) => void;

  beforeEach(() => {
    mockStorage = createMockStorage();

    // Capture the event handler when it's registered
    mockOn.mockImplementation(
      (eventName: string, handler: typeof eventHandler) => {
        if (eventName === "*") {
          eventHandler = handler;
        }
      },
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    eventManager = new BridgeEventManager(mockStorage as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createTransactionKit", () => {
    it("should create a new kit for transaction and register event listener", () => {
      const callback = vi.fn();

      const kit = eventManager.createTransactionKit("tx-123", callback);

      expect(kit).toBeDefined();
      expect(mockOn).toHaveBeenCalledWith("*", expect.any(Function));
    });

    it("should allow multiple transactions with separate kits", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const kit1 = eventManager.createTransactionKit("tx-1", callback1);
      const kit2 = eventManager.createTransactionKit("tx-2", callback2);

      expect(kit1).toBeDefined();
      expect(kit2).toBeDefined();
      // Each creates a new kit, so on() is called twice
      expect(mockOn).toHaveBeenCalledTimes(2);
    });

    it("should dispose existing kit when creating new one for same transaction", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventManager.createTransactionKit("tx-123", callback1);
      eventManager.createTransactionKit("tx-123", callback2);

      // First kit should be disposed (off called)
      expect(mockOff).toHaveBeenCalledTimes(1);
    });
  });

  describe("disposeTransactionKit", () => {
    it("should remove event listener and clean up kit", async () => {
      const callback = vi.fn();
      const tx = createMockTransaction({ id: "tx-123" });

      mockStorage.getTransaction.mockResolvedValue(tx);

      eventManager.createTransactionKit("tx-123", callback);
      eventManager.disposeTransactionKit("tx-123");

      // Trigger an event
      eventHandler({ method: "approve", values: { txHash: "0xabc" } });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Callback should NOT be called since transaction was disposed
      expect(callback).not.toHaveBeenCalled();
      expect(mockOff).toHaveBeenCalledWith("*", expect.any(Function));
    });
  });

  describe("event handling", () => {
    it("should update approve step when approve event fires", async () => {
      const callback = vi.fn();
      const tx = createMockTransaction({ id: "tx-123" });

      mockStorage.getTransaction.mockResolvedValue(tx);

      eventManager.createTransactionKit("tx-123", callback);

      // Trigger approve event
      eventHandler({ method: "approve", values: { txHash: "0xapprove123" } });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Check that storage was updated
      expect(mockStorage.saveTransaction).toHaveBeenCalled();
      const savedTx = mockStorage.saveTransaction.mock
        .calls[0]![0] as BridgeTransaction;
      const approveStep = savedTx.steps.find((s) => s.id === "approve");
      expect(approveStep!.status).toBe("completed");
      expect(approveStep!.txHash).toBe("0xapprove123");
    });

    it("should update burn step when burn event fires", async () => {
      const callback = vi.fn();
      const tx = createMockTransaction({ id: "tx-123" });

      mockStorage.getTransaction.mockResolvedValue(tx);

      eventManager.createTransactionKit("tx-123", callback);

      // Trigger burn event
      eventHandler({ method: "burn", values: { txHash: "0xburn456" } });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const savedTx = mockStorage.saveTransaction.mock
        .calls[0]![0] as BridgeTransaction;
      const burnStep = savedTx.steps.find((s) => s.id === "burn");
      expect(burnStep!.status).toBe("completed");
      expect(burnStep!.txHash).toBe("0xburn456");
    });

    it("should update attestation step when fetchAttestation event fires", async () => {
      const callback = vi.fn();
      const tx = createMockTransaction({ id: "tx-123" });

      mockStorage.getTransaction.mockResolvedValue(tx);

      eventManager.createTransactionKit("tx-123", callback);

      // Trigger attestation event
      eventHandler({
        method: "fetchAttestation",
        values: { data: "attestation-hash-123" },
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const savedTx = mockStorage.saveTransaction.mock
        .calls[0]![0] as BridgeTransaction;
      expect(savedTx.attestationHash).toBe("attestation-hash-123");
    });

    it("should update mint step when mint event fires", async () => {
      const callback = vi.fn();
      const tx = createMockTransaction({ id: "tx-123" });

      mockStorage.getTransaction.mockResolvedValue(tx);

      eventManager.createTransactionKit("tx-123", callback);

      // Trigger mint event
      eventHandler({ method: "mint", values: { txHash: "0xmint789" } });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const savedTx = mockStorage.saveTransaction.mock
        .calls[0]![0] as BridgeTransaction;
      const mintStep = savedTx.steps.find((s) => s.id === "mint");
      expect(mintStep!.status).toBe("completed");
      expect(mintStep!.txHash).toBe("0xmint789");
    });

    it("should advance next step to in_progress when current step completes", async () => {
      const callback = vi.fn();
      const tx = createMockTransaction({
        id: "tx-123",
        steps: [
          {
            id: "approve",
            name: "Approve",
            status: "in_progress",
            timestamp: Date.now(),
          },
          {
            id: "burn",
            name: "Burn",
            status: "pending",
            timestamp: Date.now(),
          },
          {
            id: "attestation",
            name: "Attestation",
            status: "pending",
            timestamp: Date.now(),
          },
          {
            id: "mint",
            name: "Mint",
            status: "pending",
            timestamp: Date.now(),
          },
        ],
      });

      mockStorage.getTransaction.mockResolvedValue(tx);

      eventManager.createTransactionKit("tx-123", callback);

      // Approve completes
      eventHandler({ method: "approve", values: { txHash: "0xapprove" } });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const savedTx = mockStorage.saveTransaction.mock
        .calls[0]![0] as BridgeTransaction;

      // Approve should be completed
      const approveStep = savedTx.steps.find((s) => s.id === "approve");
      expect(approveStep!.status).toBe("completed");

      // Burn should now be in_progress
      const burnStep = savedTx.steps.find((s) => s.id === "burn");
      expect(burnStep!.status).toBe("in_progress");
    });

    it("should call callback with updated transaction", async () => {
      const callback = vi.fn();
      const tx = createMockTransaction({ id: "tx-123" });

      mockStorage.getTransaction.mockResolvedValue(tx);

      eventManager.createTransactionKit("tx-123", callback);

      eventHandler({ method: "approve", values: { txHash: "0xabc" } });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ id: "tx-123" }),
      );
    });

    it("should ignore unrecognized event methods", async () => {
      const callback = vi.fn();
      const tx = createMockTransaction({ id: "tx-123" });

      mockStorage.getTransaction.mockResolvedValue(tx);

      eventManager.createTransactionKit("tx-123", callback);

      eventHandler({ method: "unknownMethod", values: {} });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Storage should not be updated for unknown methods
      expect(mockStorage.saveTransaction).not.toHaveBeenCalled();
    });

    it("should handle missing transaction gracefully", async () => {
      const callback = vi.fn();

      mockStorage.getTransaction.mockResolvedValue(undefined);

      eventManager.createTransactionKit("non-existent", callback);

      eventHandler({ method: "approve", values: { txHash: "0xabc" } });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should not throw, and callback should not be called
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("dispose", () => {
    it("should remove all event listeners", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventManager.createTransactionKit("tx-1", callback1);
      eventManager.createTransactionKit("tx-2", callback2);

      eventManager.dispose();

      // Both kits should have their listeners removed
      expect(mockOff).toHaveBeenCalledTimes(2);
    });

    it("should clear all tracked transactions", async () => {
      const callback = vi.fn();
      const tx = createMockTransaction({ id: "tx-123" });

      mockStorage.getTransaction.mockResolvedValue(tx);

      eventManager.createTransactionKit("tx-123", callback);
      eventManager.dispose();

      // Trigger event after dispose
      eventHandler({ method: "approve", values: { txHash: "0xabc" } });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Callback should not be called after dispose
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("getTransactionKit", () => {
    it("should return kit for tracked transaction", () => {
      const callback = vi.fn();

      const kit = eventManager.createTransactionKit("tx-123", callback);
      const retrievedKit = eventManager.getTransactionKit("tx-123");

      expect(retrievedKit).toBe(kit);
    });

    it("should return undefined for untracked transaction", () => {
      const kit = eventManager.getTransactionKit("non-existent");

      expect(kit).toBeUndefined();
    });
  });
});
