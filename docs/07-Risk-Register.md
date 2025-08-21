# Risk Register — P2P Folder & File Sync

- **Browser FS limitations**: Non‑Chromium needs OPFS path; guide users.
- **iOS PWA push constraints**: Require Home‑Screen install; clear UX guidance.
- **TURN costs**: Heavy relay usage can be costly; track direct‑path rate; rate‑limit abuse.
- **BLE fragmentation**: Platform‑dependent; keep behind a feature flag.
- **User expectations**: Background sync on mobile is limited; communicate clearly.
- **Large file integrity**: Ensure per‑chunk MACs and robust resume to avoid corruption.
