# Architecture

## Components
- **React PWA** - UI, file picking, scanning, transfers
- **Service Worker** - Push notifications, offline support
- **Supabase Backend** - Device registry, auth, push notifications
- **libp2p** - P2P networking with WebRTC transport (eliminates signaling complexity)

## libp2p P2P Flow
1. **Device Discovery**: QR codes contain libp2p multiaddrs for direct dialing
2. **Circuit Relay**: Use Supabase or public relays for initial connection
3. **DCUtR**: Hole punching for direct browser-to-browser connections
4. **WebRTC Transport**: Automatic NAT traversal with built-in STUN/TURN

## Supabase Integration (Simplified)
- **Database**: Device registry, trusted peers, push subscriptions
- **Auth**: JWT-based device authentication
- **Push**: Sync request notifications only

## libp2p Configuration
```javascript
const node = await createLibp2p({
  addresses: {
    listen: ['/webrtc', '/p2p-circuit']
  },
  transports: [
    webRTC({
      rtcConfiguration: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject' }
        ]
      }
    }),
    circuitRelayTransport()
  ],
  streamMuxers: [yamux()],
  connectionEncrypters: [noise()]
})
```

## Security Model
- **Identity**: ECDH keypairs per device (P-256)
- **Session**: ECDH → HKDF → AES-GCM per WebRTC session
- **Files**: Per-file keys, chunked encryption
- **Server**: Zero-knowledge (only signaling metadata, no file data)
- **Channels**: Ephemeral signaling rooms, auto-cleanup after pairing

## Data Flow
1. Device A generates libp2p identity, creates QR with peer multiaddr
2. Device B scans QR, dials Device A directly via libp2p
3. libp2p handles connection establishment (relay → hole punch → direct)
4. Encrypted streams established for file transfer protocol
5. All transfers are end-to-end encrypted via libp2p + application layer crypto

## Storage
- **Frontend**: File System Access API (Chromium) or OPFS fallback
- **Supabase**: Device registry, pairing metadata, push endpoints
- **P2P**: Direct encrypted transfer, no intermediate storage