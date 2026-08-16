package handlers

import (
	"net/http"
	"strconv"

	"backend/models"
	"backend/services"
	"github.com/gin-gonic/gin"
)

type OrderHandler struct{ svc *services.OrderService }

func NewOrderHandler(s *services.OrderService) *OrderHandler { return &OrderHandler{svc: s} }

func (h *OrderHandler) Create(c *gin.Context) {
	userID, ok := getUserIDFromCtx(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user context"})
		return
	}

	var req models.CreateOrderRequest
	_ = c.ShouldBindJSON(&req)

	oid, err := h.svc.PlaceOrder(userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"ok": true, "order_id": oid})
}

func (h *OrderHandler) List(c *gin.Context) {
	userID, ok := getUserIDFromCtx(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user context"})
		return
	}
	orders, err := h.svc.GetOrdersForUser(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, orders)
}

func (h *OrderHandler) ListAll(c *gin.Context) {
	orders, err := h.svc.GetAllOrders()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, orders)
}

func (h *OrderHandler) UpdateStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order id"})
		return
	}
	var req struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Status == "" {
		req.Status = "delivered"
	}
	if err := h.svc.UpdateOrderStatus(id, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "message": "order status updated"})
}
