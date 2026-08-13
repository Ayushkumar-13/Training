package repositories

import (
    "database/sql"

    "backend/models"
)

type CartRepository struct{ db *sql.DB }

func NewCartRepository(db *sql.DB) *CartRepository { return &CartRepository{db: db} }

func (r *CartRepository) GetOrCreateCart(userID int) (*models.Cart, error) {
    var cartID int
    err := r.db.QueryRow(`SELECT id FROM carts WHERE user_id = $1`, userID).Scan(&cartID)
    if err != nil {
        if err == sql.ErrNoRows {
            err = r.db.QueryRow(`INSERT INTO carts (user_id) VALUES ($1) RETURNING id`, userID).Scan(&cartID)
            if err != nil {
                return nil, err
            }
        } else {
            return nil, err
        }
    }
    return &models.Cart{ID: cartID, UserID: userID}, nil
}

func (r *CartRepository) GetItems(cartID int) ([]models.CartItem, error) {
    rows, err := r.db.Query(`SELECT id, cart_id, product_id, quantity, unit_price_cents FROM cart_items WHERE cart_id = $1`, cartID)
    if err != nil { return nil, err }
    defer rows.Close()
    var out []models.CartItem
    for rows.Next() {
        var it models.CartItem
        if err := rows.Scan(&it.ID, &it.CartID, &it.ProductID, &it.Quantity, &it.UnitPriceCents); err != nil { return nil, err }
        out = append(out, it)
    }
    return out, nil
}

func (r *CartRepository) AddOrUpdateItem(cartID, productID, quantity int, unitPrice int64) error {
    // try update
    res, err := r.db.Exec(`UPDATE cart_items SET quantity = quantity + $1, unit_price_cents=$2 WHERE cart_id=$3 AND product_id=$4`, quantity, unitPrice, cartID, productID)
    if err != nil { return err }
    n, _ := res.RowsAffected()
    if n == 0 {
        _, err = r.db.Exec(`INSERT INTO cart_items (cart_id, product_id, quantity, unit_price_cents) VALUES ($1,$2,$3,$4)`, cartID, productID, quantity, unitPrice)
        if err != nil { return err }
    }
    return nil
}

func (r *CartRepository) RemoveItem(cartID, productID int) error {
    _, err := r.db.Exec(`DELETE FROM cart_items WHERE cart_id=$1 AND product_id=$2`, cartID, productID)
    return err
}
