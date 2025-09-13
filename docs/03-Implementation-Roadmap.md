# Implementation Roadmap

## Phase 1: Foundation
- [ ] Vite + React + TypeScript setup
- [ ] Origin UI components integration
- [ ] Basic routing and state management
- [ ] Supabase project setup (Realtime + Database + Auth)

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