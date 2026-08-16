package handlers

import (
	"net/http"

	"backend/services"

	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	productSvc *services.ProductService
}

func NewAdminHandler(productSvc *services.ProductService) *AdminHandler {
	return &AdminHandler{productSvc: productSvc}
}

func (h *AdminHandler) GetStats(c *gin.Context) {
	stats, err := h.productSvc.GetDashboardStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load admin stats"})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func (h *AdminHandler) ClearAllProducts(c *gin.Context) {
	if err := h.productSvc.ClearAllProducts(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "All product catalog items cleared successfully"})
}
