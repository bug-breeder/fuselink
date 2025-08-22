// Device identity management and initialization

import type { Device } from "../state/types";

import { generateDeviceKeyPair } from "./keys";

const DEVICE_KEYS_STORAGE_KEY = "fuselink-device-keys";
const DEVICE_INFO_STORAGE_KEY = "fuselink-device-info";

export interface StoredDeviceKeys {
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
  deviceId: string;
  createdAt: number;
}

/**
 * Initialize device identity on first run or load existing keys
 */
export async function initializeDevice(deviceName?: string): Promise<Device> {
  try {
    // Try to load existing device keys
    const existingKeys = loadDeviceKeys();

    if (existingKeys) {
      // Device already exists, load stored info
      const deviceInfo = loadDeviceInfo();

      return {
        id: existingKeys.deviceId,
        name: deviceInfo?.name || "My Device",
        pubKeyJwk: existingKeys.publicKeyJwk,
        lastSeen: Date.now(),
        isOnline: true,
      };
    }

    // First run - generate new device identity
    console.log("First run detected, generating new device identity...");

    const keyPair = await generateDeviceKeyPair();

    // Export private key for storage (we need it for ECDH operations)
    const privateKeyJwk = await crypto.subtle.exportKey(
      "jwk",
      keyPair.privateKey,
    );

    // Store keys securely
    const deviceKeys: StoredDeviceKeys = {
      publicKeyJwk: keyPair.publicKeyJwk,
      privateKeyJwk,
      deviceId: keyPair.deviceId,
      createdAt: Date.now(),
    };

    storeDeviceKeys(deviceKeys);

    // Store device info
    const device: Device = {
      id: keyPair.deviceId,
      name: deviceName || getDefaultDeviceName(),
      pubKeyJwk: keyPair.publicKeyJwk,
      lastSeen: Date.now(),
      isOnline: true,
    };

    storeDeviceInfo(device);

    console.log("Device identity created:", device.id);

    return device;
  } catch (error) {
    throw new Error(
      `Failed to initialize device: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get the current device's private key for cryptographic operations
 */
export async function getDevicePrivateKey(): Promise<CryptoKey | null> {
  try {
    const keys = loadDeviceKeys();

    if (!keys?.privateKeyJwk) {
      return null;
    }

    // Import the private key
    return await crypto.subtle.importKey(
      "jwk",
      keys.privateKeyJwk,
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      false,
      ["deriveKey", "deriveBits"],
    );
  } catch (error) {
    console.error("Failed to get device private key:", error);

    return null;
  }
}

/**
 * Get current device information
 */
export function getCurrentDevice(): Device | null {
  return loadDeviceInfo();
}

/**
 * Update device information
 */
export function updateDeviceInfo(
  updates: Partial<Omit<Device, "id" | "pubKeyJwk">>,
): void {
  const current = loadDeviceInfo();

  if (!current) {
    throw new Error("No device initialized");
  }

  const updated = { ...current, ...updates };

  storeDeviceInfo(updated);
}

/**
 * Clear all device data (for testing or reset)
 */
export function clearDeviceData(): void {
  localStorage.removeItem(DEVICE_KEYS_STORAGE_KEY);
  localStorage.removeItem(DEVICE_INFO_STORAGE_KEY);
}

/**
 * Generate a default device name based on browser/platform
 */
function getDefaultDeviceName(): string {
  const platform = navigator.platform || "Unknown";
  const browser = getBrowserName();

  return `${platform} (${browser})`;
}

/**
 * Simple browser detection for device naming
 */
function getBrowserName(): string {
  const userAgent = navigator.userAgent;

  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";

  return "Browser";
}

/**
 * Load device keys from localStorage
 */
function loadDeviceKeys(): StoredDeviceKeys | null {
  try {
    const stored = localStorage.getItem(DEVICE_KEYS_STORAGE_KEY);

    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Failed to load device keys:", error);

    return null;
  }
}

/**
 * Store device keys to localStorage
 */
function storeDeviceKeys(keys: StoredDeviceKeys): void {
  try {
    localStorage.setItem(DEVICE_KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch (error) {
    throw new Error(
      `Failed to store device keys: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Load device info from localStorage
 */
function loadDeviceInfo(): Device | null {
  try {
    const stored = localStorage.getItem(DEVICE_INFO_STORAGE_KEY);

    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Failed to load device info:", error);

    return null;
  }
}

/**
 * Store device info to localStorage
 */
function storeDeviceInfo(device: Device): void {
  try {
    localStorage.setItem(DEVICE_INFO_STORAGE_KEY, JSON.stringify(device));
  } catch (error) {
    throw new Error(
      `Failed to store device info: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
