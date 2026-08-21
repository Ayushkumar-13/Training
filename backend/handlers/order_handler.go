package handlers

import (
	"log"
	"net/http"
	"strconv"

	"backend/models"
	"backend/services"
	"backend/ws"
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

	ws.BroadcastEvent("ORDER_CREATED", gin.H{
		"order_id": oid,
		"user_id":  userID,
		"status":   "pending",
	})

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

	ws.BroadcastEvent("ORDER_STATUS_UPDATED", gin.H{
		"order_id": id,
		"status":   req.Status,
	})

	c.JSON(http.StatusOK, gin.H{"ok": true, "message": "order status updated"})
}

func (h *OrderHandler) Cancel(c *gin.Context) {
	userID, ok := getUserIDFromCtx(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user context"})
		return
	}
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order id"})
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	_ = c.ShouldBindJSON(&req)

	if req.Reason == "" {
		req.Reason = "Order cancelled by customer (No reason specified)"
	}

	if err := h.svc.CancelOrderForUser(id, userID, req.Reason); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[ORGANIZATION AUDIT LOG] Order #%d cancelled by User ID %d. Reason: '%s'", id, userID, req.Reason)

	ws.BroadcastEvent("ORDER_STATUS_UPDATED", gin.H{
		"order_id":       id,
		"status":         "cancelled",
		"payment_status": "refunded",
	})

	c.JSON(http.StatusOK, gin.H{
		"ok":                  true,
		"message":             "Order cancelled successfully and reason dispatched to organization logistics",
		"order_id":            id,
		"cancellation_reason": req.Reason,
	})
}

func (h *OrderHandler) RequestReturn(c *gin.Context) {
	userID, ok := getUserIDFromCtx(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user context"})
		return
	}
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order id"})
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	_ = c.ShouldBindJSON(&req)

	if req.Reason == "" {
		req.Reason = "Equipment return requested by hospital (No reason specified)"
	}

	if err := h.svc.RequestReturnForUser(id, userID, req.Reason); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":            true,
		"message":       "Order return request submitted successfully under 30-day clinical return policy",
		"order_id":      id,
		"return_reason": req.Reason,
		"return_status": "requested",
	})
}

func (h *OrderHandler) UpdateReturnStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order id"})
		return
	}
	var req struct {
		ReturnStatus string `json:"return_status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.ReturnStatus == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid return_status"})
		return
	}
	if err := h.svc.UpdateOrderReturnStatus(id, req.ReturnStatus); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "message": "order return status updated"})
}
