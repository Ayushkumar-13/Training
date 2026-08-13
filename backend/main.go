package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"backend/db"
	"backend/handlers"
	"backend/middleware"
	"backend/repositories"
	"backend/services"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load env (ensure .env.dev used when running via docker-compose)
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Println("Warning: JWT_SECRET not set; using fallback (not for production)")
		jwtSecret = "dev_jwt_secret_change_me"
	}

	dbConn, err := db.ConnectFromEnv()
	if err != nil {
		log.Fatalf("database connect: %v", err)
	}
	// verify connection
	if err := dbConn.Ping(); err != nil {
		log.Fatalf("db ping: %v", err)
	}
	fmt.Println("DB connected")

	userRepo := repositories.NewUserRepository(dbConn)
	productRepo := repositories.NewProductRepository(dbConn)

	authSvc := services.NewAuthService(userRepo, jwtSecret)
	productSvc := services.NewProductService(productRepo)
	cartRepo := repositories.NewCartRepository(dbConn)
	wishlistRepo := repositories.NewWishlistRepository(dbConn)

	cartSvc := services.NewCartService(cartRepo, productRepo)
	wishlistSvc := services.NewWishlistService(wishlistRepo, productRepo)

	r := gin.Default()

	authHandler := handlers.NewAuthHandler(authSvc)
	productHandler := handlers.NewProductHandler(productSvc)
	cartHandler := handlers.NewCartHandler(cartSvc)
	wishlistHandler := handlers.NewWishlistHandler(wishlistSvc)

	api := r.Group("/api")
	{
		api.POST("/register", authHandler.Register)
		api.POST("/login", authHandler.Login)

		api.GET("/products", productHandler.List)
		api.GET("/products/:id", productHandler.Get)

		protected := api.Group("")
		protected.Use(middleware.JWTMiddleware(jwtSecret))
		protected.GET("/me", authHandler.Me)

		// Admin product management
		admin := protected.Group("")
		admin.Use(middleware.AdminOnly())
		admin.POST("/products", productHandler.Create)
		admin.PUT("/products/:id", productHandler.Update)
		admin.DELETE("/products/:id", productHandler.Delete)
		// User cart and wishlist
		protected.GET("/cart", cartHandler.Get)
		protected.POST("/cart/items", cartHandler.Add)
		protected.DELETE("/cart/items/:product_id", cartHandler.Remove)

		protected.POST("/wishlist", wishlistHandler.Add)
		protected.DELETE("/wishlist/:product_id", wishlistHandler.Remove)
		protected.GET("/wishlist", wishlistHandler.List)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	addr := fmt.Sprintf(":%s", port)
	log.Printf("listening on %s", addr)
	if err := r.Run(addr); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}
