# P2P Folder & File Sync — Spec Pack

This bundle contains the product specs, architecture, and implementation roadmap split into separate Markdown files.

## Files
- [01-Product-Specs.md](./01-Product-Specs.md)
- [02-Architecture.md](./02-Architecture.md)
- [03-Implementation-Roadmap.md](./03-Implementation-Roadmap.md)
- [04-Data-Contracts.md](./04-Data-Contracts.md)
- [05-Testing-Strategy.md](./05-Testing-Strategy.md)
- [06-Repository-Skeleton.md](./06-Repository-Skeleton.md)
- [07-Risk-Register.md](./07-Risk-Register.md)

> **Status**: M0✅ M1✅ M2✅ (Signaling + WebRTC complete, 112+ tests passing)
> 
> Stack: React + TypeScript (PWA), HeroUI, Zustand, TanStack React Query, Service Worker (push/offline), WebRTC (DataChannels), optional Web Bluetooth (pairing), Go backend (signaling + push + device registry) with sqlc, Google STUN servers.
