package handlers

import (
    "net/http"

    "backend/services"
    "github.com/gin-gonic/gin"
)

type AuthHandler struct{ svc *services.AuthService }

func NewAuthHandler(s *services.AuthService) *AuthHandler { return &AuthHandler{svc: s} }

type registerReq struct {
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required,min=8"`
    FullName string `json:"full_name"`
}

func (h *AuthHandler) Register(c *gin.Context) {
    var req registerReq
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    u, err := h.svc.Register(req.Email, req.Password, req.FullName)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusCreated, gin.H{"data": u})
}

type loginReq struct{
    Email string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
    var req loginReq
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    u, token, err := h.svc.Authenticate(req.Email, req.Password)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"data": gin.H{"user": u, "token": token}})
}

func (h *AuthHandler) Me(c *gin.Context) {
    userID, ok := c.Get("user_id")
    if !ok {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user context"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"data": gin.H{"user_id": userID}})
}
