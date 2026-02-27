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

	selectCols := `id,transaction_status,gross_amount,payment_type,created_at,` +
		`deal:deals!inner(` +
		`id,status,agreed_fee,carrier_id,depositor_id,pickup_location,delivery_location,` +
		`pickup_datetime,item_description,delivery_status,` +
		`carrier:users!deals_carrier_id_fkey(clerk_id,name,avatar_url),` +
		`depositor:users!fk_deals_depositor(clerk_id,name,avatar_url),` +
		`post:posts!fk_deals_post(from_city,to_city,type,item_photo,created_at)` +
		`)`

	// Supabase OR filter for foreign table fields
	path := fmt.Sprintf(
		"transactions?select=%s&or=(deals.carrier_id.eq.%s,deals.depositor_id.eq.%s)&order=created_at.desc",
		selectCols, clerkID, clerkID,
	)

	data, _, err := sb.DefaultClient.DoRequest("GET", path, nil)
	if err != nil {
		// Fallback: fetch deals separately and then transactions
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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
