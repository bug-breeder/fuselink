# Product Specs

## Overview
P2P file sync app with QR pairing, WebRTC transfers, and E2E encryption.

## Key Features
- **QR Code Pairing** - Scan to connect devices securely
- **Direct P2P Transfers** - WebRTC with TURN fallback
- **End-to-End Encryption** - All data encrypted
- **Push Notifications** - Request sync from other devices
- **Progressive Web App** - Installable, works offline

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Origin UI + Tailwind
- **Backend**: Supabase (Realtime + Database + Auth)
- **P2P**: WebRTC DataChannels + Google STUN + Free TURN fallback
- **Security**: Web Crypto API (ECDH + AES-GCM)

## Target Users
- Individuals syncing files between devices
- Teams sharing large files securely
- Developers transferring build artifacts

## Security Requirements
- Zero-knowledge server (no file contents stored)
- Device fingerprint verification at pairing
- Per-session and per-file encryption keys