package middleware

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"strings"
	"time"

	"crypto/rsa"
	"encoding/base64"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/nebeng/backend/config"
)

// JWKS represents the JSON Web Key Set from Clerk
type JWKS struct {
	Keys []JWK `json:"keys"`
}

type JWK struct {
	Kty string `json:"kty"`
	Kid string `json:"kid"`
	N   string `json:"n"`
	E   string `json:"e"`
}

var jwksCache *JWKS
var jwksCachedAt time.Time

func getJWKS() (*JWKS, error) {
	// Cache JWKS for 1 hour
	if jwksCache != nil && time.Since(jwksCachedAt) < time.Hour {
		return jwksCache, nil
	}

	resp, err := http.Get(config.Cfg.ClerkJWKSURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch JWKS: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read JWKS response: %w", err)
	}

	var jwks JWKS
	if err := json.Unmarshal(body, &jwks); err != nil {
		return nil, fmt.Errorf("failed to parse JWKS: %w", err)
	}

	jwksCache = &jwks
	jwksCachedAt = time.Now()
	return &jwks, nil
}

func getPublicKey(token *jwt.Token) (interface{}, error) {
	jwks, err := getJWKS()
	if err != nil {
		return nil, err
	}

	kid, ok := token.Header["kid"].(string)
	if !ok {
		return nil, fmt.Errorf("token missing kid header")
	}

	for _, key := range jwks.Keys {
		if key.Kid == kid && key.Kty == "RSA" {
			// Decode RSA public key
			nBytes, err := base64.RawURLEncoding.DecodeString(key.N)
			if err != nil {
				return nil, fmt.Errorf("failed to decode key modulus: %w", err)
			}
			eBytes, err := base64.RawURLEncoding.DecodeString(key.E)
			if err != nil {
				return nil, fmt.Errorf("failed to decode key exponent: %w", err)
			}

			n := new(big.Int).SetBytes(nBytes)
			e := new(big.Int).SetBytes(eBytes)

			return &rsa.PublicKey{
				N: n,
				E: int(e.Int64()),
			}, nil
		}
	}

	return nil, fmt.Errorf("no matching key found for kid: %s", kid)
}

// AuthMiddleware validates Clerk JWT and sets clerk_id in context
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		token, err := jwt.Parse(tokenString, getPublicKey, jwt.WithValidMethods([]string{"RS256"}))
		if err != nil {
			log.Printf("JWT parse error: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// Clerk uses "sub" as the user ID (clerk_id)
		clerkID, ok := claims["sub"].(string)
		if !ok || clerkID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID in token"})
			c.Abort()
			return
		}

		c.Set("clerk_id", clerkID)
		c.Next()
	}
}

// GetClerkID extracts clerk_id from gin context
func GetClerkID(c *gin.Context) string {
	id, _ := c.Get("clerk_id")
	return fmt.Sprintf("%v", id)
}
