package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/nebeng/backend/middleware"
	sb "github.com/nebeng/backend/supabase"
)

// GetConversations returns the list of conversations for the current user
// with last message, unread count, and opponent info
func GetConversations(c *gin.Context) {
	clerkID := middleware.GetClerkID(c)
	searchQuery := c.Query("search")

	// 1. Get all conversation IDs for this user
	participantData, _, err := sb.DefaultClient.DoRequest("GET",
		fmt.Sprintf("conversation_participants?select=conversation_id&user_id=eq.%s", clerkID),
		nil,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch conversations"})
		return
	}

	var myParticipants []map[string]interface{}
	json.Unmarshal(participantData, &myParticipants)

	if len(myParticipants) == 0 {
		c.JSON(http.StatusOK, []interface{}{})
		return
	}

	convIDs := make([]string, len(myParticipants))
	for i, p := range myParticipants {
		convIDs[i] = fmt.Sprintf("%v", p["conversation_id"])
	}
	convIDsStr := strings.Join(convIDs, ",")

	// 2. Get all messages for these conversations
	msgData, _, err := sb.DefaultClient.DoRequest("GET",
		fmt.Sprintf("messages?select=id,conversation_id,content,created_at,sender_id,is_read&conversation_id=in.(%s)&order=created_at.desc",
			convIDsStr),
		nil,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}

	var messages []map[string]interface{}
	json.Unmarshal(msgData, &messages)

	// Build lastMsgMap and unreadCountMap
	lastMsgMap := map[string]map[string]interface{}{}
	unreadCountMap := map[string]int{}

	for _, msg := range messages {
		convID := getString(msg, "conversation_id")
		senderID := getString(msg, "sender_id")
		isRead, _ := msg["is_read"].(bool)

		if _, ok := lastMsgMap[convID]; !ok {
			lastMsgMap[convID] = msg
		}

		if senderID != clerkID && !isRead {
			unreadCountMap[convID]++
		}
	}

	// 3. Get all participants for these conversations (to find opponents)
	allParticipantsData, _, _ := sb.DefaultClient.DoRequest("GET",
		fmt.Sprintf("conversation_participants?select=conversation_id,user_id&conversation_id=in.(%s)", convIDsStr),
		nil,
	)
	var allParticipants []map[string]interface{}
	json.Unmarshal(allParticipantsData, &allParticipants)

	// Find opponent IDs
	opponentIDs := []string{}
	opponentConvMap := map[string]string{} // conversationID -> opponentClerkID
	for _, p := range allParticipants {
		userID := getString(p, "user_id")
		convID := getString(p, "conversation_id")
		if userID != clerkID {
			opponentIDs = append(opponentIDs, userID)
			opponentConvMap[convID] = userID
		}
	}

	// 4. Get opponent user details
	opponentMap := map[string]map[string]interface{}{}
	if len(opponentIDs) > 0 {
		uniqueIDs := deduplicate(opponentIDs)
		opponentData, _, _ := sb.DefaultClient.DoRequest("GET",
			fmt.Sprintf("users?select=clerk_id,name,avatar_url&clerk_id=in.(%s)",
				strings.Join(uniqueIDs, ",")),
			nil,
		)
		var opponentUsers []map[string]interface{}
		json.Unmarshal(opponentData, &opponentUsers)
		for _, u := range opponentUsers {
			opponentMap[getString(u, "clerk_id")] = u
		}
	}

	// 5. Build conversation list
	type convItem struct {
		ConversationID string                 `json:"conversationId"`
		Opponent       map[string]interface{} `json:"opponent"`
		LastMessage    string                 `json:"lastMessage"`
		LastTime       string                 `json:"lastTime"`
		UnreadCount    int                    `json:"unreadCount"`
	}

	result := []convItem{}
	for _, convID := range convIDs {
		opponentClerkID := opponentConvMap[convID]
		opponent, ok := opponentMap[opponentClerkID]
		if !ok {
			opponent = map[string]interface{}{
				"name":       "Unknown",
				"avatar_url": "/default-avatar.png",
			}
		}

		lastMsg := lastMsgMap[convID]
		if lastMsg == nil {
			continue // Sembunyikan obrolan yang belum pernah ada pesan
		}

		lastMessage := getString(lastMsg, "content")
		lastTime := getString(lastMsg, "created_at")

		// Apply search filter
		if searchQuery != "" {
			q := toLower(searchQuery)
			opponentName := toLower(fmt.Sprintf("%v", opponent["name"]))
			msgLower := toLower(lastMessage)
			if !containsSubstring(opponentName, q) && !containsSubstring(msgLower, q) {
				continue
			}
		}

		result = append(result, convItem{
			ConversationID: convID,
			Opponent:       opponent,
			LastMessage:    lastMessage,
			LastTime:       lastTime,
			UnreadCount:    unreadCountMap[convID],
		})
	}

	// Sort by last message time (most recent first)
	sort.Slice(result, func(i, j int) bool {
		return result[i].LastTime > result[j].LastTime
	})

	c.JSON(http.StatusOK, result)
}

