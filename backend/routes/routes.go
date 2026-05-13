package routes

import (
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/nebeng/backend/config"
	"github.com/nebeng/backend/handlers"
	"github.com/nebeng/backend/middleware"
)

func Setup(r *gin.Engine) {
	// Allow local dev and production frontend
	origins := []string{"http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:3000", "https://nebeng.vercel.app", "https://nebeng-admin.vercel.app"}
	if config.Cfg.FrontendURL != "" {
		base := strings.TrimSuffix(config.Cfg.FrontendURL, "/")
		origins = append(origins, base, base+"/")
	}
	if config.Cfg.AdminFrontendURL != "" {
		base := strings.TrimSuffix(config.Cfg.AdminFrontendURL, "/")
		origins = append(origins, base, base+"/")
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept"},
		AllowCredentials: true,
		MaxAge:           86400,
	}))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "nebeng-backend"})
	})

	api := r.Group("/api")

	// Public routes (no auth needed)
	api.GET("/posts", handlers.GetPosts)
	// debug-only endpoint: same handler but skips auth so we can curl it easily
	// NOTE: remove or protect this in production
	api.GET("/transactions-debug", handlers.GetTransactions)

	// Protected routes
	auth := api.Group("/")
	auth.Use(middleware.AuthMiddleware())
	{
		// Users
		auth.GET("users/me", handlers.GetCurrentUser)
		auth.POST("users/sync", handlers.SyncUser)

		// Posts
		auth.POST("posts", handlers.CreatePost)

		// Cart
		auth.GET("cart", handlers.GetCart)
		auth.PATCH("cart/:id/quantity", handlers.UpdateCartItemQuantity)
		auth.DELETE("cart/:id", handlers.DeleteCartItem)
		auth.DELETE("cart", handlers.DeleteCartItems)
		auth.POST("cart/deal", handlers.DealCart)

		// Market
		auth.GET("market/products", handlers.GetMarketProducts)
		auth.GET("market/outlets", handlers.GetMarketOutlets)

		// Conversations / Chat
		auth.GET("conversations", handlers.GetConversations)
		auth.POST("conversations", handlers.StartConversation)
		auth.GET("users", handlers.GetAllUsers)

		// Transactions
		auth.GET("transactions", handlers.GetTransactions)
		auth.POST("transactions/pay", handlers.InitiatePayment)

		// Deals
		auth.GET("deals/post/:post_id", handlers.GetDealByPost)
		auth.GET("deals/:id/messages", handlers.GetDealMessages)
		auth.GET("deals/post/:post_id/info", handlers.GetPostForDeal)
	}
}
