export interface SignalingMessage {
  type: "offer" | "answer" | "ice-candidate" | "error" | "device-info";
  deviceId: string;
  targetDeviceId?: string;
  data?: unknown;
}

export interface OfferMessage extends SignalingMessage {
  type: "offer";
  data: {
    sdp: RTCSessionDescriptionInit;
  };
}

export interface AnswerMessage extends SignalingMessage {
  type: "answer";
  data: {
    sdp: RTCSessionDescriptionInit;
  };
}

export interface IceCandidateMessage extends SignalingMessage {
  type: "ice-candidate";
  data: {
    candidate: RTCIceCandidateInit;
  };
}

export interface DeviceInfoMessage extends SignalingMessage {
  type: "device-info";
  data: {
    name: string;
    pubKeyJwk: JsonWebKey;
  };
}

export interface ErrorMessage extends SignalingMessage {
  type: "error";
  data: {
    message: string;
    code?: string;
  };
}

export type SignalingMessageUnion =
  | OfferMessage
  | AnswerMessage
  | IceCandidateMessage
  | DeviceInfoMessage
  | ErrorMessage;

export interface PeerConnection {
  id: string;
  deviceId: string;
  connection: RTCPeerConnection;
  controlChannel?: RTCDataChannel;
  fileChannel?: RTCDataChannel;
  status: "connecting" | "connected" | "disconnected" | "failed";
  connectionType?: "direct" | "relay";
  lastActivity: number;
  bytesReceived: number;
  bytesSent: number;
}

export interface ICEServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface TurnCredentials {
  urls: string[];
  username: string;
  credential: string;
  expiresAt: number;
}

export interface ConnectionStats {
  connectionType: "direct" | "relay" | "unknown";
  localCandidateType?: string;
  remoteCandidateType?: string;
  bytesReceived: number;
  bytesSent: number;
  packetsReceived: number;
  packetsSent: number;
  rtt?: number;
  availableBandwidth?: number;
}
