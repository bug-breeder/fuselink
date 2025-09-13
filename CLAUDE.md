# Fuselink - P2P File Sync

## Overview
Peer-to-peer file synchronization with WebRTC and end-to-end encryption. Currently in planning phase.

## Tech Stack (Planned)
- **Frontend**: React + TypeScript + Vite + Origin UI + Tailwind
- **Backend**: Supabase (Database + Auth + Push notifications)
- **P2P**: libp2p (handles WebRTC + signaling + NAT traversal automatically)
- **Security**: libp2p Noise protocol + application layer encryption

## Project Structure (To Be Created)
```
/app               # React PWA (not created yet)
/docs              # Project documentation
```

## Quick Commands (When Implemented)
```bash
# Frontend only (Supabase handles backend)
cd app && yarn dev
```

## Development Guidelines
- **Don't reinvent the wheel** - use proven libraries (libp2p, Supabase, Origin UI)
- **Keep it simple** - choose the path with least custom code
- **Update docs as you implement** - but keep them short and concise, avoid over-documentation
- Use **yarn** for frontend package management
- Use **Origin UI** components (copy-paste from originui.com)
- Use **libp2p** instead of manual WebRTC (eliminates 500+ lines of signaling code)
- Write tests alongside implementation
- Use feature branches + PRs (never push to main)
- HTTPS required for Web Crypto API

## Key Features (Planned)
1. QR code device pairing (libp2p multiaddrs)
2. Direct P2P transfers (libp2p WebRTC transport)
3. End-to-end encryption (libp2p Noise + app layer)
4. Push notifications for sync requests (Supabase)
5. Progressive Web App

## Architecture Philosophy
- **Avoid custom implementations** - use battle-tested libraries
- **libp2p eliminates** WebRTC signaling complexity (500+ lines → 50 lines)
- **Supabase eliminates** backend server code
- **Origin UI eliminates** custom component development
- **Focus on business logic** rather than infrastructure

## Documentation Philosophy
- **Update docs alongside code** - don't let them get stale
- **Keep documentation minimal** - short, concise, actionable
- **Avoid over-documentation** - focus on what developers actually need
- **Code should be self-documenting** - clear naming and structure over lengthy comments

## Current Status
📋 **Planning Phase** - Documentation and specifications complete
🔄 **Next**: Start implementing project foundation

See `/docs` for detailed specifications and implementation plan.