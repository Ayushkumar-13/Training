package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

// CORSMiddleware allows origins for frontend (Next.js 3000) and admin (Vite 5173/3001).
func CORSMiddleware() gin.HandlerFunc {
	allowed := os.Getenv("ALLOWED_ORIGINS")
	if allowed == "" {
		allowed = os.Getenv("CORS_ORIGINS")
	}
	if allowed == "" {
		allowed = "http://localhost:3000,http://localhost:5173,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:3001"
	}

	origins := map[string]struct{}{}
	for _, o := range strings.Split(allowed, ",") {
		o = strings.TrimSpace(o)
		if o != "" {
			origins[o] = struct{}{}
		}
	}

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		// Allow configured origin or allow any localhost origin in dev
		if _, ok := origins[origin]; ok || (origin != "" && (strings.HasPrefix(origin, "http://localhost:") || strings.HasPrefix(origin, "http://127.0.0.1:"))) {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		}
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