// StartConversation finds or creates a conversation between two users
func StartConversation(c *gin.Context) {
	clerkID := middleware.GetClerkID(c)

	var body struct {
		OpponentID string `json:"opponent_id"` // clerk_id
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.OpponentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "opponent_id is required"})
		return
	}

	// Find existing conversation
	myPartData, _, _ := sb.DefaultClient.DoRequest("GET",
		fmt.Sprintf("conversation_participants?select=conversation_id&user_id=eq.%s", clerkID),
		nil,
	)
	var myParts []map[string]interface{}
	json.Unmarshal(myPartData, &myParts)

	var conversationID string
	if len(myParts) > 0 {
		myConvIDs := make([]string, len(myParts))
		for i, p := range myParts {
			myConvIDs[i] = fmt.Sprintf("%v", p["conversation_id"])
		}

		oppPartData, _, _ := sb.DefaultClient.DoRequest("GET",
			fmt.Sprintf("conversation_participants?select=conversation_id&user_id=eq.%s&conversation_id=in.(%s)",
				body.OpponentID, strings.Join(myConvIDs, ",")),
			nil,
		)
		var oppParts []map[string]interface{}
		json.Unmarshal(oppPartData, &oppParts)
		if len(oppParts) > 0 {
			conversationID = fmt.Sprintf("%v", oppParts[0]["conversation_id"])
		}
	}

	if conversationID == "" {
		// Create new conversation
		convData, _, err := sb.DefaultClient.DoRequest("POST", "conversations", map[string]interface{}{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create conversation"})
			return
		}
		var convResult []map[string]interface{}
		json.Unmarshal(convData, &convResult)
		if len(convResult) == 0 {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No conversation returned"})
			return
		}
		conversationID = fmt.Sprintf("%v", convResult[0]["id"])

		sb.DefaultClient.DoRequest("POST", "conversation_participants", []map[string]interface{}{
			{"conversation_id": conversationID, "user_id": clerkID},
			{"conversation_id": conversationID, "user_id": body.OpponentID},
		})
	}

	c.JSON(http.StatusOK, gin.H{"conversation_id": conversationID})
}

// GetAllUsers returns all users except the current user (for starting a new chat)
func GetAllUsers(c *gin.Context) {
	clerkID := middleware.GetClerkID(c)

	data, _, err := sb.DefaultClient.DoRequest("GET",
		fmt.Sprintf("users?select=id,name,avatar_url,clerk_id&clerk_id=neq.%s&order=name.asc", clerkID),
		nil,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var users []map[string]interface{}
	json.Unmarshal(data, &users)
	if users == nil {
		users = []map[string]interface{}{}
	}

	c.JSON(http.StatusOK, users)
}

func deduplicate(slice []string) []string {
	keys := make(map[string]bool)
	result := []string{}
	for _, item := range slice {
		if !keys[item] {
			keys[item] = true
			result = append(result, item)
		}
	}
	return result
}
