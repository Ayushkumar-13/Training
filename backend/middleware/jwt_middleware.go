package middleware

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func JWTMiddleware(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			return
		}
		parts := strings.SplitN(auth, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header"})
			return
		}
		tokenStr := parts[1]
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			if sub, ok := claims["sub"]; ok {
				switch v := sub.(type) {
				case float64:
					c.Set("user_id", int(v))
				case int:
					c.Set("user_id", v)
				case int64:
					c.Set("user_id", int(v))
				case string:
					if id, err := strconv.Atoi(v); err == nil {
						c.Set("user_id", id)
					}
				default:
					c.Set("user_id", v)
				}
			}
			if role, ok := claims["role"]; ok {
				c.Set("role", role)
			}
		}
		c.Next()
	}
}
