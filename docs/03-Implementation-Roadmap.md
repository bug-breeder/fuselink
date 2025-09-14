# Implementation Roadmap

## Phase 1: Foundation ✅
- [x] Vite + React + TypeScript setup
- [x] Origin UI components integration (44 components copied)
- [x] Basic routing and state management with Zustand
- [x] libp2p WebRTC node setup and initialization
- [x] Supabase client configuration (ready for project setup)

## Phase 2: Device Pairing
- [ ] Web Crypto ECDH keypair generation
- [ ] QR code generation and scanning
- [ ] Device fingerprint verification
- [ ] Trusted device persistence

## Phase 3: WebRTC Connection
- [ ] Supabase Realtime channel signaling
- [ ] WebRTC peer connection with Google STUN servers
- [ ] ICE candidate exchange via Supabase Broadcast
- [ ] DataChannel establishment + TURN fallback

## Phase 4: File Transfer
- [ ] File chunking and encryption
- [ ] Transfer progress tracking
- [ ] Resume/retry functionality
- [ ] Integrity verification

## Phase 5: Polish
- [ ] Push notification setup
- [ ] Folder mapping interface
- [ ] Error handling and UX improvements
- [ ] Cross-browser testing

## Success Criteria
- Two devices can pair via QR code
- Files transfer directly between devices
- All data is end-to-end encrypted
- Works across different networks (TURN fallback)