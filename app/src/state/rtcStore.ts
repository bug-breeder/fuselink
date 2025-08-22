import type { PeerConnection, ConnectionStats } from "../rtc/types";
import type { Device } from "./types";

import { create } from "zustand";

import { ConnectionManager } from "../rtc/connection-manager";

interface RTCState {
  // Connection manager instance
  connectionManager: ConnectionManager | null;

  // Active peer connections
  peers: Map<string, PeerConnection>;

  // Connection status
  isSignalingConnected: boolean;
  signalingUrl: string;
  currentRoom: string | null;

  // Connection stats
  connectionStats: Map<string, ConnectionStats>;

  // Actions
  initialize: (device: Device, signalingUrl: string) => Promise<void>;
  connectToPeer: (targetDevice: Device, roomId: string) => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  sendControlMessage: (
    deviceId: string,
    message: Record<string, unknown>,
  ) => void;
  sendFileChunk: (deviceId: string, chunk: ArrayBuffer) => void;
  disconnect: () => void;
  updatePeerConnection: (deviceId: string, peer: PeerConnection) => void;
  updateConnectionStats: (deviceId: string, stats: ConnectionStats) => void;
  setSignalingStatus: (connected: boolean) => void;
  getAllPeers: () => PeerConnection[];
}

export const useRTCStore = create<RTCState>((set, get) => ({
  connectionManager: null,
  peers: new Map(),
  isSignalingConnected: false,
  signalingUrl: "ws://localhost:8080",
  currentRoom: null,
  connectionStats: new Map(),

  initialize: async (device: Device, signalingUrl: string) => {
    const state = get();

    // Disconnect existing manager if any
    if (state.connectionManager) {
      state.connectionManager.disconnect();
    }

    // Create new connection manager
    const connectionManager = new ConnectionManager({
      signalingUrl,
      defaultIceServers: [], // Will be fetched dynamically
      onPeerConnected: (connectedDevice) => {
        console.log("Peer connected:", connectedDevice.id);
        // Update device store with online status
      },
      onPeerDisconnected: (deviceId) => {
        console.log("Peer disconnected:", deviceId);
        set((state) => {
          const newPeers = new Map(state.peers);

          newPeers.delete(deviceId);

          return { peers: newPeers };
        });
      },
      onControlMessage: (deviceId, data) => {
        console.log("Control message from", deviceId, data);
        // Handle control messages (device info, sync requests, etc.)
      },
      onFileData: (deviceId, data) => {
        console.log("File data from", deviceId, "size:", data.byteLength);
        // Handle file transfer data
      },
      onError: (error) => {
        console.error("RTC Error:", error);
      },
    });

    await connectionManager.initializeWithDevice(device);

    set({
      connectionManager,
      signalingUrl,
      peers: new Map(),
      connectionStats: new Map(),
    });
  },

  connectToPeer: async (targetDevice: Device, roomId: string) => {
    const state = get();

    if (!state.connectionManager) {
      throw new Error("Connection manager not initialized");
    }

    await state.connectionManager.connectToPeer(targetDevice, roomId);
    set({ currentRoom: roomId });
  },

  joinRoom: async (roomId: string) => {
    const state = get();

    if (!state.connectionManager) {
      throw new Error("Connection manager not initialized");
    }

    await state.connectionManager.joinRoom(roomId);
    set({ currentRoom: roomId });
  },

  sendControlMessage: (deviceId: string, message: Record<string, unknown>) => {
    const state = get();

    if (!state.connectionManager) {
      throw new Error("Connection manager not initialized");
    }

    state.connectionManager.sendControlMessage(deviceId, message);
  },

  sendFileChunk: (deviceId: string, chunk: ArrayBuffer) => {
    const state = get();

    if (!state.connectionManager) {
      throw new Error("Connection manager not initialized");
    }

    state.connectionManager.sendFileChunk(deviceId, chunk);
  },

  disconnect: () => {
    const state = get();

    if (state.connectionManager) {
      state.connectionManager.disconnect();
    }

    set({
      connectionManager: null,
      peers: new Map(),
      connectionStats: new Map(),
      isSignalingConnected: false,
      currentRoom: null,
    });
  },

  updatePeerConnection: (deviceId: string, peer: PeerConnection) => {
    set((state) => {
      const newPeers = new Map(state.peers);

      newPeers.set(deviceId, peer);

      return { peers: newPeers };
    });
  },

  updateConnectionStats: (deviceId: string, stats: ConnectionStats) => {
    set((state) => {
      const newStats = new Map(state.connectionStats);

      newStats.set(deviceId, stats);

      return { connectionStats: newStats };
    });
  },

  setSignalingStatus: (connected: boolean) => {
    set({ isSignalingConnected: connected });
  },

  getAllPeers: () => {
    const state = get();

    return state.connectionManager?.getConnectedPeers() || [];
  },
}));
