-- Fuselink Database Queries

-- name: GetDevice :one
SELECT * FROM devices WHERE device_id = $1;

-- name: CreateDevice :one
INSERT INTO devices (device_id, name, pubkey_jwk)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateDevice :one
UPDATE devices 
SET name = $2, pubkey_jwk = $3, updated_at = NOW()
WHERE device_id = $1
RETURNING *;

-- name: UpdateDeviceLastSeen :exec
UPDATE devices 
SET last_seen = NOW()
WHERE device_id = $1;

-- name: ListDevices :many
SELECT * FROM devices
ORDER BY last_seen DESC NULLS LAST, created_at DESC;

-- name: DeleteDevice :exec
DELETE FROM devices WHERE device_id = $1;

-- Push Subscriptions
-- name: CreatePushSubscription :one
INSERT INTO push_subscriptions (device_id, endpoint, key_p256dh, key_auth)
VALUES ($1, $2, $3, $4)
ON CONFLICT (device_id, endpoint) 
DO UPDATE SET 
    key_p256dh = EXCLUDED.key_p256dh,
    key_auth = EXCLUDED.key_auth,
    updated_at = NOW()
RETURNING *;

-- name: GetPushSubscriptions :many
SELECT * FROM push_subscriptions WHERE device_id = $1;

-- name: DeletePushSubscription :exec
DELETE FROM push_subscriptions 
WHERE device_id = $1 AND endpoint = $2;

-- Device Pairings
-- name: CreatePairing :one
INSERT INTO pairings (device_a_id, device_b_id)
VALUES (
    CASE WHEN $1 < $2 THEN $1 ELSE $2 END,
    CASE WHEN $1 < $2 THEN $2 ELSE $1 END
)
ON CONFLICT (device_a_id, device_b_id) DO NOTHING
RETURNING *;

-- name: GetPairings :many
SELECT p.*, 
       da.name as device_a_name, da.pubkey_jwk as device_a_pubkey,
       db.name as device_b_name, db.pubkey_jwk as device_b_pubkey
FROM pairings p
JOIN devices da ON p.device_a_id = da.device_id
JOIN devices db ON p.device_b_id = db.device_id
WHERE p.device_a_id = $1 OR p.device_b_id = $1;

-- name: DeletePairing :exec
DELETE FROM pairings 
WHERE (device_a_id = $1 AND device_b_id = $2) 
   OR (device_a_id = $2 AND device_b_id = $1);

-- name: VerifyPairing :exec
UPDATE pairings 
SET verified_at = NOW()
WHERE (device_a_id = $1 AND device_b_id = $2) 
   OR (device_a_id = $2 AND device_b_id = $1);

-- TURN Credentials
-- name: CreateTurnCredential :one
INSERT INTO turn_credentials (username, password, device_id, expires_at)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetValidTurnCredentials :many
SELECT * FROM turn_credentials 
WHERE device_id = $1 AND expires_at > NOW()
ORDER BY expires_at DESC;

-- name: CleanupExpiredTurnCredentials :exec
DELETE FROM turn_credentials WHERE expires_at < NOW();

-- Signaling Rooms
-- name: CreateSignalingRoom :one
INSERT INTO signaling_rooms (room_id, device_a_id, device_b_id, expires_at)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetSignalingRoom :one
SELECT * FROM signaling_rooms WHERE room_id = $1 AND expires_at > NOW();

-- name: UpdateSignalingRoomDevice :exec
UPDATE signaling_rooms 
SET device_b_id = $2
WHERE room_id = $1 AND device_b_id IS NULL;

-- name: CleanupExpiredSignalingRooms :exec
DELETE FROM signaling_rooms WHERE expires_at < NOW();

-- Sync Requests
-- name: CreateSyncRequest :one
INSERT INTO sync_requests (from_device_id, to_device_id, folder_id, message, expires_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetSyncRequest :one
SELECT * FROM sync_requests WHERE id = $1;

-- name: GetPendingSyncRequests :many
SELECT sr.*, d.name as from_device_name
FROM sync_requests sr
JOIN devices d ON sr.from_device_id = d.device_id
WHERE sr.to_device_id = $1 AND sr.status = 'pending' AND sr.expires_at > NOW()
ORDER BY sr.created_at DESC;

-- name: UpdateSyncRequestStatus :exec
UPDATE sync_requests 
SET status = $2, responded_at = NOW()
WHERE id = $1;

-- name: CleanupExpiredSyncRequests :exec
DELETE FROM sync_requests WHERE expires_at < NOW();