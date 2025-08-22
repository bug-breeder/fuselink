import type {
  PeerConnection,
  ICEServer,
  ConnectionStats,
  SignalingMessageUnion,
} from "./types";

import { SignalingClient } from "./signaling-client";

export interface PeerManagerConfig {
  deviceId: string;
  deviceName: string;
  signalingUrl: string;
  iceServers: ICEServer[];
  onPeerConnected: (peerId: string) => void;
  onPeerDisconnected: (peerId: string) => void;
  onDataChannelMessage: (
    peerId: string,
    channel: "control" | "file",
    data: ArrayBuffer | string,
  ) => void;
  onConnectionStatsUpdate: (peerId: string, stats: ConnectionStats) => void;
  onError: (error: Error) => void;
}

export class PeerManager {
  private config: PeerManagerConfig;
  private signalingClient: SignalingClient;
  private peers = new Map<string, PeerConnection>();
  private statsInterval: NodeJS.Timeout | null = null;
  private readonly STATS_INTERVAL = 5000; // 5 seconds

  constructor(config: PeerManagerConfig) {
    this.config = config;

    this.signalingClient = new SignalingClient({
      signalingUrl: config.signalingUrl,
      deviceId: config.deviceId,
      onMessage: this.handleSignalingMessage.bind(this),
      onConnectionChange: this.handleSignalingConnectionChange.bind(this),
      onError: config.onError,
    });
  }

  async connectToRoom(roomId: string): Promise<void> {
    await this.signalingClient.connect(roomId);
    this.startStatsCollection();
  }

  async createOffer(targetDeviceId: string): Promise<void> {
    try {
      const peer = await this.createPeerConnection(targetDeviceId);

      // Create data channels before creating offer
      this.setupDataChannels(peer);

      const offer = await peer.connection.createOffer();

      await peer.connection.setLocalDescription(offer);

      this.signalingClient.sendMessage({
        type: "offer",
        targetDeviceId,
        data: { sdp: offer },
      });
    } catch (error) {
      console.error("Failed to create offer:", error);
      this.config.onError(error as Error);
    }
  }

  disconnect(): void {
    this.stopStatsCollection();

    // Close all peer connections
    for (const peer of this.peers.values()) {
      peer.connection.close();
    }
    this.peers.clear();

    this.signalingClient.disconnect();
  }

  sendControlMessage(peerId: string, data: string | ArrayBuffer): void {
    const peer = this.peers.get(peerId);

    if (!peer?.controlChannel || peer.controlChannel.readyState !== "open") {
      throw new Error(`Control channel not available for peer ${peerId}`);
    }

    if (typeof data === "string") {
      peer.controlChannel.send(data);
    } else {
      peer.controlChannel.send(data as any);
    }
  }

  sendFileData(peerId: string, data: ArrayBuffer): void {
    const peer = this.peers.get(peerId);

    if (!peer?.fileChannel || peer.fileChannel.readyState !== "open") {
      throw new Error(`File channel not available for peer ${peerId}`);
    }

    peer.fileChannel.send(data as any);
  }

  getPeerConnection(peerId: string): PeerConnection | undefined {
    return this.peers.get(peerId);
  }

  getAllPeers(): PeerConnection[] {
    return Array.from(this.peers.values());
  }

