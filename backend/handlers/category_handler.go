package handlers

import (
	"net/http"

	"backend/models"
	"backend/services"

	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	svc *services.CategoryService
}

func NewCategoryHandler(svc *services.CategoryService) *CategoryHandler {
	return &CategoryHandler{svc: svc}
}

func (h *CategoryHandler) List(c *gin.Context) {
	categories, err := h.svc.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch categories"})
		return
	}
	c.JSON(http.StatusOK, categories)
}

func (h *CategoryHandler) Create(c *gin.Context) {
	var cat models.Category
	if err := c.ShouldBindJSON(&cat); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if cat.Name == "" || cat.Slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name and slug are required"})
		return
	}
	if err := h.svc.Create(c.Request.Context(), &cat); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, cat)
}
