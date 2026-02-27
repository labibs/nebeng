package routes

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/nebeng/backend/config"
	"github.com/nebeng/backend/handlers"
	"github.com/nebeng/backend/middleware"
)

func Setup(r *gin.Engine) {
	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{config.Cfg.FrontendURL, "http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "nebeng-backend"})
	})

	api := r.Group("/api")

	// Public routes (no auth needed)
	api.GET("/posts", handlers.GetPosts)

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
	}
}
