package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/numpak/backend/middleware"
	"github.com/numpak/backend/models"
	sb "github.com/numpak/backend/supabase"
)

// GetCurrentUser returns the authenticated user's profile
func GetCurrentUser(c *gin.Context) {
	clerkID := middleware.GetClerkID(c)

	data, _, err := sb.DefaultClient.DoRequest("GET",
		fmt.Sprintf("users?clerk_id=eq.%s&select=id,clerk_id,name,avatar_url,phone,created_at", clerkID),
		nil,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var users []models.User
	if err := json.Unmarshal(data, &users); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse users"})
		return
	}

	if len(users) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, users[0])
}

// SyncUser upserts a user record from Clerk data
func SyncUser(c *gin.Context) {
	clerkID := middleware.GetClerkID(c)

	var body struct {
		Name      string `json:"name"`
		AvatarURL string `json:"avatar_url"`
		Phone     string `json:"phone,omitempty"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Check if user exists
	checkData, _, err := sb.DefaultClient.DoRequest("GET",
		fmt.Sprintf("users?clerk_id=eq.%s&select=id", clerkID),
		nil,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var existingUsers []map[string]interface{}
	json.Unmarshal(checkData, &existingUsers)

	payload := map[string]interface{}{
		"id":         clerkID,
		"clerk_id":   clerkID,
		"name":       body.Name,
		"avatar_url": body.AvatarURL,
	}
	if body.Phone != "" {
		payload["phone"] = body.Phone
	}

	if len(existingUsers) == 0 {
		// Insert new user
		_, status, err := sb.DefaultClient.DoRequest("POST", "users", payload)
		if err != nil || status >= 400 {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"message": "User created"})
	} else {
		// Update existing user
		_, status, err := sb.DefaultClient.DoRequest("PATCH",
			fmt.Sprintf("users?clerk_id=eq.%s", clerkID),
			payload,
		)
		if err != nil || status >= 400 {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "User updated"})
	}
}
