package handlers

import (
	"net/http"
	"strconv"

	"backend/services"
	"github.com/gin-gonic/gin"
)

type CartHandler struct{ svc *services.CartService }

func NewCartHandler(s *services.CartService) *CartHandler { return &CartHandler{svc: s} }

func getUserIDFromCtx(c *gin.Context) (int, bool) {
	uid, ok := c.Get("user_id")
	if !ok {
		return 0, false
	}
	switch v := uid.(type) {
	case int:
		return v, true
	case float64:
		return int(v), true
	case int64:
		return int(v), true
	case string:
		if id, err := strconv.Atoi(v); err == nil {
			return id, true
		}
	}
	return 0, false
}

type addItemReq struct {
	ProductID int `json:"product_id" binding:"required"`
	Quantity  int `json:"quantity" binding:"required,min=1"`
}

func (h *CartHandler) Get(c *gin.Context) {
	userID, ok := getUserIDFromCtx(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user context"})
		return
	}
	cart, items, err := h.svc.GetCart(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"cart": cart, "items": items}})
}

func (h *CartHandler) Add(c *gin.Context) {
	userID, ok := getUserIDFromCtx(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user context"})
		return
	}
	var req addItemReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.AddItem(userID, req.ProductID, req.Quantity); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "item added"})
}

func (h *CartHandler) Remove(c *gin.Context) {
	userID, ok := getUserIDFromCtx(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user context"})
		return
	}
	pidStr := c.Param("product_id")
	pid, err := strconv.Atoi(pidStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}
	if err := h.svc.RemoveItem(userID, pid); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "item removed"})
}
