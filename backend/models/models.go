package models

import "time"

type User struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	FullName  string    `json:"full_name"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type Category struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Slug     string `json:"slug"`
	ParentID *int   `json:"parent_id,omitempty"`
}

type Product struct {
	ID             int       `json:"id"`
	SKU            string    `json:"sku"`
	Name           string    `json:"name"`
	Description    string    `json:"description"`
	CategoryID     *int      `json:"category_id"`
	CategoryName   string    `json:"category_name,omitempty"`
	CategorySlug   string    `json:"category_slug,omitempty"`
	IsRefurbished  bool      `json:"is_refurbished"`
	WarrantyMonths int       `json:"warranty_months"`
	PriceCents     int64     `json:"price_cents"`
	Currency       string    `json:"currency"`
	Inventory      int       `json:"inventory"`
	CreatedAt      time.Time `json:"created_at"`
}

type ProductSpecification struct {
	ID        int    `json:"id"`
	ProductID int    `json:"product_id"`
	Key       string `json:"key"`
	Value     string `json:"value"`
}

type ProductImage struct {
	ID        int    `json:"id"`
	ProductID int    `json:"product_id"`
	URL       string `json:"url"`
	Alt       string `json:"alt"`
	Ordering  int    `json:"ordering"`
}

type ProductDetail struct {
	Product
	Specifications []ProductSpecification `json:"specifications"`
	Images         []ProductImage         `json:"images"`
}

type Inventory struct {
	ID        int       `json:"id"`
	ProductID int       `json:"product_id"`
	Quantity  int       `json:"quantity"`
	Location  string    `json:"location"`
	UpdatedAt time.Time `json:"updated_at"`
}

type DashboardStats struct {
	TotalProducts   int   `json:"total_products"`
	TotalOrders     int   `json:"total_orders"`
	TotalRevenue    int64 `json:"total_revenue_cents"`
	PendingOrders   int   `json:"pending_orders"`
	LowStockItems   int   `json:"low_stock_items"`
}

type ProductReview struct {
	ID                 int       `json:"id"`
	ProductID          int       `json:"product_id"`
	ProductName        string    `json:"product_name,omitempty"`
	UserID             int       `json:"user_id"`
	UserEmail          string    `json:"user_email,omitempty"`
	Rating             int       `json:"rating"`
	ReviewText         string    `json:"review_text"`
	IsVerifiedPurchase bool      `json:"is_verified_purchase"`
	HelpfulCount       int       `json:"helpful_count"`
	CreatedAt          time.Time `json:"created_at"`
}
