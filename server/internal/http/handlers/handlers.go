package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/alanguyen/fuselink/internal/signal"
)

type Config struct {
	// DB              *sql.DB              // TODO: Add database connection
	SignalHub       *signal.Hub
	VAPIDPublicKey  string
	VAPIDPrivateKey string
}

type Handlers struct {
	config Config
}

func New(config Config) *Handlers {
	return &Handlers{
		config: config,
	}
}

// Health check endpoint
func (h *Handlers) Health(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	response := map[string]interface{}{
		"status":  "ok",
		"service": "fuselink-server",
		"version": "0.1.0",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Device registration and management
func (h *Handlers) Devices(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		h.registerDevice(w, r)
	case http.MethodGet:
		h.listDevices(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

type DeviceRegistrationRequest struct {
	DeviceID   string          `json:"deviceId"`
	Name       string          `json:"name"`
	PubKeyJwk  json.RawMessage `json:"pubKeyJwk"`
}

type DeviceRegistrationResponse struct {
	DeviceID  string          `json:"deviceId"`
	Name      string          `json:"name"`
	PubKeyJwk json.RawMessage `json:"pubKeyJwk"`
	CreatedAt string          `json:"createdAt"`
}

func (h *Handlers) registerDevice(w http.ResponseWriter, r *http.Request) {
	var req DeviceRegistrationRequest
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	// Basic validation
	if req.DeviceID == "" || req.Name == "" {
		http.Error(w, "deviceId and name are required", http.StatusBadRequest)
		return
	}

	if len(req.DeviceID) != 64 { // SHA-256 hex string
		http.Error(w, "invalid deviceId format", http.StatusBadRequest)
		return
	}

	// TODO: Validate public key JWK format
	// TODO: Verify deviceId matches the public key hash
	// TODO: Store in database using sqlc queries

	// For now, return success response
	response := DeviceRegistrationResponse{
		DeviceID:  req.DeviceID,
		Name:      req.Name,
		PubKeyJwk: req.PubKeyJwk,
		CreatedAt: "2025-01-01T00:00:00Z", // TODO: Use actual timestamp
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

func (h *Handlers) listDevices(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement device listing
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"devices": []interface{}{},
		"message": "Device listing endpoint - TODO",
	})
}

// Push notification subscription
func (h *Handlers) PushSubscribe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// TODO: Implement push subscription
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Push subscription endpoint - TODO",
	})
}

// Send sync push notification
func (h *Handlers) PushSync(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// TODO: Implement sync push
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Sync push endpoint - TODO",
	})
}

type IceServersResponse struct {
	IceServers []IceServer `json:"iceServers"`
}

type IceServer struct {
	Urls []string `json:"urls"`
}

// ICE servers configuration (STUN only, no TURN credentials needed)
func (h *Handlers) TurnCredentials(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Return Google's free STUN servers
	response := IceServersResponse{
		IceServers: []IceServer{
			{
				Urls: []string{
					"stun:stun.l.google.com:19302",
					"stun:stun1.l.google.com:19302", 
					"stun:stun2.l.google.com:19302",
					"stun:stun3.l.google.com:19302",
					"stun:stun4.l.google.com:19302",
				},
			},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// WebSocket signaling for WebRTC
func (h *Handlers) WebSocketSignaling(w http.ResponseWriter, r *http.Request) {
	// Extract room ID from URL path
	roomID := r.URL.Path[len("/ws/signaling/"):]
	if roomID == "" {
		http.Error(w, "Room ID required", http.StatusBadRequest)
		return
	}

	// Upgrade to WebSocket and handle signaling
	h.config.SignalHub.HandleWebSocket(w, r, roomID)
}