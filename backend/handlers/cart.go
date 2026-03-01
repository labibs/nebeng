package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/nebeng/backend/middleware"
	sb "github.com/nebeng/backend/supabase"
)

const cartItemSelect = `id,user_id,quantity,requested_price,estimated_price,notes,status,` +
	`product:product_id(name,image_url,estimated_price),` +
	`warung:warung_id(id,name,address,latitude,longitude,category,status,created_by_clerk_id,owner:users(avatar_url,name)),` +
	`buyer:users(name,avatar_url)`

// GetCart retrieves all pending cart items for the current user
// (items they added + items from their warung added by others)
func GetCart(c *gin.Context) {
	clerkID := middleware.GetClerkID(c)

	// 1. Items where I am the buyer
	buyerData, _, err := sb.DefaultClient.DoRequest("GET",
		fmt.Sprintf("warung_cart_items?select=%s&user_id=eq.%s&status=eq.pending",
			cartItemSelect, clerkID),
		nil,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch buyer cart"})
		return
	}

	var buyerItems []map[string]interface{}
	json.Unmarshal(buyerData, &buyerItems)

	// 2. Items from warungs I own (other users ordering from my warung)
	// First get my warung IDs
	warungData, _, err := sb.DefaultClient.DoRequest("GET",
		fmt.Sprintf("warungs?select=id&created_by_clerk_id=eq.%s", clerkID),
		nil,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch warungs"})
		return
	}

	var myWarungs []map[string]interface{}
	json.Unmarshal(warungData, &myWarungs)

	var ownerItems []map[string]interface{}
	if len(myWarungs) > 0 {
		quotedIDs := make([]string, len(myWarungs))
		for i, w := range myWarungs {
			quotedIDs[i] = fmt.Sprintf("\"%v\"", w["id"])
		}
		warungIDs := strings.Join(quotedIDs, ",")

		ownerData, _, err := sb.DefaultClient.DoRequest("GET",
			fmt.Sprintf("warung_cart_items?select=%s&warung_id=in.(%s)&status=eq.pending&user_id=neq.%s",
				cartItemSelect, warungIDs, clerkID),
			nil,
		)
		if err == nil {
			json.Unmarshal(ownerData, &ownerItems)
		}
	}

	// Merge both lists
	allItems := append(buyerItems, ownerItems...)
	if allItems == nil {
		allItems = []map[string]interface{}{}
	}

	c.JSON(http.StatusOK, allItems)
}

// UpdateCartItemQuantity updates the quantity of a cart item
func UpdateCartItemQuantity(c *gin.Context) {
	itemID := c.Param("id")

	var body struct {
		Quantity int `json:"quantity"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Quantity < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quantity"})
		return
	}

	_, status, err := sb.DefaultClient.DoRequest("PATCH",
		fmt.Sprintf("warung_cart_items?id=eq.%s", itemID),
		map[string]interface{}{"quantity": body.Quantity},
	)
	if err != nil || status >= 400 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update quantity"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Quantity updated"})
}

// DeleteCartItem deletes a single cart item
func DeleteCartItem(c *gin.Context) {
	itemID := c.Param("id")

	_, status, err := sb.DefaultClient.DoRequest("DELETE",
		fmt.Sprintf("warung_cart_items?id=eq.%s", itemID),
		nil,
	)
	if err != nil || status >= 400 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item deleted"})
}

// DeleteCartItems deletes multiple cart items by IDs
func DeleteCartItems(c *gin.Context) {
	var body struct {
		IDs []string `json:"ids"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || len(body.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid IDs"})
		return
	}

	quotedIDs := make([]string, len(body.IDs))
	for i, id := range body.IDs {
		quotedIDs[i] = fmt.Sprintf("\"%s\"", id)
	}
	ids := strings.Join(quotedIDs, ",")
	_, status, err := sb.DefaultClient.DoRequest("DELETE",
		fmt.Sprintf("warung_cart_items?id=in.(%s)", ids),
		nil,
	)
	if err != nil || status >= 400 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete items"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("%d items deleted", len(body.IDs))})
}

// DealCart initiates a deal: marks selected cart items as "deal",
// finds or creates a conversation, and returns the conversation_id
func DealCart(c *gin.Context) {
	clerkID := middleware.GetClerkID(c)

	var body struct {
		ItemIDs          []string `json:"item_ids"`
		OpponentID       string   `json:"opponent_id"`
		PickupLocation   string   `json:"pickup_location"`
		DeliveryLocation string   `json:"delivery_location"`
		Notes            string   `json:"notes"`
		ProposedFee      float64  `json:"proposed_fee"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || len(body.ItemIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "item_ids are required"})
		return
	}
	if body.OpponentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "opponent_id is required"})
		return
	}

	// 1. Update cart items status to "deal"
	quotedIDs := make([]string, len(body.ItemIDs))
	for i, id := range body.ItemIDs {
		quotedIDs[i] = fmt.Sprintf("\"%s\"", id)
	}
	ids := strings.Join(quotedIDs, ",")
	resBody, status, err := sb.DefaultClient.DoRequest("PATCH",
		fmt.Sprintf("warung_cart_items?id=in.(%s)", ids),
		map[string]interface{}{"status": "deal"},
	)
	if err != nil || status >= 400 {
		fmt.Printf("Supabase error updating cart items: status=%d, body=%s, err=%v\n", status, string(resBody), err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update cart items status", "details": string(resBody)})
		return
	}

	// 2. Find existing conversation between the two users
	var conversationID string

	// Get all conversations where current user is a participant
	myParticipantData, _, err := sb.DefaultClient.DoRequest("GET",
		fmt.Sprintf("conversation_participants?select=conversation_id&user_id=eq.%s", clerkID),
		nil,
	)
	if err == nil {
		var myParticipants []map[string]interface{}
		json.Unmarshal(myParticipantData, &myParticipants)

		if len(myParticipants) > 0 {
			myConvIDs := make([]string, len(myParticipants))
			for i, p := range myParticipants {
				myConvIDs[i] = fmt.Sprintf("%v", p["conversation_id"])
			}

			// Check if opponent is also in any of those conversations
			opponentData, _, err2 := sb.DefaultClient.DoRequest("GET",
				fmt.Sprintf("conversation_participants?select=conversation_id&user_id=eq.%s&conversation_id=in.(%s)",
					body.OpponentID, strings.Join(myConvIDs, ",")),
				nil,
			)
			if err2 == nil {
				var opponentParticipants []map[string]interface{}
				json.Unmarshal(opponentData, &opponentParticipants)
				if len(opponentParticipants) > 0 {
					conversationID = fmt.Sprintf("%v", opponentParticipants[0]["conversation_id"])
				}
			}
		}
	}

	// 3. Create new conversation if not found
	if conversationID == "" {
		convData, _, err := sb.DefaultClient.DoRequest("POST", "conversations", map[string]interface{}{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create conversation"})
			return
		}

		var convResult []map[string]interface{}
		if err := json.Unmarshal(convData, &convResult); err != nil || len(convResult) == 0 {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse conversation result"})
			return
		}
		conversationID = fmt.Sprintf("%v", convResult[0]["id"])

		// Add both participants
		sb.DefaultClient.DoRequest("POST", "conversation_participants", []map[string]interface{}{
			{"conversation_id": conversationID, "user_id": clerkID},
			{"conversation_id": conversationID, "user_id": body.OpponentID},
		})
	}

	c.JSON(http.StatusOK, gin.H{"conversation_id": conversationID})
}
