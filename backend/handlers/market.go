package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	sb "github.com/nebeng/backend/supabase"
)

// GetMarketProducts returns products with optional filters
func GetMarketProducts(c *gin.Context) {
	search := c.Query("search")
	category := c.Query("category")   // warung.category
	categoryID := c.Query("category_id") // product category_id

	selectCols := `id,name,estimated_price,image_url,rating,is_estimated,created_at,` +
		`categories:category_id(name),` +
		`warung:warungs!inner(name,category,status,created_by_clerk_id,owner:users!warungs_created_by_clerk_id_fkey(avatar_url,name))`

	path := fmt.Sprintf("warung_products?select=%s&order=created_at.desc&limit=20", selectCols)

	if category != "" {
		path += fmt.Sprintf("&warung.category=eq.%s", category)
	}
	if categoryID != "" {
		path += fmt.Sprintf("&category_id=eq.%s", categoryID)
	}
	if search != "" {
		// Search warung name first to get IDs
		warungData, _, _ := sb.DefaultClient.DoRequest("GET",
			fmt.Sprintf("warungs?select=id&name=ilike.*%s*", search),
			nil,
		)
		var warungMatches []map[string]interface{}
		json.Unmarshal(warungData, &warungMatches)

		if len(warungMatches) > 0 {
			ids := make([]string, len(warungMatches))
			for i, w := range warungMatches {
				ids[i] = fmt.Sprintf("%v", w["id"])
			}
			// This OR filter requires a specific format in Supabase
			path += fmt.Sprintf("&name=ilike.*%s*", search)
		} else {
			path += fmt.Sprintf("&name=ilike.*%s*", search)
		}
	}

	data, _, err := sb.DefaultClient.DoRequest("GET", path, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var rawProducts []map[string]interface{}
	if err := json.Unmarshal(data, &rawProducts); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse products"})
		return
	}

	// Flatten for frontend compatibility
	products := make([]map[string]interface{}, 0, len(rawProducts))
	for _, p := range rawProducts {
		flat := map[string]interface{}{
			"id":              p["id"],
			"name":            p["name"],
			"estimated_price": p["estimated_price"],
			"image_url":       p["image_url"],
			"rating":          p["rating"],
			"is_estimated":    p["is_estimated"],
			"created_at":      p["created_at"],
		}

		if cats, ok := p["categories"].(map[string]interface{}); ok {
			flat["category_name"] = cats["name"]
		}
		if warung, ok := p["warung"].(map[string]interface{}); ok {
			flat["warung_name"] = warung["name"]
			flat["warung_status"] = warung["status"]
			flat["owner_id"] = warung["created_by_clerk_id"]
			if owner, ok := warung["owner"].(map[string]interface{}); ok {
				flat["owner_name"] = owner["name"]
				flat["owner_avatar"] = owner["avatar_url"]
			}
		}

		products = append(products, flat)
	}

	c.JSON(http.StatusOK, products)
}

// GetMarketOutlets returns warungs/outlets with optional filters
func GetMarketOutlets(c *gin.Context) {
	search := c.Query("search")
	category := c.Query("category")

	selectCols := `id,name,address,category,status,created_by_clerk_id,owner:users!warungs_created_by_clerk_id_fkey(avatar_url,name)`

	path := fmt.Sprintf("warungs?select=%s&order=created_at.desc&limit=20", selectCols)

	if category != "" {
		path += fmt.Sprintf("&category=eq.%s", category)
	}
	if search != "" {
		path += fmt.Sprintf("&name=ilike.*%s*", search)
	}

	data, _, err := sb.DefaultClient.DoRequest("GET", path, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var outlets []map[string]interface{}
	if err := json.Unmarshal(data, &outlets); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse outlets"})
		return
	}

	if outlets == nil {
		outlets = []map[string]interface{}{}
	}

	c.JSON(http.StatusOK, outlets)
}
