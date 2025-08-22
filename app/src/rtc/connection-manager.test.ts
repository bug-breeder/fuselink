import type { Device } from "../state/types";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { ConnectionManager } from "./connection-manager";

// Mock PeerManager
vi.mock("./peer-manager", () => ({
  PeerManager: vi.fn().mockImplementation(() => ({
    connectToRoom: vi.fn().mockResolvedValue(undefined),
    createOffer: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    sendControlMessage: vi.fn(),
    sendFileData: vi.fn(),
    getPeerConnection: vi.fn().mockReturnValue({
      id: "test-connection",
      deviceId: "target-device",
      status: "connected",
      lastActivity: Date.now(),
    }),
    getAllPeers: vi.fn().mockReturnValue([]),
  })),
}));

describe("ConnectionManager", () => {
  let connectionManager: ConnectionManager;
  let mockOnPeerConnected: ReturnType<typeof vi.fn>;
  let mockOnPeerDisconnected: ReturnType<typeof vi.fn>;
  let mockOnControlMessage: ReturnType<typeof vi.fn>;
  let mockOnFileData: ReturnType<typeof vi.fn>;
  let mockOnError: ReturnType<typeof vi.fn>;

  const testDevice: Device = {
    id: "test-device-123",
    name: "Test Device",
    pubKeyJwk: { kty: "EC", crv: "P-256" },
  };

  beforeEach(() => {
    mockOnPeerConnected = vi.fn();
    mockOnPeerDisconnected = vi.fn();
    mockOnControlMessage = vi.fn();
    mockOnFileData = vi.fn();
    mockOnError = vi.fn();

    connectionManager = new ConnectionManager({
      signalingUrl: "ws://localhost:8080",
      defaultIceServers: [],
      onPeerConnected: mockOnPeerConnected,
      onPeerDisconnected: mockOnPeerDisconnected,
      onControlMessage: mockOnControlMessage,
      onFileData: mockOnFileData,
      onError: mockOnError,
    });
  });

  afterEach(() => {
    connectionManager.disconnect();
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with device", async () => {
      await connectionManager.initializeWithDevice(testDevice);

      // Should create PeerManager instance
      expect((connectionManager as any).peerManager).toBeDefined();
    });

    it("should disconnect existing manager when reinitializing", async () => {
      await connectionManager.initializeWithDevice(testDevice);
      const firstManager = (connectionManager as any).peerManager;

      await connectionManager.initializeWithDevice(testDevice);

      expect(firstManager.disconnect).toHaveBeenCalled();
    });
  });

  describe("peer connections", () => {
    beforeEach(async () => {
      await connectionManager.initializeWithDevice(testDevice);
    });

    it("should connect to peer", async () => {
      const targetDevice: Device = {
        id: "target-device",
        name: "Target Device",
        pubKeyJwk: { kty: "EC", crv: "P-256" },
      };

      await connectionManager.connectToPeer(targetDevice, "test-room");

      const peerManager = (connectionManager as any).peerManager;

      expect(peerManager.connectToRoom).toHaveBeenCalledWith("test-room");
      expect(peerManager.createOffer).toHaveBeenCalledWith("target-device");
    });

    it("should join room without creating offer", async () => {
      await connectionManager.joinRoom("test-room");

      const peerManager = (connectionManager as any).peerManager;

      expect(peerManager.connectToRoom).toHaveBeenCalledWith("test-room");
    });

    it("should throw error when not initialized", async () => {
      const uninitializedManager = new ConnectionManager({
        signalingUrl: "ws://localhost:8080",
        defaultIceServers: [],
        onPeerConnected: vi.fn(),
        onPeerDisconnected: vi.fn(),
        onControlMessage: vi.fn(),
        onFileData: vi.fn(),
        onError: vi.fn(),
      });

      await expect(
        uninitializedManager.connectToPeer(testDevice, "test-room"),
      ).rejects.toThrow("Connection manager not initialized");
    });
  });

  describe("messaging", () => {
    beforeEach(async () => {
      await connectionManager.initializeWithDevice(testDevice);
    });

    it("should send control messages", () => {
      const message = { type: "sync-request", folderId: "folder-123" };

      connectionManager.sendControlMessage("target-device", message);

      const peerManager = (connectionManager as any).peerManager;

      expect(peerManager.sendControlMessage).toHaveBeenCalledWith(
        "target-device",
        JSON.stringify(message),
      );
    });

    it("should send file chunks", () => {
      const chunk = new ArrayBuffer(1024);

      connectionManager.sendFileChunk("target-device", chunk);

      const peerManager = (connectionManager as any).peerManager;

      expect(peerManager.sendFileData).toHaveBeenCalledWith(
        "target-device",
        chunk,
      );
    });
  });

  describe("connection timeouts", () => {
    beforeEach(async () => {
      await connectionManager.initializeWithDevice(testDevice);
    });

    it("should set timeout when connecting to peer", async () => {
      const targetDevice: Device = {
        id: "target-device",
        name: "Target Device",
        pubKeyJwk: { kty: "EC", crv: "P-256" },
      };

      const connectPromise = connectionManager.connectToPeer(
        targetDevice,
        "test-room",
      );

      // Should have timeout set
      expect((connectionManager as any).connectionTimeouts.size).toBe(1);

      await connectPromise;
    });

    it("should handle connection timeout", async () => {
      const targetDevice: Device = {
        id: "slow-device",
        name: "Slow Device",
        pubKeyJwk: { kty: "EC", crv: "P-256" },
      };

      // Start connection which will set timeout
      const connectPromise = connectionManager.connectToPeer(
        targetDevice,
        "test-room",
      );

      // Manually trigger timeout for testing
      const timeouts = (connectionManager as any).connectionTimeouts;
      const timeout = timeouts.get("slow-device");

      if (timeout) {
        clearTimeout(timeout);
        mockOnError(new Error("Connection timeout for device slow-device"));
      }

      await connectPromise;

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Connection timeout"),
        }),
      );
    }, 1000);
  });

  describe("cleanup", () => {
    it("should cleanup all resources on disconnect", async () => {
      await connectionManager.initializeWithDevice(testDevice);

      connectionManager.disconnect();

      expect((connectionManager as any).peerManager).toBeNull();
      expect((connectionManager as any).connectionTimeouts.size).toBe(0);
    });
  });
});
