package middleware

import (
    "net/http"
    "os"
    "strings"

    "github.com/gin-gonic/gin"
)

// CORSMiddleware returns a middleware that allows origins configured via the
// `ALLOWED_ORIGINS` env var (comma-separated). If empty, defaults to
// http://localhost:3000 and http://localhost:5173 for Next.js/Vite development.
func CORSMiddleware() gin.HandlerFunc {
    allowed := os.Getenv("ALLOWED_ORIGINS")
    if allowed == "" {
        allowed = "http://localhost:3000,http://localhost:5173"
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
        if _, ok := origins[origin]; ok {
            c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
            c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
            c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
            c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        }
        if c.Request.Method == http.MethodOptions {
            c.AbortWithStatus(204)
            return
        }
        c.Next()
    }
}
