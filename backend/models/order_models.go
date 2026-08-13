package models

import "time"

type Order struct {
    ID        int       `json:"id"`
    UserID    int       `json:"user_id"`
    TotalCents int64    `json:"total_cents"`
    Status    string    `json:"status"`
    CreatedAt time.Time `json:"created_at"`
}

type OrderItem struct {
    ID        int `json:"id"`
    OrderID   int `json:"order_id"`
    ProductID int `json:"product_id"`
    Quantity  int `json:"quantity"`
    UnitCents int64 `json:"unit_cents"`
}
