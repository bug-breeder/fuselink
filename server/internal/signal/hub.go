package signal

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow connections from any origin in development
		// TODO: Restrict this in production
		return true
	},
}

// SignalingMessage represents a WebRTC signaling message
type SignalingMessage struct {
	Type           string      `json:"type"`
	DeviceID       string      `json:"deviceId"`
	TargetDeviceID *string     `json:"targetDeviceId,omitempty"`
	Data           interface{} `json:"data,omitempty"`
}

// Client represents a WebSocket client
type Client struct {
	hub      *Hub
	conn     *websocket.Conn
	send     chan []byte
	roomID   string
	deviceID string
}

// Hub maintains active clients and broadcasts messages to them
type Hub struct {
	// Registered clients by room ID
	rooms map[string]map[*Client]bool

	// Inbound messages from the clients
	broadcast chan []byte

	// Register requests from the clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	mutex sync.RWMutex
}

// NewHub creates a new signaling hub
func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[string]map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			if h.rooms[client.roomID] == nil {
				h.rooms[client.roomID] = make(map[*Client]bool)
			}
			h.rooms[client.roomID][client] = true
			h.mutex.Unlock()
			
			log.Printf("Client registered in room %s", client.roomID)

		case client := <-h.unregister:
			h.mutex.Lock()
			if room, ok := h.rooms[client.roomID]; ok {
				if _, ok := room[client]; ok {
					delete(room, client)
					close(client.send)
					
					// Clean up empty rooms
					if len(room) == 0 {
						delete(h.rooms, client.roomID)
					}
				}
			}
			h.mutex.Unlock()
			
			log.Printf("Client unregistered from room %s", client.roomID)
		}
	}
}

// HandleWebSocket upgrades HTTP connection to WebSocket and handles signaling
func (h *Hub) HandleWebSocket(w http.ResponseWriter, r *http.Request, roomID string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	client := &Client{
		hub:    h,
		conn:   conn,
		send:   make(chan []byte, 256),
		roomID: roomID,
	}

	h.register <- client

	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump()
}

// BroadcastToRoom sends a message to all clients in a specific room except the sender
func (h *Hub) BroadcastToRoom(roomID string, message []byte, senderClient *Client) {
	h.mutex.RLock()
	room := h.rooms[roomID]
	h.mutex.RUnlock()

	if room != nil {
		for client := range room {
			if client != senderClient {
				select {
				case client.send <- message:
				default:
					// Client send channel is full, close it
					h.mutex.Lock()
					close(client.send)
					delete(room, client)
					if len(room) == 0 {
						delete(h.rooms, roomID)
					}
					h.mutex.Unlock()
				}
			}
		}
	}
}

// SendToDevice sends a message to a specific device in a room
func (h *Hub) SendToDevice(roomID, targetDeviceID string, message []byte) bool {
	h.mutex.RLock()
	room := h.rooms[roomID]
	h.mutex.RUnlock()

	if room != nil {
		for client := range room {
			if client.deviceID == targetDeviceID {
				select {
				case client.send <- message:
					return true
				default:
					// Client send channel is full, close it
					h.mutex.Lock()
					close(client.send)
					delete(room, client)
					if len(room) == 0 {
						delete(h.rooms, roomID)
					}
					h.mutex.Unlock()
					return false
				}
			}
		}
	}
	return false
}

// readPump pumps messages from the WebSocket connection to the hub
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	for {
		_, rawMessage, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Parse the signaling message to extract device and target information
		var signalingMsg SignalingMessage
		if err := json.Unmarshal(rawMessage, &signalingMsg); err != nil {
			log.Printf("Invalid signaling message format: %v", err)
			continue
		}

		// Set the client's device ID if not already set
		if c.deviceID == "" {
			c.deviceID = signalingMsg.DeviceID
			log.Printf("Client device ID set to: %s", c.deviceID)
		}

		// Route message based on target device ID
		if signalingMsg.TargetDeviceID != nil {
			// Send to specific device
			if !c.hub.SendToDevice(c.roomID, *signalingMsg.TargetDeviceID, rawMessage) {
				log.Printf("Target device %s not found in room %s", *signalingMsg.TargetDeviceID, c.roomID)
			}
		} else {
			// Broadcast to all other clients in the room
			c.hub.BroadcastToRoom(c.roomID, rawMessage, c)
		}
	}
}

// writePump pumps messages from the hub to the WebSocket connection
func (c *Client) writePump() {
	defer c.conn.Close()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}
		}
	}
}