package handlers

import (
    "net/http"

    "backend/services"
    "github.com/gin-gonic/gin"
)

type OrderHandler struct{ svc *services.OrderService }

func NewOrderHandler(s *services.OrderService) *OrderHandler { return &OrderHandler{svc: s} }

func (h *OrderHandler) Create(c *gin.Context) {
    uid, ok := c.Get("user_id")
    if !ok { c.JSON(http.StatusUnauthorized, gin.H{"error":"missing user"}); return }
    userID := int(uid.(float64))
    oid, err := h.svc.PlaceOrder(userID)
    if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
    c.JSON(http.StatusCreated, gin.H{"order_id": oid})
}
