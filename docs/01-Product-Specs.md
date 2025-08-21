# Product Specs — P2P Folder & File Sync

**Stack**: React + TypeScript (PWA), HeroUI (UI), Zustand (state), TanStack React Query (data), Service Worker (push/offline), WebRTC (data channels), optional Web Bluetooth (pairing), Go backend (signaling + push + device registry) with **sqlc** for DB access. TURN via coturn.

## 1. Overview
A **P2P‑first** app that synchronizes folders/files across devices and lets users **push a notification** to request a sync from a paired device. Default path is **direct WebRTC**, with **TURN** fallback for tough NATs. If devices are on the same Wi‑Fi, ICE will typically negotiate a direct LAN path. Pairing is **QR‑first** (universal) with **BLE pairing** as an optional enhancement where supported.

## 2. Goals
- **Fast, private** multi‑device sync (E2EE by default).
- **Low‑friction pairing** (QR; BLE optional).
- **Push‑to‑sync** nudges to initiate folder scans/transfers.
- Minimal backend: signaling, push, device registry; **no file contents** on server.
- Usable as a **Progressive Web App** with optional thin desktop helper (later).

## 3. Non‑Goals (for MVP)
- Chat/messaging.
- Real‑time collaborative editing/CRDT for files.
- Full mobile background syncing on iOS (PWA limitations). We support on‑demand sync and push‑to‑open.

## 4. Target Users & Scenarios
- **Individual power users**: move photo folders between laptop and phone; keep “Work” and “Home” laptops in sync over LAN.
- **Small teams**: ad‑hoc share of large files with E2EE, no cloud copy.
- **Developers**: transfer build artifacts across machines without upload/download steps.

## 5. Key Features
### MVP
- Pairing (QR) with device fingerprint verification.
- Device list and trust management.
- Folder mapping (Chromium’s `showDirectoryPicker` where available) + include/exclude globs.
- Index/scan: `{ path, size, mtime, contentHash? }`.
- Diff & transfer engine: chunked, resumable, integrity‑checked.
- Push‑to‑sync: request a remote device to rescan + sync.
- E2EE: per‑session keys (ECDH→HKDF→AES‑GCM), per‑file keys, per‑chunk nonces.
- TURN fallback; progress UI with pause/resume; error recovery.

### v1 Enhancements
- Optional **BLE pairing** (Chromium platforms).
- Optional desktop helper for robust folder watching on macOS/Windows/Linux.
- Bandwidth/CPU caps; schedule windows.
- Conflict resolution modes (newer‑wins, rename, manual review).
- Bring‑your‑own storage (client‑encrypted cloud pinning) — optional.

## 6. UX Flows
- **Onboard** → create device key → name device → pair via QR → choose folders → first sync.
- **Push‑to‑sync** → choose device → server sends Web Push → SW shows notification → user taps → app scans & syncs.
- **Add folder** → pick handle → set rules (include/exclude/time windows).
- **Transfers** → live progress; show per‑file chunk graph; retry/resume.

## 7. Privacy & Security Requirements
- **Zero‑knowledge** server: plaintext file contents never leave devices.
- **E2EE by default** for metadata (where feasible) and data paths.
- Device fingerprint verification at pairing (safety words).
- Exportable encrypted device backup (keys), opt‑in.
- Minimal analytics (opt‑in, no content/paths).

## 8. Accessibility & Internationalization
- WCAG 2.1 AA for PWA UI (focus order, color contrast, keyboard nav).
- Localizable strings; date/time & number formatting via Intl APIs.

## 9. Success Metrics
- Direct‑path rate (%) vs TURN.
- Median/95p end‑to‑end transfer throughput (MiB/s).
- Time to first byte after push‑to‑sync tap.
- Sync correctness: zero false positives/negatives in diffs across runs.
- Crash‑free sessions %, error‑free transfers %.
