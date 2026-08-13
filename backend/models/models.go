package models

import "time"

type User struct {
    ID        int       `json:"id"`
    Email     string    `json:"email"`
    FullName  string    `json:"full_name"`
    Role      string    `json:"role"`
    CreatedAt time.Time `json:"created_at"`
}

type Product struct {
    ID             int       `json:"id"`
    SKU            string    `json:"sku"`
    Name           string    `json:"name"`
    Description    string    `json:"description"`
    CategoryID     int       `json:"category_id"`
    IsRefurbished  bool      `json:"is_refurbished"`
    WarrantyMonths int       `json:"warranty_months"`
    PriceCents     int64     `json:"price_cents"`
    Currency       string    `json:"currency"`
    CreatedAt      time.Time `json:"created_at"`
}
