import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { PeerManager } from "./peer-manager";

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  connectionState: RTCPeerConnectionState = "new";
  iceConnectionState: RTCIceConnectionState = "new";
  localDescription: RTCSessionDescription | null = null;
  remoteDescription: RTCSessionDescription | null = null;

  onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null = null;
  onconnectionstatechange: ((event: Event) => void) | null = null;
  ondatachannel: ((event: RTCDataChannelEvent) => void) | null = null;

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    return { type: "offer", sdp: "mock-offer-sdp" };
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    return { type: "answer", sdp: "mock-answer-sdp" };
  }

  async setLocalDescription(
    description: RTCSessionDescriptionInit,
  ): Promise<void> {
    this.localDescription = description as RTCSessionDescription;
  }

  async setRemoteDescription(
    description: RTCSessionDescriptionInit,
  ): Promise<void> {
    this.remoteDescription = description as RTCSessionDescription;
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    // Mock implementation
  }

  createDataChannel(label: string, init?: RTCDataChannelInit): RTCDataChannel {
    return new MockRTCDataChannel(label, init) as any;
  }

  async getStats(): Promise<RTCStatsReport> {
    return new Map() as RTCStatsReport;
  }

  close(): void {
    this.connectionState = "closed";
  }
}

class MockRTCDataChannel {
  label: string;
  readyState: RTCDataChannelState = "connecting";

  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(label: string, init?: RTCDataChannelInit) {
    this.label = label;
    setTimeout(() => {
      this.readyState = "open";
      if (this.onopen) this.onopen(new Event("open"));
    }, 10);
  }

  send(data: string | ArrayBuffer): void {
    // Mock send
  }

  close(): void {
    this.readyState = "closed";
    if (this.onclose) this.onclose(new Event("close"));
  }
}

// Mock SignalingClient
vi.mock("./signaling-client", () => ({
  SignalingClient: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    sendMessage: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn().mockReturnValue(true),
  })),
}));

// Setup global mocks
global.RTCPeerConnection = MockRTCPeerConnection as any;

describe("PeerManager", () => {
  let peerManager: PeerManager;
  let mockOnPeerConnected: ReturnType<typeof vi.fn>;
  let mockOnPeerDisconnected: ReturnType<typeof vi.fn>;
  let mockOnDataChannelMessage: ReturnType<typeof vi.fn>;
  let mockOnConnectionStatsUpdate: ReturnType<typeof vi.fn>;
  let mockOnError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnPeerConnected = vi.fn();
    mockOnPeerDisconnected = vi.fn();
    mockOnDataChannelMessage = vi.fn();
    mockOnConnectionStatsUpdate = vi.fn();
    mockOnError = vi.fn();

    peerManager = new PeerManager({
      deviceId: "test-device",
      deviceName: "Test Device",
      signalingUrl: "ws://localhost:8080",
      iceServers: [],
      onPeerConnected: mockOnPeerConnected,
      onPeerDisconnected: mockOnPeerDisconnected,
      onDataChannelMessage: mockOnDataChannelMessage,
      onConnectionStatsUpdate: mockOnConnectionStatsUpdate,
      onError: mockOnError,
    });
  });

  afterEach(() => {
    peerManager.disconnect();
    vi.clearAllMocks();
  });

  describe("connection management", () => {
    it("should connect to signaling room", async () => {
      await peerManager.connectToRoom("test-room");
      // SignalingClient mock should have been called
    });

    it("should create peer connections with data channels", async () => {
      await peerManager.connectToRoom("test-room");
      await peerManager.createOffer("target-device");

      const peer = peerManager.getPeerConnection("target-device");

      expect(peer).toBeDefined();
      expect(peer?.deviceId).toBe("target-device");
    });

    it("should handle connection state changes", async () => {
      await peerManager.connectToRoom("test-room");
      await peerManager.createOffer("target-device");

      const peer = peerManager.getPeerConnection("target-device");

      // Simulate connection success
      peer!.connection.connectionState = "connected";
      if (peer!.connection.onconnectionstatechange) {
        peer!.connection.onconnectionstatechange(
          new Event("connectionstatechange"),
        );
      }

      expect(mockOnPeerConnected).toHaveBeenCalledWith("target-device");
    });
  });

  describe("data channels", () => {
    it("should create control and file data channels", async () => {
      await peerManager.connectToRoom("test-room");
      await peerManager.createOffer("target-device");

      const peer = peerManager.getPeerConnection("target-device");

      // Wait for data channels to be set up
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(peer?.controlChannel).toBeDefined();
      expect(peer?.fileChannel).toBeDefined();
      expect(peer?.controlChannel?.label).toBe("control");
      expect(peer?.fileChannel?.label).toBe("file");
    });

    it("should handle data channel messages", async () => {
      await peerManager.connectToRoom("test-room");
      await peerManager.createOffer("target-device");

      const peer = peerManager.getPeerConnection("target-device");

      // Simulate control channel message
      const controlChannel = peer?.controlChannel as any;

      if (controlChannel?.onmessage) {
        controlChannel.onmessage(
          new MessageEvent("message", {
            data: JSON.stringify({ type: "ping" }),
          }),
        );
      }

      expect(mockOnDataChannelMessage).toHaveBeenCalledWith(
        "target-device",
        "control",
        JSON.stringify({ type: "ping" }),
      );
    });
  });

  describe("messaging", () => {
    it("should send control messages", async () => {
      await peerManager.connectToRoom("test-room");
      await peerManager.createOffer("target-device");

      const peer = peerManager.getPeerConnection("target-device");

      peer!.controlChannel!.readyState = "open";

      expect(() => {
        peerManager.sendControlMessage("target-device", "test message");
      }).not.toThrow();
    });

    it("should send file data", async () => {
      await peerManager.connectToRoom("test-room");
      await peerManager.createOffer("target-device");

      const peer = peerManager.getPeerConnection("target-device");

      peer!.fileChannel!.readyState = "open";

      const testData = new ArrayBuffer(1024);

      expect(() => {
        peerManager.sendFileData("target-device", testData);
      }).not.toThrow();
    });

    it("should throw error when channels not ready", async () => {
      await peerManager.connectToRoom("test-room");
      await peerManager.createOffer("target-device");

      expect(() => {
        peerManager.sendControlMessage("target-device", "test");
      }).toThrow("Control channel not available");
    });
  });

  describe("stats collection", () => {
    it("should collect connection stats periodically", async () => {
      await peerManager.connectToRoom("test-room");
      await peerManager.createOffer("target-device");

      const peer = peerManager.getPeerConnection("target-device");

      peer!.status = "connected";

      // Manually trigger stats collection to avoid waiting
      await (peerManager as any).collectConnectionStats();

      expect(mockOnConnectionStatsUpdate).toHaveBeenCalled();
    }, 1000);
  });
});
