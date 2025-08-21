# Data Contracts — P2P Folder & File Sync

## 1. QR Payload
```json
{
  "v": 1,
  "deviceId": "sha256(pubKeyJwk)",
  "name": "Alice-Laptop",
  "pubKeyJwk": { "kty":"EC","crv":"P-256","x":"...","y":"..." },
  "signalingURL": "wss://signal.example.com/ws",
  "iceServers": [
    { "urls": ["stun:stun1.example.com:3478"] },
    { "urls": ["turn:turn1.example.com:3478?transport=udp","turns:turn1.example.com:443?transport=tcp"], "username": "u", "credential": "c", "ttl": 600 }
  ]
}
```

## 2. Push Payload (Sync Request)
```json
{
  "type": "SYNC_REQUEST",
  "from": "deviceId-A",
  "folderId": "photos-1",
  "ts": 1734567890123
}
```

## 3. Control Channel Messages
```json
{ "t": "HELLO", "deviceId":"...", "fingerprint":"..." }
{ "t": "DIFF_REQUEST", "folderId":"photos-1" }
{ "t": "DIFF_RESPONSE", "add":[{"p":"a/b.jpg","s":1234,"m":169...}], "chg":[...], "del":[...] }
{ "t": "FILE_META", "p":"a/b.jpg","size":1234,"chunks":12,"hash":"..." }
{ "t": "FILE_CHUNK_ACK", "p":"a/b.jpg","i":7 }
{ "t": "RESUME", "p":"a/b.jpg","missing":[0,3,9] }
{ "t": "DONE", "folderId":"photos-1" }
```
