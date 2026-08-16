package models

import "time"

type Cart struct {
	ID     int        `json:"id"`
	UserID int        `json:"user_id"`
	Items  []CartItem `json:"items"`
}

type CartItem struct {
	ID             int    `json:"id"`
	CartID         int    `json:"cart_id"`
	ProductID      int    `json:"product_id"`
	ProductName    string `json:"product_name,omitempty"`
	ProductSKU     string `json:"product_sku,omitempty"`
	ProductImage   string `json:"product_image,omitempty"`
	Quantity       int    `json:"quantity"`
	UnitPriceCents int64  `json:"unit_price_cents"`
}

type Wishlist struct {
	ID     int            `json:"id"`
	UserID int            `json:"user_id"`
	Items  []WishlistItem `json:"items"`
}

type WishlistItem struct {
	ID             int       `json:"id"`
	WishlistID     int       `json:"wishlist_id"`
	ProductID      int       `json:"product_id"`
	ProductName    string    `json:"product_name,omitempty"`
	ProductSKU     string    `json:"product_sku,omitempty"`
	PriceCents     int64     `json:"price_cents,omitempty"`
	IsRefurbished  bool      `json:"is_refurbished,omitempty"`
	WarrantyMonths int       `json:"warranty_months,omitempty"`
	AddedAt        time.Time `json:"added_at"`
}

