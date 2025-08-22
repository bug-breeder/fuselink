import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { SignalingClient } from "./signaling-client";

// Mock WebSocket
class MockWebSocket {
  url: string;
  readyState: number = WebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => this.simulateOpen(), 10);
  }

  send(data: string): void {
    // Mock send - could trigger onmessage in tests
  }

  close(): void {
    this.readyState = WebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = WebSocket.CLOSED;
      if (this.onclose) {
        this.onclose(new CloseEvent("close"));
      }
    }, 1);
  }

  simulateOpen(): void {
    this.readyState = WebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event("open"));
    }
  }

  simulateMessage(data: string): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent("message", { data }));
    }
  }

  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event("error"));
    }
  }
}

// Define WebSocket constants
(MockWebSocket as any).CONNECTING = 0;
(MockWebSocket as any).OPEN = 1;
(MockWebSocket as any).CLOSING = 2;
(MockWebSocket as any).CLOSED = 3;

// Mock WebSocket globally
global.WebSocket = MockWebSocket as any;

describe("SignalingClient", () => {
  let client: SignalingClient;
  let mockOnMessage: ReturnType<typeof vi.fn>;
  let mockOnConnectionChange: ReturnType<typeof vi.fn>;
  let mockOnError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnMessage = vi.fn();
    mockOnConnectionChange = vi.fn();
    mockOnError = vi.fn();

    client = new SignalingClient({
      signalingUrl: "ws://localhost:8080",
      deviceId: "test-device-id",
      onMessage: mockOnMessage,
      onConnectionChange: mockOnConnectionChange,
      onError: mockOnError,
    });
  });

  afterEach(() => {
    client.disconnect();
    vi.clearAllMocks();
  });

  describe("connection", () => {
    it("should connect to signaling server", async () => {
      await client.connect("test-room");

      expect(mockOnConnectionChange).toHaveBeenCalledWith(true);
      expect(client.isConnected()).toBe(true);
    });

    it("should handle connection errors", async () => {
      const originalConstructor = global.WebSocket;

      global.WebSocket = vi.fn().mockImplementation(() => {
        const ws = {
          url: "ws://localhost:8080/ws/signaling/test-room",
          readyState: WebSocket.CONNECTING,
          onopen: null,
          onclose: null,
          onerror: null,
          send: vi.fn(),
          close: vi.fn(),
        };

        setTimeout(() => {
          if (ws.onerror) ws.onerror(new Event("error"));
        }, 10);

        return ws;
      }) as any;

      await expect(client.connect("test-room")).rejects.toThrow();

      // Restore original constructor
      global.WebSocket = originalConstructor;
    });

    it("should disconnect cleanly", async () => {
      await client.connect("test-room");

      // Verify connected first
      expect(client.isConnected()).toBe(true);

      client.disconnect();

      expect(client.isConnected()).toBe(false);
    });
  });

  describe("messaging", () => {
    beforeEach(async () => {
      await client.connect("test-room");
    });

    it("should send messages when connected", () => {
      const message = {
        type: "offer" as const,
        targetDeviceId: "target-device",
        data: { sdp: { type: "offer", sdp: "mock-sdp" } },
      };

      expect(() => client.sendMessage(message)).not.toThrow();
    });

    it("should throw error when sending while disconnected", () => {
      client.disconnect();

      const message = {
        type: "offer" as const,
        targetDeviceId: "target-device",
        data: { sdp: { type: "offer", sdp: "mock-sdp" } },
      };

      expect(() => client.sendMessage(message)).toThrow(
        "Signaling client is not connected",
      );
    });

    it("should parse and handle incoming messages", async () => {
      const mockMessage = {
        type: "answer",
        deviceId: "remote-device",
        data: { sdp: { type: "answer", sdp: "mock-sdp" } },
      };

      // Simulate receiving a message
      const ws = (client as any).ws as MockWebSocket;

      ws.simulateMessage(JSON.stringify(mockMessage));

      expect(mockOnMessage).toHaveBeenCalledWith(mockMessage);
    });

    it("should handle invalid JSON messages", async () => {
      const ws = (client as any).ws as MockWebSocket;

      ws.simulateMessage("invalid-json");

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid signaling message format",
        }),
      );
    });
  });

  describe("reconnection", () => {
    it("should attempt reconnection on connection loss", async () => {
      await client.connect("test-room");

      // Clear mock calls from connection
      mockOnConnectionChange.mockClear();

      // Simulate connection loss
      const ws = (client as any).ws as MockWebSocket;

      ws.close();

      // Wait for close event to fire
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockOnConnectionChange).toHaveBeenCalledWith(false);

      // Wait for reconnection attempt
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should attempt to reconnect
      expect(mockOnConnectionChange).toHaveBeenCalledTimes(2); // disconnect + reconnect
    });

    it("should not reconnect when intentionally disconnected", async () => {
      await client.connect("test-room");

      // Clear mock calls from connection
      mockOnConnectionChange.mockClear();

      client.disconnect();

      // Wait for disconnect to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should have called with false for disconnect
      expect(mockOnConnectionChange).toHaveBeenCalledWith(false);

      // Wait to ensure no reconnection attempts
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should only have been called once (for disconnect)
      expect(mockOnConnectionChange).toHaveBeenCalledTimes(1);
    });
  });
});
