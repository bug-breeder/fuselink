-- Fuselink Database Schema

-- Device registration and management
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash of public key
    name VARCHAR(255) NOT NULL,
    pubkey_jwk JSONB NOT NULL, -- Public key in JWK format
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE
);

-- Push notification subscriptions
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(64) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    key_p256dh TEXT NOT NULL,
    key_auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(device_id, endpoint)
);

-- Device pairing relationships
CREATE TABLE pairings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_a_id VARCHAR(64) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    device_b_id VARCHAR(64) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(device_a_id, device_b_id),
    CHECK (device_a_id < device_b_id) -- Ensure consistent ordering
);

-- TURN server credentials (short-lived)
CREATE TABLE turn_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    device_id VARCHAR(64) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Signaling rooms for WebRTC negotiation
CREATE TABLE signaling_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR(255) UNIQUE NOT NULL,
    device_a_id VARCHAR(64) REFERENCES devices(device_id) ON DELETE CASCADE,
    device_b_id VARCHAR(64) REFERENCES devices(device_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Sync request tracking
CREATE TABLE sync_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_device_id VARCHAR(64) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    to_device_id VARCHAR(64) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    folder_id VARCHAR(255), -- Optional folder identifier
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, expired
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_devices_device_id ON devices(device_id);
CREATE INDEX idx_devices_last_seen ON devices(last_seen);
CREATE INDEX idx_push_subscriptions_device_id ON push_subscriptions(device_id);
CREATE INDEX idx_pairings_device_a_id ON pairings(device_a_id);
CREATE INDEX idx_pairings_device_b_id ON pairings(device_b_id);
CREATE INDEX idx_turn_credentials_device_id ON turn_credentials(device_id);
CREATE INDEX idx_turn_credentials_expires_at ON turn_credentials(expires_at);
CREATE INDEX idx_signaling_rooms_room_id ON signaling_rooms(room_id);
CREATE INDEX idx_signaling_rooms_expires_at ON signaling_rooms(expires_at);
CREATE INDEX idx_sync_requests_to_device_id ON sync_requests(to_device_id);
CREATE INDEX idx_sync_requests_from_device_id ON sync_requests(from_device_id);
CREATE INDEX idx_sync_requests_expires_at ON sync_requests(expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_push_subscriptions_updated_at
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();