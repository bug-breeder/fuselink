import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  initializeDevice,
  getDevicePrivateKey,
  getCurrentDevice,
  updateDeviceInfo,
  clearDeviceData,
} from "./device";
import * as keysModule from "./keys";

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(global, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

// Mock navigator
Object.defineProperty(global, "navigator", {
  value: {
    platform: "MacIntel",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  },
  writable: true,
});

// Mock window.location
Object.defineProperty(global, "window", {
  value: {
    location: {
      origin: "https://localhost:3000",
    },
  },
  writable: true,
});

// Mock crypto
const mockCrypto = {
  subtle: {
    generateKey: vi.fn(),
    exportKey: vi.fn(),
    importKey: vi.fn(),
  },
};

Object.defineProperty(global, "crypto", {
  value: mockCrypto,
  writable: true,
});

describe("Device Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe("initializeDevice", () => {
    it("should create new device on first run", async () => {
      const mockKeyPair = {
        publicKeyJwk: {
          kty: "EC",
          crv: "P-256",
          x: "test-x",
          y: "test-y",
        },
        privateKey: {},
        deviceId: "a".repeat(64),
      };

      const mockPrivateKeyJwk = {
        kty: "EC",
        crv: "P-256",
        x: "test-x",
        y: "test-y",
        d: "private-key",
      };

      vi.spyOn(keysModule, "generateDeviceKeyPair").mockResolvedValue(
        mockKeyPair,
      );
      mockCrypto.subtle.exportKey.mockResolvedValue(mockPrivateKeyJwk);

      const device = await initializeDevice("Test Device");

      expect(device).toEqual({
        id: mockKeyPair.deviceId,
        name: "Test Device",
        pubKeyJwk: mockKeyPair.publicKeyJwk,
        lastSeen: expect.any(Number),
        isOnline: true,
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);
      expect(keysModule.generateDeviceKeyPair).toHaveBeenCalled();
    });

    it("should load existing device if keys exist", async () => {
      const existingKeys = {
        publicKeyJwk: {
          kty: "EC",
          crv: "P-256",
          x: "test-x",
          y: "test-y",
        },
        privateKeyJwk: {
          kty: "EC",
          crv: "P-256",
          x: "test-x",
          y: "test-y",
          d: "private-key",
        },
        deviceId: "existing-device-id",
        createdAt: Date.now(),
      };

      const existingDevice = {
        id: "existing-device-id",
        name: "Existing Device",
        pubKeyJwk: existingKeys.publicKeyJwk,
        lastSeen: Date.now(),
        isOnline: true,
      };

      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(existingKeys)) // device keys
        .mockReturnValueOnce(JSON.stringify(existingDevice)); // device info

      const device = await initializeDevice();

      expect(device.id).toBe("existing-device-id");
      expect(device.name).toBe("Existing Device");
      expect(keysModule.generateDeviceKeyPair).not.toHaveBeenCalled();
    });

    it("should generate default device name", async () => {
      const mockKeyPair = {
        publicKeyJwk: {
          kty: "EC",
          crv: "P-256",
          x: "test-x",
          y: "test-y",
        },
        privateKey: {},
        deviceId: "a".repeat(64),
      };

      vi.spyOn(keysModule, "generateDeviceKeyPair").mockResolvedValue(
        mockKeyPair,
      );
      mockCrypto.subtle.exportKey.mockResolvedValue({});

      const device = await initializeDevice();

      expect(device.name).toBe("MacIntel (Chrome)");
    });

    it("should handle initialization errors", async () => {
      vi.spyOn(keysModule, "generateDeviceKeyPair").mockRejectedValue(
        new Error("Key generation failed"),
      );

      await expect(initializeDevice()).rejects.toThrow(
        "Failed to initialize device: Key generation failed",
      );
    });
  });

  describe("getDevicePrivateKey", () => {
    it("should return private key if exists", async () => {
      const mockKeys = {
        privateKeyJwk: {
          kty: "EC",
          crv: "P-256",
          x: "test-x",
          y: "test-y",
          d: "private-key",
        },
      };

      const mockPrivateKey = {};

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockKeys));
      mockCrypto.subtle.importKey.mockResolvedValue(mockPrivateKey);

      const result = await getDevicePrivateKey();

      expect(result).toBe(mockPrivateKey);
      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        "jwk",
        mockKeys.privateKeyJwk,
        {
          name: "ECDH",
          namedCurve: "P-256",
        },
        false,
        ["deriveKey", "deriveBits"],
      );
    });

    it("should return null if no keys exist", async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await getDevicePrivateKey();

      expect(result).toBeNull();
    });

    it("should handle import errors gracefully", async () => {
      const mockKeys = {
        privateKeyJwk: {
          kty: "EC",
          crv: "P-256",
          d: "invalid-key",
        },
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockKeys));
      mockCrypto.subtle.importKey.mockRejectedValue(new Error("Import failed"));

      const result = await getDevicePrivateKey();

      expect(result).toBeNull();
    });
  });

  describe("getCurrentDevice", () => {
    it("should return stored device", () => {
      const mockDevice = {
        id: "test-device-id",
        name: "Test Device",
        pubKeyJwk: {},
        lastSeen: Date.now(),
        isOnline: true,
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockDevice));

      const result = getCurrentDevice();

      expect(result).toEqual(mockDevice);
    });

    it("should return null if no device stored", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = getCurrentDevice();

      expect(result).toBeNull();
    });

    it("should handle parse errors gracefully", () => {
      mockLocalStorage.getItem.mockReturnValue("invalid-json");

      const result = getCurrentDevice();

      expect(result).toBeNull();
    });
  });

  describe("updateDeviceInfo", () => {
    it("should update device information", () => {
      const currentDevice = {
        id: "test-device-id",
        name: "Old Name",
        pubKeyJwk: {},
        lastSeen: 123456,
        isOnline: false,
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(currentDevice));

      updateDeviceInfo({
        name: "New Name",
        isOnline: true,
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "fuselink-device-info",
        JSON.stringify({
          id: "test-device-id",
          name: "New Name",
          pubKeyJwk: {},
          lastSeen: 123456,
          isOnline: true,
        }),
      );
    });

    it("should throw error if no device initialized", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      expect(() => updateDeviceInfo({ name: "New Name" })).toThrow(
        "No device initialized",
      );
    });
  });

  describe("clearDeviceData", () => {
    it("should remove all device data from storage", () => {
      clearDeviceData();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        "fuselink-device-keys",
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        "fuselink-device-info",
      );
    });
  });
});
