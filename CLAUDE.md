# Fuselink - P2P File Sync

Peer-to-peer file synchronization with WebRTC and end-to-end encryption.

## Status
- ✅ Device pairing with QR codes and persistent identities
- ✅ Origin UI components with Tailwind v4
- ✅ 63 tests passing
- 🔄 WebRTC connections (in progress)

## Tech Stack
- React + TypeScript + Vite + Origin UI + Zustand
- Web Crypto API + libp2p + Vitest

## Commands
```bash
cd app && yarn dev     # Development server
cd app && yarn test    # Run tests
cd app && yarn build   # Production build
```

## Guidelines
- Use yarn, Origin UI, libp2p, feature branches
- Write tests alongside implementation
- HTTPS required for Web Crypto API