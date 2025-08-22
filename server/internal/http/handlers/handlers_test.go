package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealth(t *testing.T) {
	h := New(Config{})
	
	req, err := http.NewRequest("GET", "/api/health", nil)
	if err != nil {
		t.Fatal(err)
	}
	
	rr := httptest.NewRecorder()
	h.Health(rr, req)
	
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Health handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	
	var response map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("Health handler returned invalid JSON: %v", err)
	}
	
	if response["status"] != "ok" {
		t.Errorf("Health handler returned wrong status: got %v want ok", response["status"])
	}
}

func TestHealthMethodNotAllowed(t *testing.T) {
	h := New(Config{})
	
	req, err := http.NewRequest("POST", "/api/health", nil)
	if err != nil {
		t.Fatal(err)
	}
	
	rr := httptest.NewRecorder()
	h.Health(rr, req)
	
	if status := rr.Code; status != http.StatusMethodNotAllowed {
		t.Errorf("Health handler should return 405 for POST: got %v want %v", status, http.StatusMethodNotAllowed)
	}
}

func TestTurnCredentials(t *testing.T) {
	h := New(Config{})
	
	req, err := http.NewRequest("GET", "/api/turn-cred", nil)
	if err != nil {
		t.Fatal(err)
	}
	
	rr := httptest.NewRecorder()
	h.TurnCredentials(rr, req)
	
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("TurnCredentials handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	
	var response IceServersResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("TurnCredentials handler returned invalid JSON: %v", err)
	}
	
	if len(response.IceServers) == 0 {
		t.Error("TurnCredentials handler should return at least one ICE server")
	}
	
	if len(response.IceServers[0].Urls) == 0 {
		t.Error("ICE server should have at least one URL")
	}
}

func TestRegisterDevice(t *testing.T) {
	h := New(Config{})
	
	deviceReq := DeviceRegistrationRequest{
		DeviceID:  "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
		Name:      "Test Device",
		PubKeyJwk: json.RawMessage(`{"kty":"EC","crv":"P-256","x":"test","y":"test"}`),
	}
	
	body, err := json.Marshal(deviceReq)
	if err != nil {
		t.Fatal(err)
	}
	
	req, err := http.NewRequest("POST", "/api/devices", bytes.NewBuffer(body))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	
	rr := httptest.NewRecorder()
	h.registerDevice(rr, req)
	
	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("registerDevice handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}
	
	var response DeviceRegistrationResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("registerDevice handler returned invalid JSON: %v", err)
	}
	
	if response.DeviceID != deviceReq.DeviceID {
		t.Errorf("Device ID mismatch: got %v want %v", response.DeviceID, deviceReq.DeviceID)
	}
}

func TestRegisterDeviceInvalidJSON(t *testing.T) {
	h := New(Config{})
	
	req, err := http.NewRequest("POST", "/api/devices", bytes.NewBufferString("invalid json"))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	
	rr := httptest.NewRecorder()
	h.registerDevice(rr, req)
	
	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("registerDevice handler should return 400 for invalid JSON: got %v want %v", status, http.StatusBadRequest)
	}
}

func TestRegisterDeviceMissingFields(t *testing.T) {
	h := New(Config{})
	
	deviceReq := DeviceRegistrationRequest{
		Name: "Test Device",
		// Missing DeviceID
	}
	
	body, err := json.Marshal(deviceReq)
	if err != nil {
		t.Fatal(err)
	}
	
	req, err := http.NewRequest("POST", "/api/devices", bytes.NewBuffer(body))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	
	rr := httptest.NewRecorder()
	h.registerDevice(rr, req)
	
	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("registerDevice handler should return 400 for missing fields: got %v want %v", status, http.StatusBadRequest)
	}
}

func TestRegisterDeviceInvalidDeviceID(t *testing.T) {
	h := New(Config{})
	
	deviceReq := DeviceRegistrationRequest{
		DeviceID: "invalid", // Too short
		Name:     "Test Device",
	}
	
	body, err := json.Marshal(deviceReq)
	if err != nil {
		t.Fatal(err)
	}
	
	req, err := http.NewRequest("POST", "/api/devices", bytes.NewBuffer(body))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	
	rr := httptest.NewRecorder()
	h.registerDevice(rr, req)
	
	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("registerDevice handler should return 400 for invalid device ID: got %v want %v", status, http.StatusBadRequest)
	}
}