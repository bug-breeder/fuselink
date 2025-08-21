import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generatePairingData,
  generateQRCodeDataURL,
  parsePairingData,
  PairingQRData,
} from './qr';

const mockNavigator = {
  platform: 'MacIntel',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
});

const mockWindow = {
  location: {
    origin: 'https://localhost:3000',
  },
};

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

// Mock QRCode library
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(),
  },
}));

import QRCode from 'qrcode';

describe('QR Code Generation and Parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generatePairingData', () => {
    it('should generate valid pairing data structure', () => {
      const device = {
        id: 'test-device-id',
        name: 'Test Device',
        pubKeyJwk: {
          kty: 'EC',
          crv: 'P-256',
          x: 'test-x-value',
          y: 'test-y-value',
        },
        lastSeen: Date.now(),
        isOnline: true,
      };

      const signalingURL = 'wss://example.com/signaling';
      const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
      ];

      const result = generatePairingData(device, signalingURL, iceServers);

      expect(result).toEqual({
        version: 1,
        deviceId: device.id,
        deviceName: device.name,
        pubKeyJwk: device.pubKeyJwk,
        signalingURL,
        iceServers,
        timestamp: expect.any(Number),
      });

      expect(result.timestamp).toBeGreaterThan(Date.now() - 1000);
      expect(result.timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('generateQRCodeDataURL', () => {
    it('should generate QR code data URL', async () => {
      const mockDataURL = 'data:image/png;base64,mockqrcode';
      (QRCode.toDataURL as any).mockResolvedValue(mockDataURL);

      const pairingData: PairingQRData = {
        version: 1,
        deviceId: 'test-device-id',
        deviceName: 'Test Device',
        pubKeyJwk: {
          kty: 'EC',
          crv: 'P-256',
          x: 'test-x-value',
          y: 'test-y-value',
        },
        signalingURL: 'wss://example.com/signaling',
        iceServers: [],
        timestamp: Date.now(),
      };

      const result = await generateQRCodeDataURL(pairingData);

      expect(result).toBe(mockDataURL);
      expect(QRCode.toDataURL).toHaveBeenCalledWith(JSON.stringify(pairingData), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 256,
      });
    });

    it('should handle QR code generation errors', async () => {
      (QRCode.toDataURL as any).mockRejectedValue(new Error('QR generation failed'));

      const pairingData: PairingQRData = {
        version: 1,
        deviceId: 'test-device-id',
        deviceName: 'Test Device',
        pubKeyJwk: {
          kty: 'EC',
          crv: 'P-256',
          x: 'test-x-value',
          y: 'test-y-value',
        },
        signalingURL: 'wss://example.com/signaling',
        iceServers: [],
        timestamp: Date.now(),
      };

      await expect(generateQRCodeDataURL(pairingData)).rejects.toThrow(
        'Failed to generate QR code: QR generation failed'
      );
    });
  });

  describe('parsePairingData', () => {
    it('should parse valid pairing data', () => {
      const pairingData: PairingQRData = {
        version: 1,
        deviceId: 'a'.repeat(64), // 64-character hex string
        deviceName: 'Test Device',
        pubKeyJwk: {
          kty: 'EC',
          crv: 'P-256',
          x: 'test-x-value',
          y: 'test-y-value',
        },
        signalingURL: 'wss://example.com/signaling',
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
        ],
        timestamp: Date.now(),
      };

      const qrText = JSON.stringify(pairingData);
      const result = parsePairingData(qrText);

      expect(result).toEqual(pairingData);
    });

    it('should reject invalid JSON', () => {
      const invalidJson = '{ invalid json }';

      expect(() => parsePairingData(invalidJson)).toThrow(
        'QR code does not contain valid JSON data'
      );
    });

    it('should reject data without required fields', () => {
      const invalidData = {
        version: 1,
        deviceId: 'a'.repeat(64),
        // Missing deviceName, pubKeyJwk, signalingURL
      };

      expect(() => parsePairingData(JSON.stringify(invalidData))).toThrow(
        'Invalid pairing QR code format'
      );
    });

    it('should reject data without signaling URL', () => {
      const invalidData = {
        version: 1,
        deviceId: 'a'.repeat(64),
        deviceName: 'Test Device',
        pubKeyJwk: {
          kty: 'EC',
          crv: 'P-256',
          x: 'test-x-value',
          y: 'test-y-value',
        },
        // Missing signalingURL and iceServers
      };

      expect(() => parsePairingData(JSON.stringify(invalidData))).toThrow(
        'Missing signaling or ICE server information'
      );
    });

    it('should reject invalid device ID format', () => {
      const invalidData = {
        version: 1,
        deviceId: 'too-short', // Should be 64 characters
        deviceName: 'Test Device',
        pubKeyJwk: {
          kty: 'EC',
          crv: 'P-256',
          x: 'test-x-value',
          y: 'test-y-value',
        },
        signalingURL: 'wss://example.com/signaling',
        iceServers: [],
      };

      expect(() => parsePairingData(JSON.stringify(invalidData))).toThrow(
        'Invalid device ID format'
      );
    });

    it('should reject invalid public key format', () => {
      const invalidData = {
        version: 1,
        deviceId: 'a'.repeat(64),
        deviceName: 'Test Device',
        pubKeyJwk: {
          // Missing required fields
          kty: 'EC',
        },
        signalingURL: 'wss://example.com/signaling',
        iceServers: [],
      };

      expect(() => parsePairingData(JSON.stringify(invalidData))).toThrow(
        'Invalid public key format'
      );
    });

    it('should accept valid pairing data with all fields', () => {
      const validData = {
        version: 1,
        deviceId: 'a'.repeat(64),
        deviceName: 'Test Device',
        pubKeyJwk: {
          kty: 'EC',
          crv: 'P-256',
          x: 'test-x-value',
          y: 'test-y-value',
        },
        signalingURL: 'wss://example.com/signaling',
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
        ],
        timestamp: Date.now(),
      };

      const result = parsePairingData(JSON.stringify(validData));
      expect(result).toEqual(validData);
    });
  });
});