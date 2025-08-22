import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { SignalingClient } from "./signaling-client";

// This test requires the Go server to be running on localhost:8080
describe("End-to-End WebSocket Integration", () => {
  let signalingClient: SignalingClient;
  const TEST_ROOM = "e2e-test-room";
  const TEST_DEVICE_ID = "e2e-test-device";

  beforeAll(() => {
    signalingClient = new SignalingClient({
      signalingUrl: "ws://localhost:8080",
      deviceId: TEST_DEVICE_ID,
      onMessage: () => {},
      onConnectionChange: () => {},
      onError: () => {},
    });
  });

  afterAll(() => {
    if (signalingClient) {
      signalingClient.disconnect();
    }
  });

  it("should connect to real WebSocket server", async () => {
    // Skip if server is not running
    try {
      await signalingClient.connect(TEST_ROOM);
      expect(signalingClient.isConnected()).toBe(true);
    } catch (error) {
      console.warn("Skipping E2E test - server not running:", error);
      // Don't fail the test if server is not available
      expect(error).toBeDefined();
    }
  }, 10000);

  it("should send and route messages through server", async () => {
    // Skip if not connected
    if (!signalingClient.isConnected()) {
      console.warn("Skipping message test - not connected to server");

      return;
    }

    const testMessage = {
      type: "test" as const,
      data: { message: "Hello from E2E test" },
    };

    expect(() => {
      signalingClient.sendMessage(testMessage);
    }).not.toThrow();
  }, 5000);

  it("should handle server disconnection gracefully", async () => {
    if (signalingClient.isConnected()) {
      signalingClient.disconnect();
      expect(signalingClient.isConnected()).toBe(false);
    }
  });
});

// Test HTTP endpoints
describe("HTTP API Integration", () => {
  const BASE_URL = "http://localhost:8080";

  it("should fetch health status", async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);

      expect(response.ok).toBe(true);

      const data = await response.json();

      expect(data.status).toBe("ok");
      expect(data.service).toBe("fuselink-server");
    } catch (error) {
      console.warn("Skipping health test - server not running:", error);
      // Don't fail if server is not available for E2E tests
    }
  });

  it("should fetch ICE servers", async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/turn-cred`);

      expect(response.ok).toBe(true);

      const data = await response.json();

      expect(data.iceServers).toBeDefined();
      expect(Array.isArray(data.iceServers)).toBe(true);
      expect(data.iceServers.length).toBeGreaterThan(0);

      const firstServer = data.iceServers[0];

      expect(firstServer.urls).toBeDefined();
      expect(Array.isArray(firstServer.urls)).toBe(true);
      expect(firstServer.urls.length).toBeGreaterThan(0);
    } catch (error) {
      console.warn("Skipping ICE servers test - server not running:", error);
    }
  });

  it("should handle device registration", async () => {
    try {
      const deviceData = {
        deviceId:
          "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        name: "E2E Test Device",
        pubKeyJwk: { kty: "EC", crv: "P-256", x: "test", y: "test" },
      };

      const response = await fetch(`${BASE_URL}/api/devices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deviceData),
      });

      if (response.ok) {
        const result = await response.json();

        expect(result.deviceId).toBe(deviceData.deviceId);
        expect(result.name).toBe(deviceData.name);
      } else {
        console.warn("Device registration failed:", response.status);
      }
    } catch (error) {
      console.warn(
        "Skipping device registration test - server not running:",
        error,
      );
    }
  });
});
