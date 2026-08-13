package handlers

import (
    "net/http"
    "strconv"

    "backend/services"
    "github.com/gin-gonic/gin"
)

type WishlistHandler struct{ svc *services.WishlistService }

func NewWishlistHandler(s *services.WishlistService) *WishlistHandler { return &WishlistHandler{svc: s} }

type wishlistReq struct{
    ProductID int `json:"product_id" binding:"required"`
}

func (h *WishlistHandler) Add(c *gin.Context) {
    uid, ok := c.Get("user_id")
    if !ok { c.JSON(http.StatusUnauthorized, gin.H{"error":"missing user"}); return }
    userID := int(uid.(float64))
    var req wishlistReq
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
    if err := h.svc.Add(userID, req.ProductID); err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()}); return }
    c.JSON(http.StatusOK, gin.H{"message":"added"})
}

func (h *WishlistHandler) Remove(c *gin.Context) {
    uid, ok := c.Get("user_id")
    if !ok { c.JSON(http.StatusUnauthorized, gin.H{"error":"missing user"}); return }
    userID := int(uid.(float64))
    pidStr := c.Param("product_id")
    pid, err := strconv.Atoi(pidStr)
    if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error":"invalid product id"}); return }
    if err := h.svc.Remove(userID, pid); err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()}); return }
    c.JSON(http.StatusOK, gin.H{"message":"removed"})
}

func (h *WishlistHandler) List(c *gin.Context) {
    uid, ok := c.Get("user_id")
    if !ok { c.JSON(http.StatusUnauthorized, gin.H{"error":"missing user"}); return }
    userID := int(uid.(float64))
    items, err := h.svc.List(userID)
    if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()}); return }
    c.JSON(http.StatusOK, gin.H{"data": items})
}
