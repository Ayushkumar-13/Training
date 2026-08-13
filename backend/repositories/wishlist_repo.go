package repositories

import (
    "database/sql"

    "backend/models"
)

type WishlistRepository struct{ db *sql.DB }

func NewWishlistRepository(db *sql.DB) *WishlistRepository { return &WishlistRepository{db: db} }

func (r *WishlistRepository) GetOrCreateWishlist(userID int) (*models.Wishlist, error) {
    var id int
    err := r.db.QueryRow(`SELECT id FROM wishlists WHERE user_id=$1`, userID).Scan(&id)
    if err != nil {
        if err == sql.ErrNoRows {
            err = r.db.QueryRow(`INSERT INTO wishlists (user_id) VALUES ($1) RETURNING id`, userID).Scan(&id)
            if err != nil { return nil, err }
        } else { return nil, err }
    }
    return &models.Wishlist{ID: id, UserID: userID}, nil
}

func (r *WishlistRepository) AddItem(wishlistID, productID int) error {
    _, err := r.db.Exec(`INSERT INTO wishlist_items (wishlist_id, product_id) VALUES ($1,$2) ON CONFLICT (wishlist_id, product_id) DO NOTHING`, wishlistID, productID)
    return err
}

func (r *WishlistRepository) RemoveItem(wishlistID, productID int) error {
    _, err := r.db.Exec(`DELETE FROM wishlist_items WHERE wishlist_id=$1 AND product_id=$2`, wishlistID, productID)
    return err
}

func (r *WishlistRepository) ListItems(wishlistID int) ([]models.Product, error) {
    rows, err := r.db.Query(`SELECT p.id, p.sku, p.name, p.description, p.category_id, p.is_refurbished, p.warranty_months, p.price_cents, p.currency, p.created_at FROM products p JOIN wishlist_items wi ON p.id = wi.product_id WHERE wi.wishlist_id = $1`, wishlistID)
    if err != nil { return nil, err }
    defer rows.Close()
    var out []models.Product
    for rows.Next() {
        var p models.Product
        if err := rows.Scan(&p.ID, &p.SKU, &p.Name, &p.Description, &p.CategoryID, &p.IsRefurbished, &p.WarrantyMonths, &p.PriceCents, &p.Currency, &p.CreatedAt); err != nil { return nil, err }
        out = append(out, p)
    }
    return out, nil
}
