# Fuselink - P2P Folder & File Sync

## Project Overview

Fuselink is a peer-to-peer file synchronization application designed for private, fast multi-device sync with end-to-end encryption. It uses WebRTC DataChannels for direct device-to-device transfers with a minimal server footprint.

## Architecture

- **Frontend**: React + TypeScript PWA with HeroUI components
- **State Management**: Zustand + TanStack React Query
- **Backend**: Go with sqlc for database operations
- **P2P**: WebRTC DataChannels with TURN fallback
- **Security**: End-to-end encryption, zero-knowledge server

## Technology Stack

- **App**: Vite + React + TypeScript + HeroUI + Service Worker
- **Testing**: Vitest + Playwright
- **Code Quality**: ESLint + Prettier + Husky
- **Server**: Go + sqlc + WebSocket signaling + Web Push
- **Infrastructure**: coturn for TURN/STUN

## Repository Structure

```
/app
  /src
    /components    # React components
    /state        # Zustand stores
    /rtc          # Peer, signaling client, transfer protocol
    /fs           # directory picker, walkers, OPFS
    /crypto       # ecdh, hkdf, aes-gcm
    /push         # registration, utilities
    /pages        # App pages/routes
    sw.ts         # Service Worker
  vite.config.ts
  manifest.webmanifest

/server
  /internal
    /db          # sqlc generated
    /http        # handlers: devices, push, turn-cred
    /signal      # WS hub (rooms)
  /db
    schema.sql
    queries.sql
  sqlc.yaml
  main.go

/infra
  docker-compose.turn.yml
  k8s/...
```

## Development Commands

**IMPORTANT: Use yarn as the package manager for this project**

### Frontend (app/)
```bash
cd app
yarn install        # Install dependencies
yarn dev            # Start development server
yarn build          # Build for production
yarn preview        # Preview production build
yarn lint           # Run ESLint
yarn typecheck      # Run TypeScript checks
yarn test           # Run Vitest tests
yarn test:e2e       # Run Playwright E2E tests
```

### Backend (server/)
**Use Makefile for backend development commands**
```bash
cd server
make deps            # Install Go dependencies (go mod tidy)
make dev             # Start development server
make build           # Build binary
make test            # Run tests
make sqlc            # Generate sqlc code
make help            # Show available commands
```

## Current Implementation Status

### Milestone M0 - Project Foundation ✅
- [x] Vite + React + TS + HeroUI setup
- [x] ESLint/Prettier/Husky configuration
- [x] Vitest/Playwright testing setup
- [x] Service Worker scaffold
- [x] PWA manifest and installability
- [x] Zustand + React Query integration
- [x] Error boundary and toast notifications
- [x] Server directory structure

### Milestone M1 - Device Identity & Pairing (QR) ✅
- [x] Web Crypto ECDH keypair generation (P-256 curve)
- [x] Device identity derivation from public keys
- [x] QR generation and scanning with BarcodeDetector API
- [x] Safety-words fingerprint verification (BIP-39 subset)
- [x] QR scanner with fallback library support
- [x] Device management with localStorage persistence
- [x] Comprehensive test coverage (68/68 tests passing)
- [x] Enhanced ICE servers with multiple Google STUN endpoints

### Upcoming Milestones
- M2: Signaling & WebRTC Setup
- M3: Single-File Transfer (Resumable + E2EE)
- M4: Folder Mapping & Index/Diff
- M5: Push-to-Sync
- M6: Reliability & UX Polish

## Key Features (Planned)

1. **QR Code Pairing** with device fingerprint verification
2. **Direct P2P transfers** via WebRTC with TURN fallback
3. **End-to-end encryption** for all data and metadata
4. **Push notifications** to trigger sync requests
5. **Folder mapping** with include/exclude patterns
6. **Resumable transfers** with chunk-based integrity verification
7. **Progressive Web App** with offline support

## Security Model

- Zero-knowledge server (no file contents on server)
- Per-device ECDH keypairs for identity
- Per-session key exchange (ECDH → HKDF → AES-GCM)
- Per-file and per-chunk encryption
- Device fingerprint verification via safety words

## Documentation

Comprehensive project documentation is available in the `/docs` folder:
- `00-README.md` - Project overview and file index
- `01-Product-Specs.md` - Detailed product specifications and features
- `02-Architecture.md` - System architecture and component design
- `03-Implementation-Roadmap.md` - Development milestones and acceptance criteria
- `04-Data-Contracts.md` - API and data structure specifications
- `05-Testing-Strategy.md` - Testing approach and methodology
- `06-Repository-Skeleton.md` - Project structure reference
- `07-Risk-Register.md` - Identified risks and mitigation strategies

## Testing Guidelines

**IMPORTANT: Always write tests alongside implementation - never commit code without tests**

### Testing Strategy
1. **Unit Tests**: Test individual functions and utilities (Vitest)
2. **Integration Tests**: Test component interactions and API endpoints
3. **E2E Tests**: Test complete user workflows (Playwright)
4. **Test Coverage**: Aim for >80% coverage on critical paths

### Testing Requirements
- **Crypto functions**: Must have comprehensive unit tests for security
- **UI Components**: Test user interactions and error states
- **API Endpoints**: Test all request/response scenarios
- **Error Handling**: Test failure modes and edge cases
- **Browser Compatibility**: Test across different browsers for WebRTC/crypto

### Test Organization
```
src/
  crypto/
    keys.test.ts
    device.test.ts
    qr.test.ts
    scanner.test.ts
    fingerprint.test.ts
  components/
    pairing/
      qr-display.test.tsx
      qr-scanner.test.tsx
  pages/
    pairing.test.tsx
```

### Test Commands
```bash
yarn test           # Run all unit tests
yarn test:watch     # Run tests in watch mode
yarn test:ui        # Run tests with UI
yarn test:coverage  # Run tests with coverage report
yarn test:e2e       # Run E2E tests
```

## Development Notes

- PWA requires HTTPS for many features (File System Access, Web Push)
- Service Worker handles push notifications and offline functionality
- File System Access API limited to Chromium browsers (OPFS fallback)
- WebRTC requires STUN/TURN for NAT traversal
- BLE pairing is optional enhancement (Chromium only)
- **Package Manager**: Always use `yarn` for consistency across the project
- **Backend**: Use `Makefile` commands for all backend development tasks
- **Testing**: Write comprehensive tests for every feature before committing code
- **Git Identity**: Configured as `Anh Nguyen <anhngw@gmail.com>`