# Fuselink Server Makefile

.PHONY: help deps dev build test clean sqlc migrate-up migrate-down docker-build docker-run

# Default target
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Dependencies
deps: ## Install Go dependencies
	go mod tidy
	go mod download

# Development
dev: ## Start development server with hot reload
	go run main.go

build: ## Build the server binary
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o bin/fuselink-server main.go

# Testing
test: ## Run tests
	go test -v ./...

test-coverage: ## Run tests with coverage
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Database
sqlc: ## Generate sqlc code
	sqlc generate

migrate-up: ## Run database migrations up
	migrate -path db/migrations -database "postgres://localhost/fuselink?sslmode=disable" up

migrate-down: ## Run database migrations down
	migrate -path db/migrations -database "postgres://localhost/fuselink?sslmode=disable" down

migrate-create: ## Create a new migration (usage: make migrate-create NAME=migration_name)
	migrate create -ext sql -dir db/migrations -seq $(NAME)

# Database setup for development
db-setup: ## Set up local development database
	createdb fuselink || true
	make migrate-up

db-reset: ## Reset local development database
	dropdb fuselink || true
	createdb fuselink
	make migrate-up

# Docker
docker-build: ## Build Docker image
	docker build -t fuselink-server .

docker-run: ## Run Docker container
	docker run -p 8080:8080 fuselink-server

# Development tools
lint: ## Run golangci-lint
	golangci-lint run

fmt: ## Format Go code
	go fmt ./...

vet: ## Run go vet
	go vet ./...

# Clean
clean: ## Clean build artifacts
	rm -rf bin/
	rm -f coverage.out coverage.html

# TURN server (coturn)
turn-start: ## Start coturn TURN server
	docker-compose -f infra/docker-compose.turn.yml up -d

turn-stop: ## Stop coturn TURN server
	docker-compose -f infra/docker-compose.turn.yml down

turn-logs: ## Show coturn logs
	docker-compose -f infra/docker-compose.turn.yml logs -f

# All-in-one development setup
setup: deps db-setup sqlc ## Set up everything for development

# Production build
release: test build ## Build production release