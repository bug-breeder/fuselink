# Repository Skeleton — P2P Folder & File Sync

```
/app
  /src
    /components
    /state        # Zustand stores
    /rtc          # Peer, signaling client, transfer protocol
    /fs           # directory picker, walkers, OPFS
    /crypto       # ecdh, hkdf, aes-gcm
    /push         # registration, utilities
    /pages
    sw.ts
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
