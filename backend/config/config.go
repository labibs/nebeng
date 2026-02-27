package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	SupabaseURL    string
	SupabaseServiceKey string
	SupabaseAnonKey    string
	ClerkJWKSURL   string
	Port           string
	FrontendURL    string
}

var Cfg Config

func Load() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment")
	}

	Cfg = Config{
		SupabaseURL:        getEnv("SUPABASE_URL", ""),
		SupabaseServiceKey: getEnv("SUPABASE_SERVICE_KEY", ""),
		SupabaseAnonKey:    getEnv("SUPABASE_ANON_KEY", ""),
		ClerkJWKSURL:       getEnv("CLERK_JWKS_URL", ""),
		Port:               getEnv("PORT", "8080"),
		FrontendURL:        getEnv("FRONTEND_URL", "http://localhost:5173"),
	}

	if Cfg.SupabaseURL == "" || Cfg.SupabaseServiceKey == "" {
		log.Fatal("SUPABASE_URL and SUPABASE_SERVICE_KEY are required")
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
