import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  generatePairingData,
  generateQRCodeDataURL,
  parsePairingData,
  getDefaultIceServers,
  getIceServersForPairing,
  expandPublicKey,
  PairingQRData,
} from "./qr";

const mockNavigator = {
  platform: "MacIntel",
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
};

Object.defineProperty(global, "navigator", {
  value: mockNavigator,
  writable: true,
});

const mockWindow = {
  location: {
    origin: "https://localhost:3000",
  },
};

Object.defineProperty(global, "window", {
  value: mockWindow,
  writable: true,
});

// Mock QRCode library
vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn(),
  },
}));

import QRCode from "qrcode";

describe("QR Code Generation and Parsing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generatePairingData", () => {
    it("should generate valid ultra-compact pairing data structure", () => {
      const device = {
        id: "test-device-id",
        name: "Test Device",
        pubKeyJwk: {
          kty: "EC",
          crv: "P-256",
          x: "test-x-value",
          y: "test-y-value",
        },
        lastSeen: Date.now(),
        isOnline: true,
      };

      const signalingURL = "wss://example.com/signaling";

      const result = generatePairingData(device, signalingURL);

      expect(result).toEqual({
        v: 1,
        id: device.id,
        key: [device.pubKeyJwk.x, device.pubKeyJwk.y],
        signal: signalingURL,
        ts: expect.any(Number),
      });

      expect(result.ts).toBeGreaterThan(Date.now() - 1000);
      expect(result.ts).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("generateQRCodeDataURL", () => {
    it("should generate QR code data URL", async () => {
      const mockDataURL = "data:image/png;base64,mockqrcode";

      (QRCode.toDataURL as any).mockResolvedValue(mockDataURL);

      const pairingData: PairingQRData = {
        v: 1,
        id: "test-device-id",
        key: ["test-x-value", "test-y-value"],
        signal: "wss://example.com/signaling",
        ts: Date.now(),
      };

      const result = await generateQRCodeDataURL(pairingData);

      expect(result).toBe(mockDataURL);
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        JSON.stringify(pairingData),
        {
          errorCorrectionLevel: "M",
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
          width: 256,
        },
      );
    });

    it("should handle QR code generation errors", async () => {
      (QRCode.toDataURL as any).mockRejectedValue(
        new Error("QR generation failed"),
      );

      const pairingData: PairingQRData = {
        v: 1,
        id: "test-device-id",
        key: ["test-x-value", "test-y-value"],
        signal: "wss://example.com/signaling",
        ts: Date.now(),
      };

      await expect(generateQRCodeDataURL(pairingData)).rejects.toThrow(
        "Failed to generate QR code: QR generation failed",
      );
    });
  });

  describe("parsePairingData", () => {
    it("should parse valid ultra-compact pairing data", () => {
      const pairingData: PairingQRData = {
        v: 1,
        id: "a".repeat(64), // 64-character hex string
        key: ["test-x-value", "test-y-value"],
        signal: "wss://example.com/signaling",
        ts: Date.now(),
      };

      const qrText = JSON.stringify(pairingData);
      const result = parsePairingData(qrText);

      expect(result).toEqual(pairingData);
    });

    it("should parse intermediate compact format (with device name)", () => {
      const intermediateData = {
        v: 1,
        id: "a".repeat(64),
        name: "Test Device",
        key: {
          kty: "EC",
          crv: "P-256",
          x: "test-x-value",
          y: "test-y-value",
        },
        signal: "wss://example.com/signaling",
        ts: Date.now(),
      };

      const qrText = JSON.stringify(intermediateData);
      const result = parsePairingData(qrText);

      // Should be converted to ultra-compact format
      expect(result).toEqual({
        v: 1,
        id: intermediateData.id,
        key: [intermediateData.key.x, intermediateData.key.y],
        signal: intermediateData.signal,
        ts: intermediateData.ts,
      });
    });

    it("should parse legacy pairing data format", () => {
      const legacyData = {
        version: 1,
        deviceId: "a".repeat(64),
        deviceName: "Test Device",
        pubKeyJwk: {
          kty: "EC",
          crv: "P-256",
          x: "test-x-value",
          y: "test-y-value",
        },
        signalingURL: "wss://example.com/signaling",
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        timestamp: Date.now(),
      };

      const qrText = JSON.stringify(legacyData);
      const result = parsePairingData(qrText);

      // Should be converted to ultra-compact format
      expect(result).toEqual({
        v: 1,
        id: legacyData.deviceId,
        key: [legacyData.pubKeyJwk.x, legacyData.pubKeyJwk.y],
        signal: legacyData.signalingURL,
        ts: legacyData.timestamp,
      });
    });

    it("should reject invalid JSON", () => {
      const invalidJson = "{ invalid json }";

      expect(() => parsePairingData(invalidJson)).toThrow(
        "QR code does not contain valid JSON data",
      );
    });

    it("should reject ultra-compact data without required fields", () => {
      const invalidData = {
        v: 1,
        id: "a".repeat(64),
        // Missing key, signal
      };

      expect(() => parsePairingData(JSON.stringify(invalidData))).toThrow(
        "Invalid pairing QR code format",
      );
    });

    it("should reject data without signaling URL", () => {
      const invalidData = {
        v: 1,
        id: "a".repeat(64),
        key: ["test-x-value", "test-y-value"],
        // Missing signal
      };

      expect(() => parsePairingData(JSON.stringify(invalidData))).toThrow(
        "Missing signaling information",
      );
    });

    it("should reject invalid device ID format", () => {
      const invalidData = {
        v: 1,
        id: "too-short", // Should be 64 characters
        key: ["test-x-value", "test-y-value"],
        signal: "wss://example.com/signaling",
        ts: Date.now(),
      };

      expect(() => parsePairingData(JSON.stringify(invalidData))).toThrow(
        "Invalid device ID format",
      );
    });

    it("should reject invalid public key format", () => {
      const invalidData = {
        v: 1,
        id: "a".repeat(64),
        key: ["test-x-value"], // Should have 2 coordinates
        signal: "wss://example.com/signaling",
        ts: Date.now(),
      };

      expect(() => parsePairingData(JSON.stringify(invalidData))).toThrow(
        "Invalid pairing QR code format",
      );
    });

    it("should accept valid ultra-compact pairing data with all fields", () => {
      const validData = {
        v: 1,
        id: "a".repeat(64),
        key: ["test-x-value", "test-y-value"],
        signal: "wss://example.com/signaling",
        ts: Date.now(),
      };

      const result = parsePairingData(JSON.stringify(validData));

      expect(result).toEqual(validData);
    });
  });

  describe("expandPublicKey", () => {
    it("should expand compact key format to full JWK", () => {
      const compactKey: [string, string] = ["test-x-value", "test-y-value"];
      const result = expandPublicKey(compactKey);

      expect(result).toEqual({
        kty: "EC",
        crv: "P-256",
        x: "test-x-value",
        y: "test-y-value",
        ext: true,
        key_ops: [],
      });
    });
  });

  describe("getIceServersForPairing", () => {
    it("should return default ICE servers for pairing", () => {
      const iceServers = getIceServersForPairing();

      expect(iceServers).toHaveLength(10);

      // Should include Google STUN servers
      const googleServers = iceServers.filter(
        (server) =>
          server.urls.includes("stun.l.google.com") ||
          server.urls.includes("stun1.l.google.com") ||
          server.urls.includes("stun2.l.google.com") ||
          server.urls.includes("stun3.l.google.com") ||
          server.urls.includes("stun4.l.google.com"),
      );

      expect(googleServers).toHaveLength(9);
    });
  });

  describe("getDefaultIceServers", () => {
    it("should return comprehensive Google ICE servers configuration", () => {
      const iceServers = getDefaultIceServers();

      expect(iceServers).toHaveLength(10);

      // Check Google STUN servers are included
      const googleServers = iceServers.filter(
        (server) =>
          server.urls.includes("stun.l.google.com") ||
          server.urls.includes("stun1.l.google.com") ||
          server.urls.includes("stun2.l.google.com") ||
          server.urls.includes("stun3.l.google.com") ||
          server.urls.includes("stun4.l.google.com"),
      );

      expect(googleServers).toHaveLength(9);

      // Check Twilio fallback server is included
      const twilioServer = iceServers.find((server) =>
        server.urls.includes("global.stun.twilio.com"),
      );

      expect(twilioServer).toBeDefined();
      expect(twilioServer?.urls).toBe("stun:global.stun.twilio.com:3478");

      // Check variety of ports are used
      const ports = iceServers
        .map((server) => {
          const match = server.urls.match(/:(\d+)$/);

          return match ? parseInt(match[1]) : null;
        })
        .filter(Boolean);

      expect(ports).toContain(19302);
      expect(ports).toContain(3478);
      expect(ports).toContain(5349);
    });

    it("should return valid RTCIceServer objects", () => {
      const iceServers = getDefaultIceServers();

      iceServers.forEach((server) => {
        expect(server).toHaveProperty("urls");
        expect(typeof server.urls).toBe("string");
        expect(server.urls).toMatch(/^stun:/);
      });
    });
  });
});
