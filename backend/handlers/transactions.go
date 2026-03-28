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

// GetTransactions returns all transactions for the current user (as carrier or depositor)
// Response: []map[string]interface{}  → array of enriched transactions
func GetTransactions(c *gin.Context) {
	clerkID := middleware.GetClerkID(c)

	logSectionStart("GetTransactions Handler START", clerkID)

	if !isValidClerkID(clerkID) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user identification"})
		return
	}

	// Step 1: Ambil deals yang relevan
	deals, err := fetchUserDeals(clerkID)
	if err != nil {
		logError("Gagal mengambil deals dari Supabase", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data deals"})
		return
	}

	logInfo("Deals ditemukan", fmt.Sprintf("%d deals", len(deals)))

	// Step 2: Ekstrak dan enrich transactions
	transactions := extractAndEnrichTransactions(deals)

	logInfo("Total transaksi setelah ekstraksi", fmt.Sprintf("%d item", len(transactions)))

	// Optional: tampilkan sample jika ada (untuk debug)
	if len(transactions) > 0 {
		sample, _ := json.MarshalIndent(transactions[0], "  ", "  ")
		logDebug("Contoh transaksi pertama", string(sample))
	}

	// Step 3: Kirim response sebagai array JSON langsung
	rawJSON := safeMarshalJSON(transactions)
	c.Data(http.StatusOK, "application/json; charset=utf-8", rawJSON)

	logSectionEnd("GetTransactions Handler END", len(transactions))
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────────────────────────────────────

func logSectionStart(title, clerkID string) {
	fmt.Printf("\n╔════════════════════════════════════════════════════════════╗\n")
	fmt.Printf("║ 🔷 %s                          ║\n", title)
	fmt.Printf("╚════════════════════════════════════════════════════════════╝\n")
	fmt.Printf("  🔑 CLERK_ID: '%s'  (len: %d)\n", clerkID, len(clerkID))
}

func logSectionEnd(title string, count int) {
	fmt.Printf("\n╔════════════════════════════════════════════════════════════╗\n")
	fmt.Printf("║ ✅ %s  |  %d items dikirim                 ║\n", title, count)
	fmt.Printf("╚════════════════════════════════════════════════════════════╝\n\n")
}

func logInfo(label, msg string) {
	fmt.Printf("  📋 %s: %s\n", label, msg)
}

func logDebug(label, msg string) {
	fmt.Printf("  🔍 %s:\n%s\n", label, msg)
}

func logError(label string, err error) {
	fmt.Printf("  ❌ %s: %v\n", label, err)
}

func isValidClerkID(id string) bool {
	valid := true

	if len(id) < 20 {
		fmt.Printf("  ⚠️ ClerkID terlalu pendek (%d karakter)\n", len(id))
		valid = false
	}

	if len(id) > 5 && !strings.HasPrefix(id, "user_") {
		fmt.Printf("  ⚠️ ClerkID tidak diawali 'user_' → %s...\n", id[:10])
		valid = false
	}

	return valid
}

func fetchUserDeals(clerkID string) ([]map[string]interface{}, error) {
	// Versi bersih single-line
	selectFields := "id,carrier_id,depositor_id,item_description,status,agreed_fee,item_fee,delivery_status,pickup_location,delivery_location,pickup_datetime,created_at,post:posts!fk_deals_post(id,from_city,to_city,type,item_photo,created_at),carrier:users!deals_carrier_id_fkey(clerk_id,name,avatar_url),depositor:users!fk_deals_depositor(clerk_id,name,avatar_url),transactions(id,deal_id,transaction_status,gross_amount,payment_type,created_at)"

	query := fmt.Sprintf(
		"deals?select=%s&or=(carrier_id.eq.%s,depositor_id.eq.%s)",
		selectFields, clerkID, clerkID,
	)

	// Tambah log untuk debug URL final
	fmt.Printf("  🌐 Full Supabase URL: %s\n", "https://your-project.supabase.co/rest/v1/"+query)

	data, _, err := sb.DefaultClient.DoRequest("GET", query, nil)
	if err != nil {
		return nil, fmt.Errorf("gagal request ke Supabase: %w", err)
	}

	var deals []map[string]interface{}
	if err := json.Unmarshal(data, &deals); err != nil {
		return nil, fmt.Errorf("gagal parse JSON: %w", err)
	}

	return deals, nil
}

func extractAndEnrichTransactions(deals []map[string]interface{}) []map[string]interface{} {
	var result []map[string]interface{}

	for i, deal := range deals {
		dealID := safeGetString(deal, "id", "N/A")

		fmt.Printf("    [Deal %d] ID: %s\n", i, dealID)
		fmt.Printf("            carrier_id:   %v\n", deal["carrier_id"])
		fmt.Printf("            depositor_id: %v\n", deal["depositor_id"])

		txsRaw, exists := deal["transactions"]
		if !exists || txsRaw == nil {
			fmt.Printf("            Tidak ada transactions\n")
			continue
		}

		// Buat ringkasan deal yang aman (tanpa cycle)
		dealSummary := map[string]interface{}{
			"id":                deal["id"],
			"item_description":  deal["item_description"],
			"status":            deal["status"],
			"agreed_fee":        deal["agreed_fee"],
			"item_fee":          deal["item_fee"],
			"pickup_location":   deal["pickup_location"],
			"delivery_location": deal["delivery_location"],
			"pickup_datetime":   deal["pickup_datetime"],
			"carrier_id":        deal["carrier_id"],
			"depositor_id":      deal["depositor_id"],
			// Tambah field lain yang frontend butuhkan, contoh:
			"post":      deal["post"], // kalau perlu info post
			"carrier":   deal["carrier"],
			"depositor": deal["depositor"],
		}

		var added int

		switch txs := txsRaw.(type) {
		case []interface{}:
			fmt.Printf("            Transactions: %d item\n", len(txs))
			for j, item := range txs {
				if tx, ok := item.(map[string]interface{}); ok {
					// Hanya tambahkan summary, bukan seluruh deal
					tx["deal"] = dealSummary
					result = append(result, tx)
					added++
					fmt.Printf("              [Tx %d] Ditambahkan\n", j)
				}
			}

		case map[string]interface{}:
			fmt.Printf("            Transactions: 1 object (bukan array)\n")
			txs["deal"] = dealSummary
			result = append(result, txs)
			added++

		default:
			fmt.Printf("            Tipe transactions tidak didukung: %T\n", txs)
		}

		if added == 0 {
			fmt.Printf("            ⚠️ Tidak ada transaksi yang berhasil ditambahkan\n")
		}
	}

	return result
}

// Safe string extraction dengan default value
func safeGetString(m map[string]interface{}, key, defaultVal string) string {
	if v, ok := m[key]; ok && v != nil {
		switch val := v.(type) {
		case string:
			return val
		default:
			return fmt.Sprintf("%v", val)
		}
	}
	return defaultVal
}

// Marshal JSON dengan fallback aman
func safeMarshalJSON(v interface{}) []byte {
	data, err := json.Marshal(v)
	if err != nil {
		logError("Gagal marshal JSON response", err)
		return []byte("[]") // fallback empty array
	}
	return data
}

// InitiatePayment (tetap sama seperti aslinya)
func InitiatePayment(c *gin.Context) {
	var body struct {
		TransactionID string `json:"transaction_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.TransactionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "transaction_id wajib diisi"})
		return
	}

	data, err := sb.DefaultClient.InvokeFunction("create-midtrans-snap", map[string]interface{}{
		"transaction_id": body.TransactionID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat payment: " + err.Error()})
		return
	}

	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal parse response payment"})
		return
	}

	c.JSON(http.StatusOK, result)
}
