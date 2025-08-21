package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/alanguyen/fuselink/internal/signal"
)

type Config struct {
	// DB              *sql.DB
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

func (h *Handlers) registerDevice(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement device registration
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Device registration endpoint - TODO",
	})
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

// TURN server credentials
func (h *Handlers) TurnCredentials(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// TODO: Implement TURN credential generation
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "TURN credentials endpoint - TODO",
	})
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