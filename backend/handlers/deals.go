package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	sb "github.com/nebeng/backend/supabase"
)

// GetDealByPost searches for the latest deal associated with a specific post
func GetDealByPost(c *gin.Context) {
	postId := c.Param("post_id")
	if postId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "post_id is required"})
		return
	}

	// 1. Find the latest message that has a deal_id for this post
	msgQuery := fmt.Sprintf("messages?select=deal_id&post_id=eq.%s&deal_id=not.is.null&order=created_at.desc&limit=1", postId)
	msgData, _, err := sb.DefaultClient.DoRequest("GET", msgQuery, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch deal from messages"})
		return
	}

	var messages []map[string]interface{}
	json.Unmarshal(msgData, &messages)

	if len(messages) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No deal found for this post"})
		return
	}

	dealId := messages[0]["deal_id"]

	// 2. Fetch the deal details
	// Note: item_fee is removed because it's reported missing/invalid (400)
	dealQuery := fmt.Sprintf("deals?select=id,agreed_fee,pickup_location,delivery_location,pickup_datetime,item_description,status&id=eq.%v", dealId)
	dealData, _, err := sb.DefaultClient.DoRequest("GET", dealQuery, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch deal details"})
		return
	}

	var deals []map[string]interface{}
	json.Unmarshal(dealData, &deals)

	if len(deals) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Deal details not found"})
		return
	}

	c.JSON(http.StatusOK, deals[0])
}

// GetDealMessages fetches all negotiation steps (message_type) for a specific deal
func GetDealMessages(c *gin.Context) {
	dealId := c.Param("id")
	if dealId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "deal_id is required"})
		return
	}

	query := fmt.Sprintf("messages?select=message_type,deal_id,content,from_city,to_city,fee,travel_date,item_description&deal_id=eq.%s&order=created_at.desc", dealId)
	data, _, err := sb.DefaultClient.DoRequest("GET", query, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch deal messages"})
		return
	}

	var messages []map[string]interface{}
	json.Unmarshal(data, &messages)

	c.JSON(http.StatusOK, messages)
}

// GetPostForDeal fetches post details simplified for DealMenu
func GetPostForDeal(c *gin.Context) {
	postId := c.Param("post_id")
	if postId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "post_id is required"})
		return
	}

	query := fmt.Sprintf("posts?select=id,type,from_city,to_city,travel_date,item_description,fee,item_photo&id=eq.%s", postId)
	data, _, err := sb.DefaultClient.DoRequest("GET", query, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch post details"})
		return
	}

	var posts []map[string]interface{}
	json.Unmarshal(data, &posts)

	if len(posts) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	c.JSON(http.StatusOK, posts[0])
}
