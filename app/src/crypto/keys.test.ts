import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  generateDeviceKeyPair,
  deriveDeviceId,
  importPrivateKey,
  importPublicKey,
  deriveSharedSecret,
} from "./keys";

// Mock crypto.subtle for testing
const mockCrypto = {
  subtle: {
    generateKey: vi.fn(),
    exportKey: vi.fn(),
    importKey: vi.fn(),
    deriveBits: vi.fn(),
    digest: vi.fn(),
  },
};

// Setup global crypto mock
Object.defineProperty(global, "crypto", {
  value: mockCrypto,
  writable: true,
});

describe("Crypto Keys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateDeviceKeyPair", () => {
    it("should generate a valid ECDH key pair", async () => {
      const mockPublicKey = {};
      const mockPrivateKey = {};
      const mockKeyPair = {
        publicKey: mockPublicKey,
        privateKey: mockPrivateKey,
      };
      const mockPublicKeyJwk = {
        kty: "EC",
        crv: "P-256",
        x: "mock-x-value",
        y: "mock-y-value",
      };
      const mockDeviceId = "a".repeat(64); // 64-character hex string

      mockCrypto.subtle.generateKey.mockResolvedValue(mockKeyPair);
      mockCrypto.subtle.exportKey.mockResolvedValue(mockPublicKeyJwk);
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32));

      const result = await generateDeviceKeyPair();

      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        {
          name: "ECDH",
          namedCurve: "P-256",
        },
        true,
        ["deriveKey", "deriveBits"],
      );

      expect(result).toEqual({
        publicKeyJwk: mockPublicKeyJwk,
        privateKey: mockPrivateKey,
        deviceId: expect.any(String),
      });

      expect(result.deviceId).toHaveLength(64);
    });

    it("should handle key generation errors", async () => {
      mockCrypto.subtle.generateKey.mockRejectedValue(
        new Error("Key generation failed"),
      );

      await expect(generateDeviceKeyPair()).rejects.toThrow(
        "Failed to generate device key pair: Key generation failed",
      );
    });
  });

  describe("deriveDeviceId", () => {
    it("should generate consistent device ID from public key", async () => {
      const publicKeyJwk = {
        kty: "EC",
        crv: "P-256",
        x: "test-x-value",
        y: "test-y-value",
      };

      // Mock hash result - 32 bytes of zeros
      const mockHashBuffer = new ArrayBuffer(32);
      const mockHashArray = new Uint8Array(mockHashBuffer);

      mockHashArray.fill(0);

      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer);

      const deviceId = await deriveDeviceId(publicKeyJwk);

      expect(deviceId).toBe("0".repeat(64)); // All zeros as hex
      expect(deviceId).toHaveLength(64);

      // Should be deterministic - same input should give same output
      const deviceId2 = await deriveDeviceId(publicKeyJwk);

      expect(deviceId2).toBe(deviceId);
    });

    it("should generate different IDs for different keys", async () => {
      const publicKeyJwk1 = {
        kty: "EC",
        crv: "P-256",
        x: "test-x-value-1",
        y: "test-y-value-1",
      };

      const publicKeyJwk2 = {
        kty: "EC",
        crv: "P-256",
        x: "test-x-value-2",
        y: "test-y-value-2",
      };

      // Mock different hash results
      const mockHashBuffer1 = new ArrayBuffer(32);
      const mockHashArray1 = new Uint8Array(mockHashBuffer1);

      mockHashArray1.fill(0);

      const mockHashBuffer2 = new ArrayBuffer(32);
      const mockHashArray2 = new Uint8Array(mockHashBuffer2);

      mockHashArray2.fill(255);

      mockCrypto.subtle.digest
        .mockResolvedValueOnce(mockHashBuffer1)
        .mockResolvedValueOnce(mockHashBuffer2);

      const deviceId1 = await deriveDeviceId(publicKeyJwk1);
      const deviceId2 = await deriveDeviceId(publicKeyJwk2);

      expect(deviceId1).not.toBe(deviceId2);
    });

    it("should handle digest errors", async () => {
      const publicKeyJwk = {
        kty: "EC",
        crv: "P-256",
        x: "test-x-value",
        y: "test-y-value",
      };

      mockCrypto.subtle.digest.mockRejectedValue(new Error("Digest failed"));

      await expect(deriveDeviceId(publicKeyJwk)).rejects.toThrow(
        "Failed to derive device ID: Digest failed",
      );
    });
  });

  describe("importPrivateKey", () => {
    it("should import private key from JWK", async () => {
      const privateKeyJwk = {
        kty: "EC",
        crv: "P-256",
        x: "test-x-value",
        y: "test-y-value",
        d: "private-key-value",
      };

      const mockImportedKey = {};

      mockCrypto.subtle.importKey.mockResolvedValue(mockImportedKey);

      const result = await importPrivateKey(privateKeyJwk);

      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        "jwk",
        privateKeyJwk,
        {
          name: "ECDH",
          namedCurve: "P-256",
        },
        false,
        ["deriveKey", "deriveBits"],
      );

      expect(result).toBe(mockImportedKey);
    });

    it("should handle import errors", async () => {
      const privateKeyJwk = {
        kty: "EC",
        crv: "P-256",
        d: "invalid-key",
      };

      mockCrypto.subtle.importKey.mockRejectedValue(new Error("Import failed"));

      await expect(importPrivateKey(privateKeyJwk)).rejects.toThrow(
        "Failed to import private key: Import failed",
      );
    });
  });

  describe("importPublicKey", () => {
    it("should import public key from JWK", async () => {
      const publicKeyJwk = {
        kty: "EC",
        crv: "P-256",
        x: "test-x-value",
        y: "test-y-value",
      };

      const mockImportedKey = {};

      mockCrypto.subtle.importKey.mockResolvedValue(mockImportedKey);

      const result = await importPublicKey(publicKeyJwk);

      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        "jwk",
        publicKeyJwk,
        {
          name: "ECDH",
          namedCurve: "P-256",
        },
        false,
        [],
      );

      expect(result).toBe(mockImportedKey);
    });
  });

  describe("deriveSharedSecret", () => {
    it("should derive shared secret from private and public keys", async () => {
      const privateKey = {};
      const publicKeyJwk = {
        kty: "EC",
        crv: "P-256",
        x: "test-x-value",
        y: "test-y-value",
      };

      const mockPublicKey = {};
      const mockSharedSecret = new ArrayBuffer(32);

      mockCrypto.subtle.importKey.mockResolvedValue(mockPublicKey);
      mockCrypto.subtle.deriveBits.mockResolvedValue(mockSharedSecret);

      const result = await deriveSharedSecret(
        privateKey as CryptoKey,
        publicKeyJwk,
      );

      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        "jwk",
        publicKeyJwk,
        {
          name: "ECDH",
          namedCurve: "P-256",
        },
        false,
        [],
      );

      expect(mockCrypto.subtle.deriveBits).toHaveBeenCalledWith(
        {
          name: "ECDH",
          public: mockPublicKey,
        },
        privateKey,
        256,
      );

      expect(result).toBe(mockSharedSecret);
    });

    it("should handle derivation errors", async () => {
      const privateKey = {};
      const publicKeyJwk = {
        kty: "EC",
        crv: "P-256",
        x: "test-x-value",
        y: "test-y-value",
      };

      mockCrypto.subtle.importKey.mockResolvedValue({});
      mockCrypto.subtle.deriveBits.mockRejectedValue(
        new Error("Derivation failed"),
      );

      await expect(
        deriveSharedSecret(privateKey as CryptoKey, publicKeyJwk),
      ).rejects.toThrow("Failed to derive shared secret: Derivation failed");
    });
  });
});
