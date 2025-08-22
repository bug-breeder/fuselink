import type { PeerConnection } from "./types";

export interface HealthMetrics {
  connectionCount: number;
  directConnections: number;
  relayConnections: number;
  totalBytesReceived: number;
  totalBytesSent: number;
  averageRTT: number;
  connectionUptime: number;
  lastActivity: number;
}

export interface ConnectionHealth {
  peerId: string;
  status: "healthy" | "degraded" | "failed";
  issues: string[];
  lastSeen: number;
  connectionDuration: number;
}

export class HealthMonitor {
  private peers = new Map<string, PeerConnection>();
  private startTime = Date.now();
  private lastHealthCheck = Date.now();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private onHealthUpdate?: (health: ConnectionHealth[]) => void;

  constructor(onHealthUpdate?: (health: ConnectionHealth[]) => void) {
    this.onHealthUpdate = onHealthUpdate;
    this.startHealthChecks();
  }

  addPeer(peer: PeerConnection): void {
    this.peers.set(peer.deviceId, peer);
  }

  removePeer(deviceId: string): void {
    this.peers.delete(deviceId);
  }

  updatePeer(peer: PeerConnection): void {
    this.peers.set(peer.deviceId, peer);
  }

  getMetrics(): HealthMetrics {
    const peers = Array.from(this.peers.values());

    const metrics: HealthMetrics = {
      connectionCount: peers.length,
      directConnections: peers.filter((p) => p.connectionType === "direct")
        .length,
      relayConnections: peers.filter((p) => p.connectionType === "relay")
        .length,
      totalBytesReceived: peers.reduce((sum, p) => sum + p.bytesReceived, 0),
      totalBytesSent: peers.reduce((sum, p) => sum + p.bytesSent, 0),
      averageRTT: 0, // Will be calculated from stats
      connectionUptime: Date.now() - this.startTime,
      lastActivity: Math.max(
        ...peers.map((p) => p.lastActivity),
        this.lastHealthCheck,
      ),
    };

    return metrics;
  }

  getConnectionHealth(): ConnectionHealth[] {
    const now = Date.now();
    const health: ConnectionHealth[] = [];

    for (const peer of this.peers.values()) {
      const issues: string[] = [];
      let status: "healthy" | "degraded" | "failed" = "healthy";

      // Check for connection issues
      if (peer.status === "failed") {
        status = "failed";
        issues.push("Connection failed");
      } else if (peer.status === "disconnected") {
        status = "failed";
        issues.push("Connection lost");
      } else if (
        peer.status === "connecting" &&
        now - peer.lastActivity > 30000
      ) {
        status = "degraded";
        issues.push("Connection taking too long");
      }

      // Check for data channel issues
      if (peer.status === "connected") {
        if (!peer.controlChannel || peer.controlChannel.readyState !== "open") {
          status = "degraded";
          issues.push("Control channel not ready");
        }

        if (!peer.fileChannel || peer.fileChannel.readyState !== "open") {
          status = "degraded";
          issues.push("File channel not ready");
        }

        // Check for stale connections
        if (now - peer.lastActivity > 60000) {
          status = "degraded";
          issues.push("No recent activity");
        }
      }

      health.push({
        peerId: peer.deviceId,
        status,
        issues,
        lastSeen: peer.lastActivity,
        connectionDuration: now - (now - 1000), // TODO: Track actual connection start time
      });
    }

    return health;
  }

  startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 10000); // Check every 10 seconds
  }

  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  destroy(): void {
    this.stopHealthChecks();
    this.peers.clear();
  }

  private performHealthCheck(): void {
    this.lastHealthCheck = Date.now();

    if (this.onHealthUpdate) {
      const health = this.getConnectionHealth();

      this.onHealthUpdate(health);
    }

    // Log health summary
    const metrics = this.getMetrics();

    console.log("Health check:", {
      connections: metrics.connectionCount,
      direct: metrics.directConnections,
      relay: metrics.relayConnections,
      totalBytes: metrics.totalBytesReceived + metrics.totalBytesSent,
    });
  }
}
