# Architecture

## Components
- **React PWA**: The primary user interface. Manages:
  - UI state and component rendering.
  - User interactions (folder selection, device pairing).
  - File system interactions (OPFS, File System Access API).
  - Scanning and generation of QR codes.
- **Sync Engine (Web Worker)**: Runs in a separate thread to handle:
  - File indexing and BLAKE3 hashing.
  - P2P connection management via libp2p.
  - Chunking, encryption, and transfer logic.
  - Conflict detection and resolution.
- **Service Worker**:
  - Manages Web Push notifications for background sync requests.
  - Provides core PWA offline capabilities.
- **Signaling & Push Server**: A lightweight backend responsible for:
  - libp2p signaling (e.g., circuit relay bootstrapping).
  - Managing and dispatching Web Push notifications.
  - Storing folder-device linkage.

## P2P Flow with libp2p
1. **Device Discovery**: Pairing is initiated via QR codes or magic links, which contain the necessary libp2p multiaddrs for direct dialing.
2. **Connection Establishment**:
   - libp2p first attempts a direct connection on the local network.
   - If LAN fails, it uses a public STUN server for hole punching.
   - As a last resort, it connects via a TURN or circuit relay server for NAT traversal.
3. **Optimized Path Selection**: libp2p's connection manager automatically chooses the most performant path based on observed latency, preventing the need for a complex manual or AI-based implementation.
4. **Secure Transport**: All connections are automatically encrypted end-to-end using `noise` protocol encryption provided by libp2p.

## Data & Sync Flow
1. **Folder Indexing**: The user selects a folder. The Sync Engine recursively traverses it, calculating the BLAKE3 hash for each file and storing the metadata (path, hash, size, mtime) in OPFS.
2. **Sync Initiation**: A sync can be triggered manually or via a Web Push notification.
3. **Metadata Exchange**: The two paired devices exchange their file index metadata.
4. **Diff Calculation**: Each client calculates the difference between the local and remote index to create a list of required file operations (uploads, downloads).
5. **File Transfer**:
   - Files are split into encrypted chunks.
   - Chunks are transferred directly between peers. The BLAKE3 hash is used to verify integrity and for potential deduplication.
   - Transfers are resumable if the connection is interrupted.
6. **Conflict Resolution**: If a file has been modified on both ends since the last sync, the conflict is resolved by keeping the file with the newer modification date. The other file is preserved as a conflicted copy (e.g., `filename.conflicted.txt`) to prevent data loss. The user is notified and can choose to manage these files manually.

## Security Model
- **Identity**: ECDH keypairs (P-256) are generated on-device and serve as the unique device identity.
- **Pairing**: Verification with "safety words" (a hash of public keys) protects against MITM attacks.
- **Transport Encryption**: libp2p's `noise` protocol provides mandatory, authenticated, end-to-end encrypted channels.
- **File Encryption**: In addition to transport security, files are chunked and encrypted with AES-GCM using a key derived from the shared secret, ensuring zero-knowledge on any relay servers.

## Storage
- **Origin Private File System (OPFS)**: Used as the primary storage for file index metadata due to its performance and worker accessibility.
- **File System Access API**: Used in Chromium-based browsers for direct, permission-based access to the user's local file system. A manual import/export model is the fallback for other browsers.