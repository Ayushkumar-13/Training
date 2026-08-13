package repositories

import (
    "database/sql"
    "backend/models"
    "fmt"
)

type OrderRepository struct{ db *sql.DB }

func NewOrderRepository(db *sql.DB) *OrderRepository { return &OrderRepository{db: db} }

func (r *OrderRepository) CreateOrder(tx *sql.Tx, o *models.Order) (int, error) {
    var id int
    err := tx.QueryRow(
        `INSERT INTO orders (user_id, total_cents, status) VALUES ($1,$2,$3) RETURNING id`,
        o.UserID, o.TotalCents, o.Status,
    ).Scan(&id)
    if err != nil { return 0, fmt.Errorf("create order: %w", err) }
    return id, nil
}

func (r *OrderRepository) CreateOrderItem(tx *sql.Tx, it *models.OrderItem) error {
    _, err := tx.Exec(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_cents) VALUES ($1,$2,$3,$4)`,
        it.OrderID, it.ProductID, it.Quantity, it.UnitCents,
    )
    if err != nil { return fmt.Errorf("create order item: %w", err) }
    return nil
}

func (r *OrderRepository) GetInventoryForUpdate(tx *sql.Tx, productID int) (int, error) {
    var qty int
    err := tx.QueryRow(`SELECT quantity FROM inventory WHERE product_id=$1 FOR UPDATE`, productID).Scan(&qty)
    if err != nil { return 0, fmt.Errorf("get inventory: %w", err) }
    return qty, nil
}

func (r *OrderRepository) DecrementInventory(tx *sql.Tx, productID int, amount int) error {
    _, err := tx.Exec(`UPDATE inventory SET quantity = quantity - $1 WHERE product_id=$2`, amount, productID)
    if err != nil { return fmt.Errorf("decrement inventory: %w", err) }
    return nil
}
