# Testing Strategy — P2P Folder & File Sync

## Unit
- Hashing, encryption/decryption, chunk assembler, diff rules, glob filters.

## Integration
- Signaling handshake, ICE paths (mock STUN/TURN), resume scenarios, push subscription lifecycle.

## End‑to‑End (Playwright)
- QR pairing flow (mock camera or provide QR image).
- Push‑to‑sync flow (mock push event in SW).
- Multi‑GB transfers (local file mocks with throttled networks).

## Network Chaos
- Toggle offline/online mid‑transfer, bandwidth throttle, artificial packet loss for DataChannels.

## Cross‑Browser Matrix
- Chromium (primary path: Directory Picker + OPFS + Push).
- Firefox/Safari (OPFS + import/export, push caveats).
