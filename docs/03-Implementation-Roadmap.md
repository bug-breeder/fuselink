# Implementation Roadmap — P2P Folder & File Sync

> Milestones are acceptance‑criteria driven.

## M0 — Project Foundation
**Deliverables**
- Vite + React + TS + HeroUI; ESLint/Prettier/Husky; Vitest/Playwright.
- Service Worker scaffold; app installability (manifest, icons).
- Zustand + React Query setup; error boundary; toasts.

**Acceptance**
- PWA installs and works offline for shell routes.
- CI runs lint + tests on PR.

## M1 — Device Identity & Pairing (QR)
**Deliverables**
- Web Crypto ECDH keypair on first run; deviceId derivation.
- Device registration API in Go + sqlc.
- QR generation (public info + signaling/ICE).
- QR scanner (BarcodeDetector + fallback lib) and pairing flow.
- Safety‑words fingerprint verification.

**Acceptance**
- Two devices pair via QR, verify fingerprints, and persist trusted devices.

## M2 — Signaling & WebRTC Setup
**Deliverables**
- Go WebSocket signaling hub with rooms; health endpoints.
- Client SDP/ICE exchange; reconnection; short‑lived TURN creds endpoint.
- DataChannels: `control`, `file`.

**Acceptance**
- Devices establish a DataChannel across different networks; logs show direct vs relay path.

## M3 — Single‑File Transfer (Resumable + E2EE)
**Deliverables**
- Chunking (1–4 MiB), backpressure handling, resume by chunk bitmap.
- AES‑GCM encryption per chunk; manifest (name, size, chunk MACs).
- Progress UI; pause/cancel; error retries.
- TURN fallback validated (coturn deployed).

**Acceptance**
- Transfer 2–4 GB reliably over direct and TURN; pause/resume works; integrity verified.

## M4 — Folder Mapping & Index/Diff
**Deliverables**
- Chromium: `showDirectoryPicker` + permission persistence.
- Cross‑browser: OPFS cache with manual import/export.
- Index builder & store (IndexedDB/OPFS); include/exclude globs.
- Diff algorithm (new/changed/removed); conflict policy.

**Acceptance**
- User maps a folder, sees deterministic diff vs a paired device; small files hashed, large files chunk‑hashed on demand.

## M5 — Push‑to‑Sync
**Deliverables**
- Web Push subscription & storage (VAPID keys server‑side).
- `POST /push/sync` endpoint; SW notification with action.
- Foreground handler triggers rescan and transfers.

**Acceptance**
- From Device A, “Request sync” triggers a push on Device B; tapping “Sync now” starts diff+transfer.

## M6 — Reliability & UX Polish
**Deliverables**
- ICE timeouts, retry policies; exponential backoff on signaling reconnect.
- Transfer queue (parallelism cap); per‑file & overall ETA; better errors.
- Conflict UI; propagate‑deletes option; bandwidth cap.

**Acceptance**
- Long multi‑file syncs (>10 GB) complete with actionable feedback and recover from transient failures.

## M7 — Optional BLE Pairing & Desktop Helper (Stretch)
**Deliverables**
- BLE pairing path (Chromium): GATT read of bootstrap token; feature‑flagged.
- Desktop helper (Go/Tauri) for folder watching + local API; mDNS discovery.

**Acceptance**
- BLE flow works on supported platforms; desktop helper detects changes faster than PWA‑only scanning.

## M8 — Security Hardening
**Deliverables**
- Encrypted export/import of device keys; passphrase strength checks.
- CSP, COOP/COEP, Permissions‑Policy; dependency audit; threat model doc.
- DoS/rate‑limit on signaling & push; TURN credential rotation jobs.

**Acceptance**
- Security checklist passes; independent review signs off; no high‑severity issues outstanding.

## M9 — Beta & Deployment
**Deliverables**
- HTTPS, domain, TLS, CDN for static app.
- coturn in multiple regions; observability dashboards; alerts.
- Documentation: platform caveats, iOS PWA install for push, privacy policy.

**Acceptance**
- Public beta live; KPIs wired (direct‑path rate, throughput, error rates); crash‑free sessions above target.
