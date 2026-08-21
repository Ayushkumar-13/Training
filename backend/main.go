package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"backend/db"
	"backend/handlers"
	"backend/middleware"
	"backend/repositories"
	"backend/services"

	"github.com/gin-gonic/gin"
)

func main() {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Println("Warning: JWT_SECRET not set; using fallback (not for production)")
		jwtSecret = "dev_jwt_secret_change_me"
	}

	dbConn, err := db.ConnectFromEnv()
	if err != nil {
		log.Fatalf("database connect: %v", err)
	}
	defer dbConn.Close()

	if err := dbConn.Ping(); err != nil {
		log.Fatalf("db ping: %v", err)
	}
	fmt.Println("SQL Database connected successfully!")

	// Auto-run SQL migrations and initial data seed
	migrationsDir := filepath.Join(".", "db", "migrations")
	if err := db.RunMigrations(dbConn, migrationsDir); err != nil {
		log.Printf("SQL migration info: %v", err)
	}
	if err := db.Seed(dbConn); err != nil {
		log.Printf("SQL seed info: %v", err)
	}

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}
	redisPass := os.Getenv("REDIS_PASSWORD")
	cache := services.NewCache(redisAddr, redisPass)

	userRepo := repositories.NewUserRepository(dbConn)
	productRepo := repositories.NewProductRepository(dbConn)
	categoryRepo := repositories.NewCategoryRepository(dbConn)

	authSvc := services.NewAuthService(userRepo, jwtSecret, cache)
	categorySvc := services.NewCategoryService(categoryRepo)

	productSvc := services.NewProductService(productRepo, cache)
	cartRepo := repositories.NewCartRepository(dbConn)
	wishlistRepo := repositories.NewWishlistRepository(dbConn)

	cartSvc := services.NewCartService(cartRepo, productRepo)
	wishlistSvc := services.NewWishlistService(wishlistRepo, productRepo)
	orderRepo := repositories.NewOrderRepository(dbConn)
	orderSvc := services.NewOrderService(dbConn, orderRepo, cartSvc)

	r := gin.Default()
	_ = r.SetTrustedProxies(nil)
	r.Use(middleware.CORSMiddleware())

	authHandler := handlers.NewAuthHandler(authSvc)
	productHandler := handlers.NewProductHandler(productSvc)
	categoryHandler := handlers.NewCategoryHandler(categorySvc)
	cartHandler := handlers.NewCartHandler(cartSvc)
	wishlistHandler := handlers.NewWishlistHandler(wishlistSvc)
	orderHandler := handlers.NewOrderHandler(orderSvc)
	adminHandler := handlers.NewAdminHandler(productSvc)
	razorpayHandler := handlers.NewRazorpayHandler(orderSvc)

	api := r.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "medical-ecommerce-api", "database": "postgresql-sql"})
		})

		wsHandler := handlers.NewWSHandler()
		api.GET("/ws", wsHandler.ServeWS)

		api.POST("/register", authHandler.Register)
		api.POST("/login", authHandler.Login)

		api.GET("/categories", categoryHandler.List)
		api.GET("/products", productHandler.List)
		api.GET("/products/:id", productHandler.Get)
		api.GET("/products/:id/reviews", productHandler.GetReviews)
		api.POST("/reviews/:id/helpful", productHandler.VoteHelpful)

		protected := api.Group("")
		protected.Use(middleware.JWTMiddleware(jwtSecret))
		protected.GET("/me", authHandler.Me)

		// User cart, wishlist, and orders
		protected.GET("/cart", cartHandler.Get)
		protected.POST("/cart/items", cartHandler.Add)
		protected.DELETE("/cart/items/:product_id", cartHandler.Remove)

		protected.GET("/wishlist", wishlistHandler.List)
		protected.POST("/wishlist", wishlistHandler.Add)
		protected.DELETE("/wishlist/:product_id", wishlistHandler.Remove)

		protected.POST("/products/:id/reviews", productHandler.AddReview)

		protected.POST("/orders", orderHandler.Create)
		protected.GET("/orders", orderHandler.List)
		protected.POST("/orders/:id/cancel", orderHandler.Cancel)
		protected.POST("/orders/:id/return", orderHandler.RequestReturn)

		// Razorpay Payment Gateway Endpoints
		protected.POST("/payments/razorpay/order", razorpayHandler.CreateOrder)
		protected.POST("/payments/razorpay/verify", razorpayHandler.VerifyPayment)

		// Admin routes
		admin := protected.Group("")
		admin.Use(middleware.AdminOnly())
		admin.GET("/admin/stats", adminHandler.GetStats)
		admin.GET("/admin/orders", orderHandler.ListAll)
		admin.GET("/admin/users", authHandler.ListUsers)
		admin.POST("/categories", categoryHandler.Create)

		admin.POST("/products", productHandler.Create)
		admin.PUT("/products/:id", productHandler.Update)
		admin.DELETE("/products/:id", productHandler.Delete)
		admin.DELETE("/admin/products/clear-all", adminHandler.ClearAllProducts)
		admin.PUT("/products/:id/inventory", productHandler.AdjustInventory)

		admin.PUT("/orders/:id/status", orderHandler.UpdateStatus)
		admin.PUT("/orders/:id/fulfill", orderHandler.UpdateStatus)
		admin.PUT("/orders/:id/return-status", orderHandler.UpdateReturnStatus)

		admin.GET("/admin/reviews", productHandler.ListAllReviews)
		admin.DELETE("/admin/reviews/:id", productHandler.DeleteReview)
	}

	// Bind explicitly to 127.0.0.1 (loopback interface)
	bindAddr := os.Getenv("BIND_ADDR")
	if bindAddr == "" {
		port := os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}
		bindAddr = fmt.Sprintf("127.0.0.1:%s", port)
	}

	log.Printf("Server listening on http://%s", bindAddr)
	if err := r.Run(bindAddr); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}
