package repositories

import (
	"database/sql"
	"fmt"

	"backend/models"
)

type OrderRepository struct{ db *sql.DB }

func NewOrderRepository(db *sql.DB) *OrderRepository { return &OrderRepository{db: db} }

func (r *OrderRepository) CreateOrder(tx *sql.Tx, o *models.Order) (int, error) {
	var id int
	err := tx.QueryRow(
		`INSERT INTO orders (user_id, total_cents, status, shipping_address, city, state, postal_code, phone, payment_method, payment_receipt_no) 
		 VALUES ($1, $2, $3::order_status, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
		o.UserID, o.TotalCents, o.Status, o.ShippingAddress, o.City, o.State, o.PostalCode, o.Phone, o.PaymentMethod, o.PaymentReceiptNo,
	).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("create order: %w", err)
	}
	return id, nil
}

func (r *OrderRepository) CreateOrderItem(tx *sql.Tx, it *models.OrderItem) error {
	_, err := tx.Exec(
		`INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents) VALUES ($1,$2,$3,$4)`,
		it.OrderID, it.ProductID, it.Quantity, it.UnitCents,
	)
	if err != nil {
		return fmt.Errorf("create order item: %w", err)
	}
	return nil
}

func (r *OrderRepository) GetInventoryForUpdate(tx *sql.Tx, productID int) (int, error) {
	var qty int
	err := tx.QueryRow(`SELECT quantity FROM inventory WHERE product_id=$1 FOR UPDATE`, productID).Scan(&qty)
	if err != nil {
		if err == sql.ErrNoRows {
			// Auto-seed inventory row if missing
			_, _ = tx.Exec(`INSERT INTO inventory (product_id, quantity) VALUES ($1, 50) ON CONFLICT (product_id) DO NOTHING`, productID)
			return 50, nil
		}
		return 0, fmt.Errorf("get inventory: %w", err)
	}
	return qty, nil
}

func (r *OrderRepository) DecrementInventory(tx *sql.Tx, productID int, amount int) error {
	_, err := tx.Exec(`UPDATE inventory SET quantity = GREATEST(0, quantity - $1) WHERE product_id=$2`, amount, productID)
	if err != nil {
		return fmt.Errorf("decrement inventory: %w", err)
	}
	return nil
}

func (r *OrderRepository) CreatePaymentRecord(tx *sql.Tx, p *models.Payment) error {
	_, err := tx.Exec(
		`INSERT INTO payments (order_id, provider, provider_payment_id, status, amount_cents) VALUES ($1,$2,$3,$4,$5)`,
		p.OrderID, p.Provider, p.ProviderPaymentID, p.Status, p.AmountCents,
	)
	if err != nil {
		return fmt.Errorf("create payment record: %w", err)
	}
	return nil
}

func (r *OrderRepository) GetOrdersByUserID(userID int) ([]models.Order, error) {
	rows, err := r.db.Query(`
		SELECT id, user_id, total_cents, currency, status, 
		       coalesce(shipping_address,''), coalesce(city,''), coalesce(state,''), coalesce(postal_code,''), coalesce(phone,''), coalesce(payment_method,'online'), coalesce(payment_receipt_no, ''), coalesce(payment_status, 'paid'), coalesce(refund_status, 'none'), coalesce(refund_id, ''), refunded_at, coalesce(cancellation_reason, ''),
		       coalesce(return_status, 'none'), coalesce(return_reason, ''), returned_at,
		       created_at, updated_at 
		FROM orders WHERE user_id = $1 ORDER BY id DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(
			&o.ID, &o.UserID, &o.TotalCents, &o.Currency, &o.Status,
			&o.ShippingAddress, &o.City, &o.State, &o.PostalCode, &o.Phone, &o.PaymentMethod, &o.PaymentReceiptNo, &o.PaymentStatus, &o.RefundStatus, &o.RefundID, &o.RefundedAt, &o.CancellationReason,
			&o.ReturnStatus, &o.ReturnReason, &o.ReturnedAt,
			&o.CreatedAt, &o.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items, _ := r.getOrderItems(o.ID)
		o.Items = items
		orders = append(orders, o)
	}
	return orders, nil
}