  private async createPeerConnection(
    deviceId: string,
  ): Promise<PeerConnection> {
    // Get fresh TURN credentials if needed
    const iceServers = await this.getICEServers();

    const connection = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 10,
    });

    const peer: PeerConnection = {
      id: `${this.config.deviceId}-${deviceId}`,
      deviceId,
      connection,
      status: "connecting",
      lastActivity: Date.now(),
      bytesReceived: 0,
      bytesSent: 0,
    };

    // Set up connection event handlers
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalingClient.sendMessage({
          type: "ice-candidate",
          targetDeviceId: deviceId,
          data: { candidate: event.candidate },
        });
      }
    };

    connection.onconnectionstatechange = () => {
      const state = connection.connectionState;

      console.log(`Peer ${deviceId} connection state:`, state);

      if (state === "connected") {
        peer.status = "connected";
        this.config.onPeerConnected(deviceId);
      } else if (state === "disconnected" || state === "failed") {
        peer.status = state as "disconnected" | "failed";
        this.config.onPeerDisconnected(deviceId);
        this.peers.delete(deviceId);
      }
    };

    connection.ondatachannel = (event) => {
      const channel = event.channel;

      console.log("Data channel received:", channel.label);

      if (channel.label === "control") {
        peer.controlChannel = channel;
        this.setupDataChannelHandlers(peer, channel, "control");
      } else if (channel.label === "file") {
        peer.fileChannel = channel;
        this.setupDataChannelHandlers(peer, channel, "file");
      }
    };

    this.peers.set(deviceId, peer);

    return peer;
  }

  private setupDataChannels(peer: PeerConnection): void {
    // Create control channel (reliable, ordered)
    const controlChannel = peer.connection.createDataChannel("control", {
      ordered: true,
      maxRetransmits: 3,
    });

    peer.controlChannel = controlChannel;
    this.setupDataChannelHandlers(peer, controlChannel, "control");

    // Create file channel (reliable, ordered, larger buffer)
    const fileChannel = peer.connection.createDataChannel("file", {
      ordered: true,
      maxRetransmits: 3,
    });

    peer.fileChannel = fileChannel;
    this.setupDataChannelHandlers(peer, fileChannel, "file");
  }

  private setupDataChannelHandlers(
    peer: PeerConnection,
    channel: RTCDataChannel,
    channelType: "control" | "file",
  ): void {
    channel.onopen = () => {
      console.log(`${channelType} channel opened for peer ${peer.deviceId}`);
    };

    channel.onclose = () => {
      console.log(`${channelType} channel closed for peer ${peer.deviceId}`);
    };

    channel.onerror = (error) => {
      console.error(
        `${channelType} channel error for peer ${peer.deviceId}:`,
        error,
      );
      this.config.onError(new Error(`Data channel error: ${channelType}`));
    };

    channel.onmessage = (event) => {
      peer.lastActivity = Date.now();
      this.config.onDataChannelMessage(peer.deviceId, channelType, event.data);
    };
  }

  private async handleSignalingMessage(
    message: SignalingMessageUnion,
  ): Promise<void> {
    try {
      switch (message.type) {
        case "offer":
          await this.handleOffer(message.deviceId, message.data.sdp);
          break;
        case "answer":
          await this.handleAnswer(message.deviceId, message.data.sdp);
          break;
        case "ice-candidate":
          await this.handleIceCandidate(
            message.deviceId,
            message.data.candidate,
          );
          break;
        case "device-info":
          console.log("Received device info:", message.data);
          break;
        case "error":
          console.error("Signaling error:", message.data.message);
          this.config.onError(new Error(message.data.message));
          break;
        default:
          console.warn("Unknown signaling message type:", message);
      }
    } catch (error) {
      console.error("Error handling signaling message:", error);
      this.config.onError(error as Error);
    }
  }

  private async handleOffer(
    deviceId: string,
    sdp: RTCSessionDescriptionInit,
  ): Promise<void> {
    const peer = await this.createPeerConnection(deviceId);

    await peer.connection.setRemoteDescription(sdp);
    const answer = await peer.connection.createAnswer();

    await peer.connection.setLocalDescription(answer);

    this.signalingClient.sendMessage({
      type: "answer",
      targetDeviceId: deviceId,
      data: { sdp: answer },
    });
  }

  private async handleAnswer(
    deviceId: string,
    sdp: RTCSessionDescriptionInit,
  ): Promise<void> {
    const peer = this.peers.get(deviceId);

    if (!peer) {
      throw new Error(`No peer connection found for device ${deviceId}`);
    }

    await peer.connection.setRemoteDescription(sdp);
  }

  private async handleIceCandidate(
    deviceId: string,
    candidate: RTCIceCandidateInit,
  ): Promise<void> {
    const peer = this.peers.get(deviceId);

    if (!peer) {
      console.warn(`Received ICE candidate for unknown peer ${deviceId}`);

      return;
    }

    await peer.connection.addIceCandidate(candidate);
  }

  private handleSignalingConnectionChange(connected: boolean): void {
    console.log("Signaling connection status:", connected);

    if (!connected) {
      // Handle signaling disconnection - peers may still be connected via WebRTC
      console.log("Signaling lost, but peer connections may remain active");
    }
  }

  private async getICEServers(): Promise<RTCIceServer[]> {
    // Use static Google STUN servers - no TURN credentials needed for M2
    return [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ];
  }

  private startStatsCollection(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    this.statsInterval = setInterval(() => {
      this.collectConnectionStats();
    }, this.STATS_INTERVAL);
  }

  private stopStatsCollection(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  private async collectConnectionStats(): Promise<void> {
    for (const peer of this.peers.values()) {
      if (peer.status !== "connected") continue;

      try {
        const stats = await peer.connection.getStats();
        const connectionStats = this.parseConnectionStats(stats);

        this.config.onConnectionStatsUpdate(peer.deviceId, connectionStats);

        // Update peer connection type
        if (connectionStats.connectionType !== "unknown") {
          peer.connectionType = connectionStats.connectionType;
        }
        peer.bytesReceived = connectionStats.bytesReceived;
        peer.bytesSent = connectionStats.bytesSent;
      } catch (error) {
        console.error(
          `Failed to collect stats for peer ${peer.deviceId}:`,
          error,
        );
      }
    }
  }

  private parseConnectionStats(stats: RTCStatsReport): ConnectionStats {
    let connectionType: "direct" | "relay" | "unknown" = "unknown";
    let localCandidateType = "";
    let remoteCandidateType = "";
    let bytesReceived = 0;
    let bytesSent = 0;
    let packetsReceived = 0;
    let packetsSent = 0;
    let rtt: number | undefined;

    for (const report of stats.values()) {
      if (report.type === "candidate-pair" && report.state === "succeeded") {
        // Determine connection type based on candidate types
        const localCandidate = Array.from(stats.values()).find(
          (s) =>
            s.type === "local-candidate" && s.id === report.localCandidateId,
        );
        const remoteCandidate = Array.from(stats.values()).find(
          (s) =>
            s.type === "remote-candidate" && s.id === report.remoteCandidateId,
        );

        if (localCandidate)
          localCandidateType = localCandidate.candidateType || "";
        if (remoteCandidate)
          remoteCandidateType = remoteCandidate.candidateType || "";

        // Direct connection if both are host/srflx, relay if either is relay
        if (localCandidateType === "relay" || remoteCandidateType === "relay") {
          connectionType = "relay";
        } else if (localCandidateType && remoteCandidateType) {
          connectionType = "direct";
        }

        if (report.currentRoundTripTime) {
          rtt = report.currentRoundTripTime * 1000; // Convert to ms
        }
      }

      if (report.type === "inbound-rtp") {
        bytesReceived += report.bytesReceived || 0;
        packetsReceived += report.packetsReceived || 0;
      }

      if (report.type === "outbound-rtp") {
        bytesSent += report.bytesSent || 0;
        packetsSent += report.packetsSent || 0;
      }
    }

    return {
      connectionType,
      localCandidateType,
      remoteCandidateType,
      bytesReceived,
      bytesSent,
      packetsReceived,
      packetsSent,
      rtt,
    };
  }
}
