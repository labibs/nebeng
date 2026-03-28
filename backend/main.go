package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/nebeng/backend/config"
	"github.com/nebeng/backend/routes"
	sb "github.com/nebeng/backend/supabase"
)

func main() {
	// Load config
	config.Load()

	// Initialize Supabase client
	sb.Init()

	// Setup Gin
	r := gin.Default()

	// Register all routes
	routes.Setup(r)

	port := config.Cfg.Port
	log.Printf("🚀 Nebeng backend running on port %s", port)
	log.Printf("📡 Supabase: %s", config.Cfg.SupabaseURL)
	log.Printf("🔐 Clerk JWKS: %s", config.Cfg.ClerkJWKSURL)
	log.Printf("🌐 Frontend URL: %s", config.Cfg.FrontendURL)

	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
