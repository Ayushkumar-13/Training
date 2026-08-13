package middleware

import (
    "net/http"

    "github.com/gin-gonic/gin"
)

// AdminOnly requires the JWT middleware to have set `role` in context.
func AdminOnly() gin.HandlerFunc {
    return func(c *gin.Context) {
        role, ok := c.Get("role")
        if !ok {
            c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient privileges"})
            return
        }
        if roleStr, ok := role.(string); !ok || roleStr != "admin" {
            c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin role required"})
            return
        }
        c.Next()
    }
}
