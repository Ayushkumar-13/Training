package handlers

import (
    "net/http"
    "strconv"

    "backend/models"
    "backend/repositories"
    "backend/services"
    "github.com/gin-gonic/gin"
)

type ProductHandler struct{ svc *services.ProductService }

func NewProductHandler(s *services.ProductService) *ProductHandler { return &ProductHandler{svc: s} }

func (h *ProductHandler) List(c *gin.Context) {
    q := c.Query("q")
    limit := 20
    offset := 0
    if l := c.Query("limit"); l != "" {
        if v, err := strconv.Atoi(l); err == nil { limit = v }
    }
    if o := c.Query("offset"); o != "" {
        if v, err := strconv.Atoi(o); err == nil { offset = v }
    }
    var filter repositories.ProductFilter
    filter.Query = q
    filter.Limit = limit
    filter.Offset = offset
    if cat := c.Query("category_id"); cat != "" {
        if v, err := strconv.Atoi(cat); err == nil { filter.CategoryID = &v }
    }
    if minp := c.Query("min_price_cents"); minp != "" {
        if v, err := strconv.ParseInt(minp, 10, 64); err == nil { filter.MinPriceCents = &v }
    }
    if maxp := c.Query("max_price_cents"); maxp != "" {
        if v, err := strconv.ParseInt(maxp, 10, 64); err == nil { filter.MaxPriceCents = &v }
    }
    if ref := c.Query("is_refurbished"); ref != "" {
        if v, err := strconv.ParseBool(ref); err == nil { filter.IsRefurbished = &v }
    }
    if w := c.Query("warranty_months"); w != "" {
        if v, err := strconv.Atoi(w); err == nil { filter.WarrantyMonths = &v }
    }
    filter.Sort = c.Query("sort")
    products, err := h.svc.List(filter)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"data": products})
}

func (h *ProductHandler) Get(c *gin.Context) {
    idStr := c.Param("id")
    id, err := strconv.Atoi(idStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
        return
    }
    p, err := h.svc.GetByID(id)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"data": p})
}

type productCreateReq struct {
    SKU            string `json:"sku" binding:"required"`
    Name           string `json:"name" binding:"required"`
    Description    string `json:"description"`
    CategoryID     int    `json:"category_id"`
    IsRefurbished  bool   `json:"is_refurbished"`
    WarrantyMonths int    `json:"warranty_months"`
    PriceCents     int64  `json:"price_cents" binding:"required,min=0"`
    Currency       string `json:"currency" binding:"required"`
}

func (h *ProductHandler) Create(c *gin.Context) {
    var req productCreateReq
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    p := &models.Product{
        SKU: req.SKU,
        Name: req.Name,
        Description: req.Description,
        CategoryID: req.CategoryID,
        IsRefurbished: req.IsRefurbished,
        WarrantyMonths: req.WarrantyMonths,
        PriceCents: req.PriceCents,
        Currency: req.Currency,
    }
    created, err := h.svc.Create(p)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusCreated, gin.H{"data": created})
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
    p := &models.Product{
        ID: id,
        SKU: req.SKU,
        Name: req.Name,
        Description: req.Description,
        CategoryID: req.CategoryID,
        IsRefurbished: req.IsRefurbished,
        WarrantyMonths: req.WarrantyMonths,
        PriceCents: req.PriceCents,
        Currency: req.Currency,
    }
    updated, err := h.svc.Update(p)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"data": updated})
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
    c.JSON(http.StatusNoContent, nil)
}
