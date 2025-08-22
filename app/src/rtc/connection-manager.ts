import type { Device } from "../state/types";
import type { PeerConnection, ICEServer } from "./types";

import { PeerManager } from "./peer-manager";

export interface ConnectionManagerConfig {
  signalingUrl: string;
  defaultIceServers: ICEServer[];
  onPeerConnected: (device: Device) => void;
  onPeerDisconnected: (deviceId: string) => void;
  onControlMessage: (deviceId: string, data: string | ArrayBuffer) => void;
  onFileData: (deviceId: string, data: ArrayBuffer) => void;
  onError: (error: Error) => void;
}

export class ConnectionManager {
  private config: ConnectionManagerConfig;
  private peerManager: PeerManager | null = null;
  private connectionTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(config: ConnectionManagerConfig) {
    this.config = config;
  }

  async initializeWithDevice(device: Device): Promise<void> {
    if (this.peerManager) {
      this.peerManager.disconnect();
    }

    this.peerManager = new PeerManager({
      deviceId: device.id,
      deviceName: device.name,
      signalingUrl: this.config.signalingUrl,
      iceServers: this.config.defaultIceServers,
      onPeerConnected: (peerId) => {
        this.clearConnectionTimeout(peerId);
        const peer = this.peerManager?.getPeerConnection(peerId);

        if (peer) {
          const connectedDevice: Device = {
            id: peer.deviceId,
            name: peer.deviceId, // Will be updated via control channel
            pubKeyJwk: {}, // Will be updated via pairing info
            isOnline: true,
            lastSeen: Date.now(),
          };

          this.config.onPeerConnected(connectedDevice);
        }
      },
      onPeerDisconnected: (peerId) => {
        this.clearConnectionTimeout(peerId);
        this.config.onPeerDisconnected(peerId);
      },
      onDataChannelMessage: this.handleDataChannelMessage.bind(this),
      onConnectionStatsUpdate: this.handleConnectionStatsUpdate.bind(this),
      onError: this.config.onError,
    });
  }

  async connectToPeer(targetDevice: Device, roomId: string): Promise<void> {
    if (!this.peerManager) {
      throw new Error("Connection manager not initialized");
    }

    // Set connection timeout
    this.setConnectionTimeout(targetDevice.id);

    try {
      await this.peerManager.connectToRoom(roomId);
      await this.peerManager.createOffer(targetDevice.id);
    } catch (error) {
      this.clearConnectionTimeout(targetDevice.id);
      throw error;
    }
  }

  async joinRoom(roomId: string): Promise<void> {
    if (!this.peerManager) {
      throw new Error("Connection manager not initialized");
    }

    await this.peerManager.connectToRoom(roomId);
  }

  sendControlMessage(deviceId: string, message: Record<string, unknown>): void {
    if (!this.peerManager) {
      throw new Error("Connection manager not initialized");
    }

    const data = JSON.stringify(message);

    this.peerManager.sendControlMessage(deviceId, data);
  }

  sendFileChunk(deviceId: string, chunk: ArrayBuffer): void {
    if (!this.peerManager) {
      throw new Error("Connection manager not initialized");
    }

    this.peerManager.sendFileData(deviceId, chunk);
  }

  disconnect(): void {
    // Clear all timeouts
    for (const timeout of this.connectionTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.connectionTimeouts.clear();

    if (this.peerManager) {
      this.peerManager.disconnect();
      this.peerManager = null;
    }
  }

  getConnectedPeers(): PeerConnection[] {
    if (!this.peerManager) {
      return [];
    }

    return this.peerManager
      .getAllPeers()
      .filter((peer) => peer.status === "connected");
  }

  getPeerConnection(deviceId: string): PeerConnection | undefined {
    return this.peerManager?.getPeerConnection(deviceId);
  }

  private handleDataChannelMessage(
    deviceId: string,
    channel: "control" | "file",
    data: ArrayBuffer | string,
  ): void {
    if (channel === "control") {
      this.config.onControlMessage(deviceId, data);
    } else if (channel === "file") {
      this.config.onFileData(deviceId, data as ArrayBuffer);
    }
  }

  private handleConnectionStatsUpdate(deviceId: string, stats: any): void {
    // Log connection type changes
    const peer = this.peerManager?.getPeerConnection(deviceId);

    if (peer && peer.connectionType !== stats.connectionType) {
      console.log(`Peer ${deviceId} connection type: ${stats.connectionType}`);
    }
  }

  private setConnectionTimeout(deviceId: string): void {
    const timeout = setTimeout(() => {
      console.warn(`Connection timeout for peer ${deviceId}`);
      this.config.onError(
        new Error(`Connection timeout for device ${deviceId}`),
      );
    }, 30000); // 30 second timeout

    this.connectionTimeouts.set(deviceId, timeout);
  }

  private clearConnectionTimeout(deviceId: string): void {
    const timeout = this.connectionTimeouts.get(deviceId);

    if (timeout) {
      clearTimeout(timeout);
      this.connectionTimeouts.delete(deviceId);
    }
  }
}
