package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	SupabaseURL        string
	SupabaseServiceKey string
	SupabaseAnonKey    string
	ClerkJWKSURL       string
	Port               string
	FrontendURL        string
}

var Cfg Config

func Load() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment")
	}

	Cfg = Config{
		SupabaseURL:        getEnv("SUPABASE_URL", "https://osoryiixxzufkvsftkai.supabase.co"),
		SupabaseServiceKey: getEnv("SUPABASE_SERVICE_KEY", ""),
		SupabaseAnonKey:    getEnv("SUPABASE_ANON_KEY", ""),
		ClerkJWKSURL:       getEnv("CLERK_JWKS_URL", ""),
		Port:               getEnv("PORT", "8080"),
		FrontendURL:        getEnv("FRONTEND_URL", "https://nebeng.vercel.app"),
	}

	if Cfg.SupabaseURL == "" {
		log.Fatal("REQUIRED: SUPABASE_URL is missing or empty in environment")
	}
	if Cfg.SupabaseServiceKey == "" {
		log.Fatal("REQUIRED: SUPABASE_SERVICE_KEY is missing or empty in environment. (Check if you used SUPABASE_ANON_KEY by mistake)")
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
