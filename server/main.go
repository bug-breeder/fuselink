package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/alanguyen/fuselink/internal/http/handlers"
	signalhub "github.com/alanguyen/fuselink/internal/signal"
	"github.com/rs/cors"
)

func main() {
	// Configuration
	port := getEnv("PORT", "8080")
	// dbURL := getEnv("DATABASE_URL", "postgres://localhost/fuselink?sslmode=disable") // TODO: Implement database
	vapidPublicKey := getEnv("VAPID_PUBLIC_KEY", "")
	vapidPrivateKey := getEnv("VAPID_PRIVATE_KEY", "")
	
	log.Printf("Starting Fuselink server on port %s", port)

	// Initialize database connection
	// db, err := sql.Open("postgres", dbURL)
	// if err != nil {
	// 	log.Fatal("Failed to connect to database:", err)
	// }
	// defer db.Close()

	// Initialize signaling hub for WebRTC
	hub := signalhub.NewHub()
	go hub.Run()

	// Initialize HTTP handlers
	handlers := handlers.New(handlers.Config{
		// DB: db,                    // TODO: Add database connection
		SignalHub:       hub,
		VAPIDPublicKey:  vapidPublicKey,
		VAPIDPrivateKey: vapidPrivateKey,
	})

	// Set up routes
	mux := http.NewServeMux()
	
	// API routes
	mux.HandleFunc("/api/health", handlers.Health)
	mux.HandleFunc("/api/devices", handlers.Devices)
	mux.HandleFunc("/api/push/subscribe", handlers.PushSubscribe)
	mux.HandleFunc("/api/push/sync", handlers.PushSync)
	mux.HandleFunc("/api/turn-cred", handlers.TurnCredentials)
	
	// WebSocket signaling
	mux.HandleFunc("/ws/signaling/", handlers.WebSocketSignaling)

	// Static files (for development)
	if os.Getenv("ENV") == "development" {
		fs := http.FileServer(http.Dir("../app/dist/"))
		mux.Handle("/", fs)
	}

	// CORS middleware
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(mux)

	// Create server
	server := &http.Server{
		Addr:    ":" + port,
		Handler: handler,
		// Good practice: enforce timeouts
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Printf("Server listening on :%s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server failed to start:", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Give outstanding requests 30 seconds to complete
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}