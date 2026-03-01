package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/nebeng/backend/middleware"
	sb "github.com/nebeng/backend/supabase"
)

// GetTransactions returns all transactions for the current user (as carrier or depositor)
func GetTransactions(c *gin.Context) {
	clerkID := middleware.GetClerkID(c)

	// Step 1: Get the internal user ID from users table using clerkID
	userData, _, err := sb.DefaultClient.DoRequest("GET",
		fmt.Sprintf("users?clerk_id=eq.%s&select=id", clerkID),
		nil,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user mapping: " + err.Error()})
		return
	}

	var users []map[string]interface{}
	if err := json.Unmarshal(userData, &users); err != nil || len(users) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found in mapping"})
		return
	}

	internalUserID := users[0]["id"]
	// Could be float64 or string depending on DB type
	idStr := fmt.Sprintf("%v", internalUserID)

	// Step 2: Workaround for PostgREST: fetch deals where user is carrier or depositor
	dealSelect := `id`
	dealPath := fmt.Sprintf(
		"deals?select=%s&or=(carrier_id.eq.%s,depositor_id.eq.%s)",
		dealSelect, idStr, idStr,
	)

	dealData, _, err := sb.DefaultClient.DoRequest("GET", dealPath, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch deals: " + err.Error()})
		return
	}

	var dealsResponse []map[string]interface{}
	if err := json.Unmarshal(dealData, &dealsResponse); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse deals"})
		return
	}

	if len(dealsResponse) == 0 {
		c.JSON(http.StatusOK, []map[string]interface{}{})
		return
	}

	var dealIDs []string
	for _, d := range dealsResponse {
		if id, ok := d["id"].(float64); ok {
			dealIDs = append(dealIDs, fmt.Sprintf("%v", id))
		} else if idStr, ok := d["id"].(string); ok {
			dealIDs = append(dealIDs, idStr)
		}
	}

	// Now fetch transactions for those deals
	// Constructing in.() filter for deal_id
	inFilter := "deal_id.in.("
	for i, id := range dealIDs {
		if i > 0 {
			inFilter += ","
		}
		inFilter += id
	}
	inFilter += ")"

	selectCols := `id,transaction_status,gross_amount,payment_type,created_at,` +
		`deal:deals!inner(` +
		`id,status,agreed_fee,carrier_id,depositor_id,pickup_location,delivery_location,` +
		`pickup_datetime,item_description,delivery_status,` +
		`carrier:users!deals_carrier_id_fkey(clerk_id,name,avatar_url),` +
		`depositor:users!fk_deals_depositor(clerk_id,name,avatar_url),` +
		`post:posts!fk_deals_post(from_city,to_city,type,item_photo,created_at)` +
		`)`

	path := fmt.Sprintf(
		"transactions?select=%s&%s&order=created_at.desc",
		selectCols, inFilter,
	)

	data, _, err := sb.DefaultClient.DoRequest("GET", path, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transactions " + err.Error()})
		return
	}

	var transactions []map[string]interface{}
	if err := json.Unmarshal(data, &transactions); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse transactions"})
		return
	}

	if transactions == nil {
		transactions = []map[string]interface{}{}
	}

	c.JSON(http.StatusOK, transactions)
}

// InitiatePayment calls the Supabase Edge Function to create a Midtrans snap token
func InitiatePayment(c *gin.Context) {
	var body struct {
		TransactionID string `json:"transaction_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.TransactionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "transaction_id is required"})
		return
	}

	data, err := sb.DefaultClient.InvokeFunction("create-midtrans-snap", map[string]interface{}{
		"transaction_id": body.TransactionID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment: " + err.Error()})
		return
	}

	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse payment response"})
		return
	}

	c.JSON(http.StatusOK, result)
}
