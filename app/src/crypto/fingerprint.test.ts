import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateSafetyWords,
  generateDeviceFingerprint,
  verifyFingerprints,
  DeviceFingerprint,
} from './fingerprint';

const mockCrypto = {
  subtle: {
    digest: vi.fn(),
  },
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
});

describe('Fingerprint Generation and Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSafetyWords', () => {
    it('should generate 6 safety words from public key', async () => {
      const publicKeyJwk = {
        kty: 'EC',
        crv: 'P-256',
        x: 'test-x-value',
        y: 'test-y-value',
      };

      const mockHash = new ArrayBuffer(32);
      const mockHashArray = new Uint8Array(mockHash);
      // Set specific values for predictable word selection
      mockHashArray[0] = 100;
      mockHashArray[1] = 200;
      mockHashArray[2] = 50;
      mockHashArray[3] = 150;
      mockHashArray[4] = 75;
      mockHashArray[5] = 25;

      mockCrypto.subtle.digest.mockResolvedValue(mockHash);

      const words = await generateSafetyWords(publicKeyJwk);

      expect(words).toHaveLength(6);
      expect(words.every(word => typeof word === 'string')).toBe(true);
      expect(words.every(word => word.length > 0)).toBe(true);

      // Verify digest was called with SHA-256 and proper data
      expect(mockCrypto.subtle.digest).toHaveBeenCalledTimes(1);
      const [algorithm, data] = mockCrypto.subtle.digest.mock.calls[0];
      expect(algorithm).toBe('SHA-256');
      expect(data.constructor.name).toBe('Uint8Array');
    });

    it('should generate different words for different keys', async () => {
      const publicKeyJwk1 = {
        kty: 'EC',
        crv: 'P-256',
        x: 'test-x-value-1',
        y: 'test-y-value-1',
      };

      const publicKeyJwk2 = {
        kty: 'EC',
        crv: 'P-256',
        x: 'test-x-value-2',
        y: 'test-y-value-2',
      };

      const mockHash1 = new ArrayBuffer(32);
      const mockHashArray1 = new Uint8Array(mockHash1);
      mockHashArray1.fill(0);

      const mockHash2 = new ArrayBuffer(32);
      const mockHashArray2 = new Uint8Array(mockHash2);
      mockHashArray2.fill(255);

      mockCrypto.subtle.digest
        .mockResolvedValueOnce(mockHash1)
        .mockResolvedValueOnce(mockHash2);

      const words1 = await generateSafetyWords(publicKeyJwk1);
      const words2 = await generateSafetyWords(publicKeyJwk2);

      expect(words1).not.toEqual(words2);
    });

    it('should generate consistent words for same key', async () => {
      const publicKeyJwk = {
        kty: 'EC',
        crv: 'P-256',
        x: 'same-x-value',
        y: 'same-y-value',
      };

      const mockHash = new ArrayBuffer(32);
      const mockHashArray = new Uint8Array(mockHash);
      mockHashArray.fill(42);

      mockCrypto.subtle.digest.mockResolvedValue(mockHash);

      const words1 = await generateSafetyWords(publicKeyJwk);
      const words2 = await generateSafetyWords(publicKeyJwk);

      expect(words1).toEqual(words2);
    });

    it('should handle digest errors', async () => {
      const publicKeyJwk = {
        kty: 'EC',
        crv: 'P-256',
        x: 'test-x-value',
        y: 'test-y-value',
      };

      mockCrypto.subtle.digest.mockRejectedValue(new Error('Digest failed'));

      await expect(generateSafetyWords(publicKeyJwk)).rejects.toThrow(
        'Failed to generate safety words: Digest failed'
      );
    });

    it('should select words from predefined wordlist', async () => {
      const publicKeyJwk = {
        kty: 'EC',
        crv: 'P-256',
        x: 'test-x-value',
        y: 'test-y-value',
      };

      const mockHash = new ArrayBuffer(32);
      const mockHashArray = new Uint8Array(mockHash);
      // Use indices that map to known words
      mockHashArray[0] = 0;   // First word
      mockHashArray[1] = 1;   // Second word
      mockHashArray[2] = 2;   // Third word
      mockHashArray[3] = 3;   // Fourth word
      mockHashArray[4] = 4;   // Fifth word
      mockHashArray[5] = 5;   // Sixth word

      mockCrypto.subtle.digest.mockResolvedValue(mockHash);

      const words = await generateSafetyWords(publicKeyJwk);

      // Should be valid English words from BIP-39 subset
      expect(words).toHaveLength(6);
      words.forEach(word => {
        expect(word).toMatch(/^[a-z]+$/); // Only lowercase letters
        expect(word.length).toBeGreaterThan(2); // Meaningful words
      });
    });
  });

  describe('generateDeviceFingerprint', () => {
    it('should generate fingerprint from device ID and public key', async () => {
      const deviceId = 'test-device-id';
      const publicKeyJwk = {
        kty: 'EC',
        crv: 'P-256',
        x: 'test-x-coordinate',
        y: 'test-y-coordinate',
      };

      const mockHash = new ArrayBuffer(32);
      const mockHashArray = new Uint8Array(mockHash);
      mockHashArray[0] = 10;
      mockHashArray[1] = 20;
      mockHashArray[2] = 30;
      mockHashArray[3] = 40;
      mockHashArray[4] = 50;
      mockHashArray[5] = 60;

      mockCrypto.subtle.digest
        .mockResolvedValueOnce(mockHash) // for safety words
        .mockResolvedValueOnce(mockHash); // for full hash

      const fingerprint = await generateDeviceFingerprint(deviceId, publicKeyJwk);

      expect(fingerprint).toEqual({
        deviceId,
        safetyWords: expect.any(Array),
        hash: expect.any(String),
      });
      expect(fingerprint.safetyWords).toHaveLength(6);
      expect(fingerprint.hash).toHaveLength(64); // 32 bytes as hex = 64 chars
    });

    it('should generate same fingerprint for same inputs', async () => {
      const deviceId = 'test-device-id';
      const publicKeyJwk = {
        kty: 'EC',
        crv: 'P-256',
        x: 'same-x-coordinate',
        y: 'same-y-coordinate',
      };

      const mockHash = new ArrayBuffer(32);
      const mockHashArray = new Uint8Array(mockHash);
      mockHashArray.fill(123);

      mockCrypto.subtle.digest.mockResolvedValue(mockHash);

      const fingerprint1 = await generateDeviceFingerprint(deviceId, publicKeyJwk);
      const fingerprint2 = await generateDeviceFingerprint(deviceId, publicKeyJwk);

      expect(fingerprint1).toEqual(fingerprint2);
    });

    it('should generate different fingerprints for different keys', async () => {
      const deviceId = 'test-device-id';
      const publicKeyJwk1 = {
        kty: 'EC',
        crv: 'P-256',
        x: 'first-x-coordinate',
        y: 'first-y-coordinate',
      };

      const publicKeyJwk2 = {
        kty: 'EC',
        crv: 'P-256',
        x: 'second-x-coordinate',
        y: 'second-y-coordinate',
      };

      const mockHash1 = new ArrayBuffer(32);
      const mockHashArray1 = new Uint8Array(mockHash1);
      mockHashArray1.fill(100);

      const mockHash2 = new ArrayBuffer(32);
      const mockHashArray2 = new Uint8Array(mockHash2);
      mockHashArray2.fill(200);

      mockCrypto.subtle.digest
        .mockResolvedValueOnce(mockHash1) // safety words for key 1
        .mockResolvedValueOnce(mockHash1) // full hash for key 1
        .mockResolvedValueOnce(mockHash2) // safety words for key 2
        .mockResolvedValueOnce(mockHash2); // full hash for key 2

      const fingerprint1 = await generateDeviceFingerprint(deviceId, publicKeyJwk1);
      const fingerprint2 = await generateDeviceFingerprint(deviceId, publicKeyJwk2);

      expect(fingerprint1.safetyWords).not.toEqual(fingerprint2.safetyWords);
      expect(fingerprint1.hash).not.toBe(fingerprint2.hash);
    });
  });

  describe('verifyFingerprints', () => {
    it('should return true for identical fingerprints', async () => {
      const fingerprint1: DeviceFingerprint = {
        deviceId: 'device-1',
        safetyWords: ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig'],
        hash: 'abcd1234',
      };
      const fingerprint2: DeviceFingerprint = {
        deviceId: 'device-2', // Different ID is OK
        safetyWords: ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig'],
        hash: 'abcd1234',
      };

      const result = await verifyFingerprints(fingerprint1, fingerprint2);

      expect(result).toBe(true);
    });

    it('should return false for different safety words', async () => {
      const fingerprint1: DeviceFingerprint = {
        deviceId: 'device-1',
        safetyWords: ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig'],
        hash: 'abcd1234',
      };
      const fingerprint2: DeviceFingerprint = {
        deviceId: 'device-2',
        safetyWords: ['apple', 'banana', 'cherry', 'date', 'elderberry', 'grape'],
        hash: 'abcd1234',
      };

      const result = await verifyFingerprints(fingerprint1, fingerprint2);

      expect(result).toBe(false);
    });

    it('should return false for different hashes', async () => {
      const fingerprint1: DeviceFingerprint = {
        deviceId: 'device-1',
        safetyWords: ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig'],
        hash: 'abcd1234',
      };
      const fingerprint2: DeviceFingerprint = {
        deviceId: 'device-2',
        safetyWords: ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig'],
        hash: 'efgh5678',
      };

      const result = await verifyFingerprints(fingerprint1, fingerprint2);

      expect(result).toBe(false);
    });

    it('should return false for different length fingerprints', async () => {
      const fingerprint1: DeviceFingerprint = {
        deviceId: 'device-1',
        safetyWords: ['apple', 'banana', 'cherry'],
        hash: 'abcd1234',
      };
      const fingerprint2: DeviceFingerprint = {
        deviceId: 'device-2',
        safetyWords: ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig'],
        hash: 'abcd1234',
      };

      const result = await verifyFingerprints(fingerprint1, fingerprint2);

      expect(result).toBe(false);
    });

    it('should be case insensitive for safety words', async () => {
      const fingerprint1: DeviceFingerprint = {
        deviceId: 'device-1',
        safetyWords: ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig'],
        hash: 'abcd1234',
      };
      const fingerprint2: DeviceFingerprint = {
        deviceId: 'device-2',
        safetyWords: ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig'],
        hash: 'abcd1234',
      };

      const result = await verifyFingerprints(fingerprint1, fingerprint2);

      expect(result).toBe(true);
    });

    it('should handle empty arrays', async () => {
      const fingerprint1: DeviceFingerprint = {
        deviceId: 'device-1',
        safetyWords: [],
        hash: 'abcd1234',
      };
      const fingerprint2: DeviceFingerprint = {
        deviceId: 'device-2',
        safetyWords: [],
        hash: 'abcd1234',
      };

      const result = await verifyFingerprints(fingerprint1, fingerprint2);

      expect(result).toBe(true);
    });

    it('should handle order sensitivity', async () => {
      const fingerprint1: DeviceFingerprint = {
        deviceId: 'device-1',
        safetyWords: ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig'],
        hash: 'abcd1234',
      };
      const fingerprint2: DeviceFingerprint = {
        deviceId: 'device-2',
        safetyWords: ['banana', 'apple', 'cherry', 'date', 'elderberry', 'fig'],
        hash: 'abcd1234',
      };

      const result = await verifyFingerprints(fingerprint1, fingerprint2);

      expect(result).toBe(false);
    });
  });

  describe('integration test', () => {
    it('should generate and verify fingerprints for device pairing', async () => {
      const deviceAId = 'device-a-id';
      const deviceA = {
        kty: 'EC',
        crv: 'P-256',
        x: 'device-a-x-coordinate',
        y: 'device-a-y-coordinate',
      };

      const deviceBId = 'device-b-id';
      const deviceB = {
        kty: 'EC',
        crv: 'P-256',
        x: 'device-b-x-coordinate',
        y: 'device-b-y-coordinate',
      };

      const mockHashA = new ArrayBuffer(32);
      const mockHashArrayA = new Uint8Array(mockHashA);
      mockHashArrayA[0] = 50;
      mockHashArrayA[1] = 100;
      mockHashArrayA[2] = 150;
      mockHashArrayA[3] = 200;
      mockHashArrayA[4] = 25;
      mockHashArrayA[5] = 75;

      const mockHashB = new ArrayBuffer(32);
      const mockHashArrayB = new Uint8Array(mockHashB);
      mockHashArrayB[0] = 60;
      mockHashArrayB[1] = 110;
      mockHashArrayB[2] = 160;
      mockHashArrayB[3] = 210;
      mockHashArrayB[4] = 35;
      mockHashArrayB[5] = 85;

      mockCrypto.subtle.digest
        .mockResolvedValueOnce(mockHashA) // safety words for A
        .mockResolvedValueOnce(mockHashA) // full hash for A
        .mockResolvedValueOnce(mockHashB) // safety words for B
        .mockResolvedValueOnce(mockHashB); // full hash for B

      const fingerprintA = await generateDeviceFingerprint(deviceAId, deviceA);
      const fingerprintB = await generateDeviceFingerprint(deviceBId, deviceB);

      // Different devices should have different fingerprints
      expect(await verifyFingerprints(fingerprintA, fingerprintB)).toBe(false);

      // Same device should have same fingerprint
      mockCrypto.subtle.digest
        .mockResolvedValueOnce(mockHashA) // safety words for A again
        .mockResolvedValueOnce(mockHashA); // full hash for A again
      const fingerprintA2 = await generateDeviceFingerprint(deviceAId, deviceA);
      expect(await verifyFingerprints(fingerprintA, fingerprintA2)).toBe(true);
    });
  });
});