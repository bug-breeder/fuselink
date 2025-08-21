# Fuselink Server

Go backend for the Fuselink P2P file sync application.

## Features

- WebSocket signaling for WebRTC peer connections
- Device registration and pairing management
- Web Push notifications for sync requests
- TURN server credential generation
- PostgreSQL database with sqlc-generated queries
- Graceful shutdown and CORS support

## Quick Start

1. **Install dependencies:**
   ```bash
   make deps
   ```

2. **Set up database:**
   ```bash
   make db-setup
   ```

3. **Generate database code:**
   ```bash
   make sqlc
   ```

4. **Start development server:**
   ```bash
   make dev
   ```

## Development

### Database

The server uses PostgreSQL with migrations and sqlc for type-safe queries.

- **Create migration:** `make migrate-create NAME=migration_name`
- **Run migrations:** `make migrate-up`
- **Reset database:** `make db-reset`
- **Generate queries:** `make sqlc`

### TURN Server

For WebRTC NAT traversal, start the coturn TURN server:

```bash
make turn-start
```

### Testing

```bash
make test                # Run tests
make test-coverage       # Run tests with coverage
```

### Code Quality

```bash
make lint               # Run linter
make fmt                # Format code
make vet                # Run go vet
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/devices` - Register device
- `GET /api/devices` - List devices
- `POST /api/push/subscribe` - Subscribe to push notifications
- `POST /api/push/sync` - Send sync push notification
- `GET /api/turn-cred` - Get TURN server credentials
- `WS /ws/signaling/:roomId` - WebSocket signaling

## Environment Variables

- `PORT` - Server port (default: 8080)
- `DATABASE_URL` - PostgreSQL connection string
- `VAPID_PUBLIC_KEY` - VAPID public key for push notifications
- `VAPID_PRIVATE_KEY` - VAPID private key for push notifications
- `ENV` - Environment (development/production)

## Production Deployment

1. **Build binary:**
   ```bash
   make build
   ```

2. **Docker build:**
   ```bash
   make docker-build
   ```

3. **Deploy with proper environment variables and database setup**

## Architecture

- `main.go` - Server entry point
- `internal/http/handlers/` - HTTP request handlers
- `internal/signal/` - WebSocket signaling hub
- `internal/db/` - Generated database queries (sqlc)
- `db/` - Database schema and migrations
- `infra/` - Infrastructure configuration (coturn, etc.)