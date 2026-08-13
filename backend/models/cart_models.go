package models

type Cart struct {
    ID     int `json:"id"`
    UserID int `json:"user_id"`
}

type CartItem struct {
    ID            int   `json:"id"`
    CartID        int   `json:"cart_id"`
    ProductID     int   `json:"product_id"`
    Quantity      int   `json:"quantity"`
    UnitPriceCents int64 `json:"unit_price_cents"`
}

type Wishlist struct {
    ID     int `json:"id"`
    UserID int `json:"user_id"`
}
