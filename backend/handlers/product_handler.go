package handlers

import (
    "net/http"
    "strconv"

    "backend/models"
    "backend/repositories"
    "backend/services"
    "backend/ws"
    "github.com/gin-gonic/gin"
)

type ProductHandler struct{ svc *services.ProductService }

func NewProductHandler(s *services.ProductService) *ProductHandler { return &ProductHandler{svc: s} }

func (h *ProductHandler) List(c *gin.Context) {
	q := c.Query("q")
	limit := 50
	offset := 0
	if l := c.Query("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil {
			limit = v
		}
	}
	if o := c.Query("offset"); o != "" {
		if v, err := strconv.Atoi(o); err == nil {
			offset = v
		}
	}
	var filter repositories.ProductFilter
	filter.Query = q
	filter.Limit = limit
	filter.Offset = offset
	filter.CategorySlug = c.Query("category_slug")
	if cat := c.Query("category_id"); cat != "" {
		if v, err := strconv.Atoi(cat); err == nil {
			filter.CategoryID = &v
		}
	}
	if minp := c.Query("min_price_cents"); minp != "" {
		if v, err := strconv.ParseInt(minp, 10, 64); err == nil {
			filter.MinPriceCents = &v
		}
	}
	if maxp := c.Query("max_price_cents"); maxp != "" {
		if v, err := strconv.ParseInt(maxp, 10, 64); err == nil {
			filter.MaxPriceCents = &v
		}
	}
	if ref := c.Query("is_refurbished"); ref != "" {
		if v, err := strconv.ParseBool(ref); err == nil {
			filter.IsRefurbished = &v
		}
	}
	if w := c.Query("warranty_months"); w != "" {
		if v, err := strconv.Atoi(w); err == nil {
			filter.WarrantyMonths = &v
		}
	}
	filter.Sort = c.Query("sort")
	products, err := h.svc.List(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// Return direct array or wrapped data for compatibility
	c.JSON(http.StatusOK, products)
}

func (h *ProductHandler) Get(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	detail, err := h.svc.GetProductDetail(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}
	c.JSON(http.StatusOK, detail)
}

type productCreateReq struct {
	SKU            string `json:"sku" binding:"required"`
	Name           string `json:"name" binding:"required"`
	Description    string `json:"description"`
	CategoryID     *int   `json:"category_id"`
	IsRefurbished  bool   `json:"is_refurbished"`
	WarrantyMonths int    `json:"warranty_months"`
	PriceCents     int64  `json:"price_cents"`
	Currency       string `json:"currency"`
	Inventory      int    `json:"inventory"`
}

func (h *ProductHandler) Create(c *gin.Context) {
	var req productCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Currency == "" {
		req.Currency = "USD"
	}
	p := &models.Product{
		SKU:            req.SKU,
		Name:           req.Name,
		Description:    req.Description,
		CategoryID:     req.CategoryID,
		IsRefurbished:  req.IsRefurbished,
		WarrantyMonths: req.WarrantyMonths,
		PriceCents:     req.PriceCents,
		Currency:       req.Currency,
		Inventory:      req.Inventory,
	}
	created, err := h.svc.Create(p)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, created)
}

func (h *ProductHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req productCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Currency == "" {
		req.Currency = "USD"
	}
	p := &models.Product{
		ID:             id,
		SKU:            req.SKU,
		Name:           req.Name,
		Description:    req.Description,
		CategoryID:     req.CategoryID,
		IsRefurbished:  req.IsRefurbished,
		WarrantyMonths: req.WarrantyMonths,
		PriceCents:     req.PriceCents,
		Currency:       req.Currency,
	}
	updated, err := h.svc.Update(p)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, updated)
}

func (h *ProductHandler) AdjustInventory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req struct {
		Delta     int  `json:"delta"`
		Inventory *int `json:"inventory"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	delta := req.Delta
	if req.Inventory != nil {
		// Calculate delta relative to current
		current, err := h.svc.GetByID(id)
		if err == nil {
			delta = *req.Inventory - current.Inventory
		}
	}
	if err := h.svc.AdjustInventory(id, delta); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	updatedProd, _ := h.svc.GetByID(id)
	newQty := 0
	if updatedProd != nil {
		newQty = updatedProd.Inventory
	}
	ws.BroadcastEvent("INVENTORY_UPDATED", gin.H{
		"product_id": id,
		"inventory":  newQty,
		"delta":      delta,
	})
	c.JSON(http.StatusOK, gin.H{"ok": true, "inventory": newQty, "message": "inventory updated"})
}

func (h *ProductHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.svc.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *ProductHandler) AddReview(c *gin.Context) {
	userID, ok := getUserIDFromCtx(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user context"})
		return
	}
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}
	var req struct {
		Rating     int    `json:"rating"`
		ReviewText string `json:"review_text"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	rev := &models.ProductReview{
		ProductID:  id,
		UserID:     userID,
		Rating:     req.Rating,
		ReviewText: req.ReviewText,
	}
	_ = h.svc.AddReview(rev)
	ws.BroadcastEvent("REVIEW_ADDED", gin.H{
		"product_id":  id,
		"rating":      req.Rating,
		"review_text": req.ReviewText,
		"user_id":     userID,
	})
	c.JSON(http.StatusOK, gin.H{"ok": true, "message": "review submitted successfully"})
}

func (h *ProductHandler) GetReviews(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product id"})
		return
	}
	reviews, err := h.svc.GetReviews(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, reviews)
}

func (h *ProductHandler) ListAllReviews(c *gin.Context) {
	reviews, err := h.svc.GetAllReviews()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, reviews)
}

func (h *ProductHandler) DeleteReview(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review id"})
		return
	}
	if err := h.svc.DeleteReview(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "message": "review deleted successfully"})
}

func (h *ProductHandler) VoteHelpful(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review id"})
		return
	}
	if err := h.svc.VoteHelpfulReview(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "message": "helpful vote recorded"})
}

