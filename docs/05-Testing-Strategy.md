# Testing Strategy — P2P Folder & File Sync

## Unit
- Crypto: ECDH keypairs, device ID derivation, fingerprint generation, safety words
- WebRTC: SignalingClient, PeerManager, connection management, health monitoring
- Core: Hashing, encryption/decryption, chunk assembler, diff rules, glob filters

## Integration  
- WebRTC: Complete signaling handshake, DataChannel establishment, reconnection
- Backend: Go HTTP handlers, WebSocket hub, message routing, device registration
- E2E: Real WebSocket connections, health endpoints, ICE server configuration

## End‑to‑End (Playwright)
- QR pairing flow (mock camera or provide QR image).
- Push‑to‑sync flow (mock push event in SW).
- Multi‑GB transfers (local file mocks with throttled networks).

## Network Chaos
- Toggle offline/online mid‑transfer, bandwidth throttle, artificial packet loss for DataChannels.

## Cross‑Browser Matrix
- Chromium (primary path: Directory Picker + OPFS + Push).
- Firefox/Safari (OPFS + import/export, push caveats).
