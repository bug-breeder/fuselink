package signal

import (
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

// readPump pumps messages from the WebSocket connection to the hub
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Broadcast message to other clients in the same room
		c.hub.mutex.RLock()
		room := c.hub.rooms[c.roomID]
		c.hub.mutex.RUnlock()

		if room != nil {
			for client := range room {
				if client != c {
					select {
					case client.send <- message:
					default:
						close(client.send)
						delete(room, client)
					}
				}
			}
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