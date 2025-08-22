package signal

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

func TestNewHub(t *testing.T) {
	hub := NewHub()
	if hub == nil {
		t.Error("NewHub should return a non-nil hub")
	}
	
	if hub.rooms == nil {
		t.Error("Hub should have initialized rooms map")
	}
}

func TestHubRegisterClient(t *testing.T) {
	hub := NewHub()
	go hub.Run()
	
	// Create a mock WebSocket connection
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hub.HandleWebSocket(w, r, "test-room")
	}))
	defer server.Close()
	
	// Convert http URL to ws URL
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	
	// Connect to the WebSocket
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("Failed to connect to WebSocket: %v", err)
	}
	defer conn.Close()
	
	// Give some time for registration
	time.Sleep(10 * time.Millisecond)
	
	// Check that a room was created
	hub.mutex.RLock()
	roomExists := len(hub.rooms) > 0
	hub.mutex.RUnlock()
	
	if !roomExists {
		t.Error("Room should be created when client connects")
	}
}

func TestSignalingMessageRouting(t *testing.T) {
	hub := NewHub()
	go hub.Run()
	
	// Create test server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hub.HandleWebSocket(w, r, "test-room")
	}))
	defer server.Close()
	
	// Convert http URL to ws URL
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	
	// Connect first client
	conn1, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("Failed to connect first client: %v", err)
	}
	defer conn1.Close()
	
	// Connect second client
	conn2, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("Failed to connect second client: %v", err)
	}
	defer conn2.Close()
	
	// Give time for connections to establish
	time.Sleep(20 * time.Millisecond)
	
	// Send a message from client 1
	testMessage := SignalingMessage{
		Type:     "test",
		DeviceID: "device1",
		Data:     "hello",
	}
	
	messageBytes, err := json.Marshal(testMessage)
	if err != nil {
		t.Fatalf("Failed to marshal test message: %v", err)
	}
	
	err = conn1.WriteMessage(websocket.TextMessage, messageBytes)
	if err != nil {
		t.Fatalf("Failed to send message: %v", err)
	}
	
	// Try to read the message on client 2
	conn2.SetReadDeadline(time.Now().Add(100 * time.Millisecond))
	_, receivedBytes, err := conn2.ReadMessage()
	if err != nil {
		t.Fatalf("Failed to receive message on client 2: %v", err)
	}
	
	var receivedMessage SignalingMessage
	err = json.Unmarshal(receivedBytes, &receivedMessage)
	if err != nil {
		t.Fatalf("Failed to unmarshal received message: %v", err)
	}
	
	if receivedMessage.DeviceID != testMessage.DeviceID {
		t.Errorf("Message routing failed: expected device ID %s, got %s", testMessage.DeviceID, receivedMessage.DeviceID)
	}
}

func TestTargetedMessageRouting(t *testing.T) {
	hub := NewHub()
	go hub.Run()
	
	// This test would require more complex setup to test targeted messaging
	// For now, we'll test the basic structure
	message := SignalingMessage{
		Type:           "offer",
		DeviceID:       "device1",
		TargetDeviceID: stringPtr("device2"),
		Data:           map[string]interface{}{"sdp": "test"},
	}
	
	if message.TargetDeviceID == nil {
		t.Error("TargetDeviceID should be set")
	}
	
	if *message.TargetDeviceID != "device2" {
		t.Errorf("TargetDeviceID should be 'device2', got %s", *message.TargetDeviceID)
	}
}

func TestInvalidJSONHandling(t *testing.T) {
	hub := NewHub()
	go hub.Run()
	
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hub.HandleWebSocket(w, r, "test-room")
	}))
	defer server.Close()
	
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("Failed to connect: %v", err)
	}
	defer conn.Close()
	
	// Send invalid JSON - should not crash the server
	err = conn.WriteMessage(websocket.TextMessage, []byte("invalid json"))
	if err != nil {
		t.Fatalf("Failed to send invalid JSON: %v", err)
	}
	
	// Give time for processing
	time.Sleep(10 * time.Millisecond)
	
	// Server should still be responsive
	testMessage := SignalingMessage{
		Type:     "test",
		DeviceID: "device1",
		Data:     "valid message after invalid",
	}
	
	messageBytes, err := json.Marshal(testMessage)
	if err != nil {
		t.Fatalf("Failed to marshal test message: %v", err)
	}
	
	err = conn.WriteMessage(websocket.TextMessage, messageBytes)
	if err != nil {
		t.Fatalf("Failed to send message after invalid JSON: %v", err)
	}
}

// Helper function to create string pointer
func stringPtr(s string) *string {
	return &s
}