func (r *OrderRepository) GetAllOrders() ([]models.Order, error) {
	rows, err := r.db.Query(`
		SELECT o.id, o.user_id, u.email, o.total_cents, o.currency, o.status,
		       coalesce(o.shipping_address,''), coalesce(o.city,''), coalesce(o.state,''), coalesce(o.postal_code,''), coalesce(o.phone,''), coalesce(o.payment_method,'online'), coalesce(o.payment_receipt_no, ''), coalesce(o.payment_status, 'paid'), coalesce(o.refund_status, 'none'), coalesce(o.refund_id, ''), o.refunded_at, coalesce(o.cancellation_reason, ''),
		       coalesce(o.return_status, 'none'), coalesce(o.return_reason, ''), o.returned_at,
		       o.created_at, o.updated_at
		FROM orders o
		LEFT JOIN users u ON o.user_id = u.id
		ORDER BY o.id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(
			&o.ID, &o.UserID, &o.UserEmail, &o.TotalCents, &o.Currency, &o.Status,
			&o.ShippingAddress, &o.City, &o.State, &o.PostalCode, &o.Phone, &o.PaymentMethod, &o.PaymentReceiptNo, &o.PaymentStatus, &o.RefundStatus, &o.RefundID, &o.RefundedAt, &o.CancellationReason,
			&o.ReturnStatus, &o.ReturnReason, &o.ReturnedAt,
			&o.CreatedAt, &o.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items, _ := r.getOrderItems(o.ID)
		o.Items = items
		orders = append(orders, o)
	}
	return orders, nil
}

func (r *OrderRepository) GetOrderByID(orderID int) (*models.Order, error) {
	var o models.Order
	err := r.db.QueryRow(`
		SELECT o.id, o.user_id, u.email, o.total_cents, o.currency, o.status,
		       coalesce(o.shipping_address,''), coalesce(o.city,''), coalesce(o.state,''), coalesce(o.postal_code,''), coalesce(o.phone,''), coalesce(o.payment_method,'online'), coalesce(o.payment_receipt_no, ''), coalesce(o.payment_status, 'paid'), coalesce(o.refund_status, 'none'), coalesce(o.refund_id, ''), o.refunded_at, coalesce(o.cancellation_reason, ''),
		       coalesce(o.return_status, 'none'), coalesce(o.return_reason, ''), o.returned_at,
		       o.created_at, o.updated_at
		FROM orders o
		LEFT JOIN users u ON o.user_id = u.id
		WHERE o.id = $1`, orderID).Scan(
		&o.ID, &o.UserID, &o.UserEmail, &o.TotalCents, &o.Currency, &o.Status,
		&o.ShippingAddress, &o.City, &o.State, &o.PostalCode, &o.Phone, &o.PaymentMethod, &o.PaymentReceiptNo, &o.PaymentStatus, &o.RefundStatus, &o.RefundID, &o.RefundedAt, &o.CancellationReason,
		&o.ReturnStatus, &o.ReturnReason, &o.ReturnedAt,
		&o.CreatedAt, &o.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	items, _ := r.getOrderItems(o.ID)
	o.Items = items
	return &o, nil
}

func (r *OrderRepository) ProcessOrderRefund(orderID int, refundID string) error {
	_, err := r.db.Exec(`
		UPDATE orders 
		SET status = 'cancelled', payment_status = 'refunded', refund_status = 'refund_completed', refund_id = $1, refunded_at = now(), updated_at = now() 
		WHERE id = $2`, refundID, orderID)
	return err
}

func (r *OrderRepository) getOrderItems(orderID int) ([]models.OrderItem, error) {
	rows, err := r.db.Query(`
		SELECT oi.id, oi.order_id, oi.product_id, coalesce(p.name, 'Clinical Equipment System'), coalesce(p.sku, 'MED-EQ'), coalesce(p.image, ''), oi.quantity, oi.unit_price_cents
		FROM order_items oi
		LEFT JOIN products p ON oi.product_id = p.id
		WHERE oi.order_id = $1`, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.OrderItem
	for rows.Next() {
		var item models.OrderItem
		if err := rows.Scan(&item.ID, &item.OrderID, &item.ProductID, &item.ProductName, &item.ProductSKU, &item.ProductImage, &item.Quantity, &item.UnitCents); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

func (r *OrderRepository) UpdateOrderStatus(orderID int, status string) error {
	_, err := r.db.Exec(`UPDATE orders SET status = $1::order_status, updated_at = now() WHERE id = $2`, status, orderID)
	return err
}

func (r *OrderRepository) CancelOrderWithReason(orderID int, reason string) error {
	_, err := r.db.Exec(`UPDATE orders SET status = 'cancelled'::order_status, cancellation_reason = $1, updated_at = now() WHERE id = $2`, reason, orderID)
	return err
}

func (r *OrderRepository) InsertCancellationAudit(orderID int, userID int, reason string) error {
	_, err := r.db.Exec(`INSERT INTO order_cancellation_audits (order_id, user_id, reason) VALUES ($1, $2, $3)`, orderID, userID, reason)
	return err
}

func (r *OrderRepository) RequestOrderReturn(orderID int, reason string) error {
	_, err := r.db.Exec(`UPDATE orders SET return_status = 'requested', return_reason = $1, returned_at = now(), updated_at = now() WHERE id = $2`, reason, orderID)
	return err
}

func (r *OrderRepository) InsertReturnAudit(orderID int, userID int, reason string, status string) error {
	_, err := r.db.Exec(`INSERT INTO order_return_audits (order_id, user_id, reason, status) VALUES ($1, $2, $3, $4)`, orderID, userID, reason, status)
	return err
}

func (r *OrderRepository) UpdateOrderReturnStatus(orderID int, returnStatus string) error {
	_, err := r.db.Exec(`UPDATE orders SET return_status = $1, updated_at = now() WHERE id = $2`, returnStatus, orderID)
	return err
}
