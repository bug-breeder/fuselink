# Product Specs: FuseLink

## Overview

A minimalist, secure, peer-to-peer file synchronization application that enables users to sync files and folders directly between their devices without relying on a central server for file storage.

## Core Features

- **Device Pairing**: Securely pair devices using multiple methods:
  - **QR Code**: Quick and easy camera-based pairing.
  - **Magic Link**: Shareable link for pairing devices without a camera.
  - **Safety Words**: Verify device identity with a memorable fingerprint to prevent man-in-the-middle attacks.

- **Folder Selection and Indexing**:
  - **Directory Picker**: Natively select folders for syncing in Chromium-based browsers.
  - **Manual Import/Export**: Support for other browsers via manual folder handling.
  - **OPFS Metadata**: Recursively index folder contents and store file metadata efficiently in the Origin Private File System.

- **P2P Sync Engine**:
  - **libp2p**: Utilizes a robust P2P networking stack for all communication.
  - **LAN-First**: Prioritizes direct, high-speed connections on the local network.
  - **NAT Traversal**: Employs STUN/TURN servers to establish connections across different networks.

- **Resumable Transfers**:
  - **Chunking**: Splits large files into smaller, manageable chunks for transfer.
  - **Content Hashing**: Uses BLAKE3 (via WASM) for fast data integrity checks and deduplication.
  - **Resumability**: Automatically resumes interrupted transfers.

- **Optimized Path Selection**:
  - Leverages libp2p's connection manager to automatically select the fastest available transfer path (LAN, direct P2P, or TURN relay).

- **Push Sync Request**:
  - **Web Push**: Wakes a paired device to initiate a sync session.
  - **PWA Requirement**: Requires the app to be installed as a PWA on the home screen for background wake-up, especially on iOS.

- **Conflict Handling**:
  - **Latest Version Wins**: By default, if a file has been modified on both devices, the version with the newer modification date is kept.
  - **Backup**: The other version is saved as a conflicted copy (e.g., `filename.conflicted.txt`) so no data is lost.
  - **User Choice**: The user can override this for a single file or for all future conflicts.

## Style Guidelines

- **Primary Color**: Purpureus.
- **Typography**:
  - **Headlines**: 'Space Grotesk' sans-serif for a techy, scientific feel.
  - **Body**: 'Inter' sans-serif for readability.
- **Icons**: Minimalist, geometric icons for file types and sync statuses.
- **Layout**: A clean, intuitive, and minimalist layout with a strong focus on ease of use. Prominently features 'Pair Device' and 'Add Folder' as primary actions.
- **Animations**: Subtle and meaningful animations for file transfer progress and status updates.