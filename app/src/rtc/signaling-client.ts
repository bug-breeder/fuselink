import type { SignalingMessageUnion } from "./types";

export interface SignalingClientConfig {
  signalingUrl: string;
  deviceId: string;
  onMessage: (message: SignalingMessageUnion) => void;
  onConnectionChange: (connected: boolean) => void;
  onError: (error: Error) => void;
}

export class SignalingClient {
  private ws: WebSocket | null = null;
  private config: SignalingClientConfig;
  private roomId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionallyDisconnected = false;

  constructor(config: SignalingClientConfig) {
    this.config = config;
  }

  async connect(roomId: string): Promise<void> {
    this.roomId = roomId;
    this.isIntentionallyDisconnected = false;

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.config.signalingUrl}/ws/signaling/${roomId}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("Signaling connected to room:", roomId);
          this.reconnectAttempts = 0;
          this.config.onConnectionChange(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: SignalingMessageUnion = JSON.parse(event.data);

            this.config.onMessage(message);
          } catch (error) {
            console.error("Failed to parse signaling message:", error);
            this.config.onError(new Error("Invalid signaling message format"));
          }
        };

        this.ws.onclose = (event) => {
          console.log("Signaling disconnected:", event.code, event.reason);

          if (!this.isIntentionallyDisconnected) {
            this.config.onConnectionChange(false);

            if (this.reconnectAttempts < this.maxReconnectAttempts) {
              this.scheduleReconnect();
            }
          }
        };

        this.ws.onerror = (error) => {
          console.error("Signaling WebSocket error:", error);
          this.config.onError(new Error("WebSocket connection failed"));
          reject(new Error("Failed to connect to signaling server"));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  sendMessage(message: Omit<SignalingMessageUnion, "deviceId">): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Signaling client is not connected");
    }

    const messageWithDeviceId: SignalingMessageUnion = {
      ...message,
      deviceId: this.config.deviceId,
    } as SignalingMessageUnion;

    this.ws.send(JSON.stringify(messageWithDeviceId));
  }

  disconnect(): void {
    this.isIntentionallyDisconnected = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Update connection status immediately
    this.config.onConnectionChange(false);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);

    console.log(
      `Scheduling reconnect attempt ${this.reconnectAttempts + 1} in ${delay}ms`,
    );

    this.reconnectTimer = setTimeout(() => {
      if (!this.isIntentionallyDisconnected && this.roomId) {
        this.reconnectAttempts++;
        this.connect(this.roomId).catch((error) => {
          console.error("Reconnect failed:", error);
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.config.onError(new Error("Max reconnect attempts reached"));
          }
        });
      }
    }, delay);
  }
}
