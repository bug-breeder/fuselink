# FuseLink - P2P File Sync

A Next.js + Supabase implementation of the FuseLink peer-to-peer file synchronization application.

## Features

✅ **Completed:**
- Next.js 15 project structure with TypeScript
- Supabase integration for backend services
- shadcn/ui component library with Tailwind CSS
- Responsive dashboard with device and folder management
- Device pairing modal with QR code and magic link
- Folder management with sync status
- Theme provider with dark/light mode support
- Toast notifications system

## Technology Stack

- **Frontend:** Next.js 15 + TypeScript + React 18
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **UI:** shadcn/ui + Radix UI + Tailwind CSS
- **Styling:** Tailwind CSS with CSS custom properties

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Supabase:**
   - Update `.env` with your Supabase URL and anon key:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Features Overview

### Dashboard
- **Synced Folders:** View and manage folders with sync status and progress
- **Paired Devices:** Manage connected devices with status indicators
- **Responsive Design:** Works on desktop and mobile devices

### Device Pairing
- **QR Code:** Quick camera-based pairing
- **Magic Link:** Shareable link for devices without cameras
- **Safety Words:** Verification to prevent man-in-the-middle attacks

### Theme Support
- **Light/Dark Mode:** Automatic system theme detection
- **Custom Colors:** Purple primary color scheme (Purpureus)
- **Typography:** Inter for body text, Space Grotesk for headlines

## Next Steps for P2P Implementation

To complete the FuseLink vision, implement:

1. **libp2p Integration:**
   - WebRTC peer connections
   - STUN/TURN server configuration
   - Circuit relay for NAT traversal

2. **Cryptography:**
   - ECDH key exchange for device pairing
   - AES-GCM file encryption
   - BLAKE3 hashing for integrity

3. **File System APIs:**
   - File System Access API for Chromium browsers
   - Origin Private File System (OPFS) for metadata
   - File chunking and resume logic

4. **Sync Engine:**
   - Web Worker for background processing
   - Conflict resolution algorithms
   - Progressive sync with priority queues

5. **Database Schema:**
   - Supabase tables for devices, folders, and sync sessions
   - Real-time subscriptions for live updates

## Design System

The app follows the product specifications with:
- **Primary Color:** Purpureus (`hsl(262 80% 58%)`)
- **Typography:** Inter + Space Grotesk
- **Component Library:** shadcn/ui for consistent styling
- **Responsive Design:** Mobile-first approach

This implementation provides a solid foundation for building the complete P2P file synchronization system described in the project documentation.
