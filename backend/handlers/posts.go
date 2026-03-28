package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/nebeng/backend/middleware"
	sb "github.com/nebeng/backend/supabase"
)

// GetPosts returns posts with optional filters
func GetPosts(c *gin.Context) {
	selectCols := `*,users(name,avatar_url)`

	path := fmt.Sprintf("posts?select=%s&order=created_at.desc", selectCols)

	// Apply filters from query params
	if tab := c.Query("tab"); tab != "" && tab != "semua" {
		postType := "titip"
		if tab == "bawa" {
			postType = "bawa"
		}
		path += fmt.Sprintf("&type=eq.%s", postType)
	}

	if feeMin := c.Query("fee_min"); feeMin != "" {
		path += fmt.Sprintf("&fee=gte.%s", feeMin)
	}
	if feeMax := c.Query("fee_max"); feeMax != "" {
		path += fmt.Sprintf("&fee=lte.%s", feeMax)
	}

	if armada := c.Query("armada"); armada != "" && armada != "all" {
		path += fmt.Sprintf("&armada=eq.%s", armada)
	}

	if date := c.Query("date"); date != "" {
		path += fmt.Sprintf("&travel_date=eq.%s", date)
	}

	data, _, err := sb.DefaultClient.DoRequest("GET", path, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var posts []map[string]interface{}
	if err := json.Unmarshal(data, &posts); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse posts"})
		return
	}

	// Search filter (applied in-memory for flexibility)
	if search := c.Query("search"); search != "" {
		filtered := []map[string]interface{}{}
		searchLower := toLower(search)
		for _, p := range posts {
			fields := []string{
				getString(p, "from_city"),
				getString(p, "to_city"),
				getString(p, "item_description"),
				getString(p, "description"),
			}
			for _, f := range fields {
				if containsLower(f, searchLower) {
					filtered = append(filtered, p)
					break
				}
			}
		}
		posts = filtered
	}

	c.JSON(http.StatusOK, posts)
}

// CreatePost creates a new post
func CreatePost(c *gin.Context) {
	clerkID := middleware.GetClerkID(c)

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	body["user_id"] = clerkID

	data, status, err := sb.DefaultClient.DoRequest("POST", "posts", body)
	if err != nil || status >= 400 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create post: %s", err)})
		return
	}

	var created []map[string]interface{}
	json.Unmarshal(data, &created)

	if len(created) > 0 {
		c.JSON(http.StatusCreated, created[0])
	} else {
		c.JSON(http.StatusCreated, gin.H{"message": "Post created"})
	}
}

// Helper functions
func toLower(s string) string {
	result := make([]rune, len([]rune(s)))
	for i, r := range []rune(s) {
		if r >= 'A' && r <= 'Z' {
			result[i] = r + 32
		} else {
			result[i] = r
		}
	}
	return string(result)
}

func containsLower(haystack, needle string) bool {
	if needle == "" {
		return false
	}
	return len(haystack) >= len(needle) && (haystack == needle ||
		len(haystack) > 0 && containsSubstring(toLower(haystack), toLower(needle)))
}

func containsSubstring(s, sub string) bool {
	if len(sub) == 0 {
		return true
	}
	if len(s) < len(sub) {
		return false
	}
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}

func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok && v != nil {
		return fmt.Sprintf("%v", v)
	}
	return ""
}
