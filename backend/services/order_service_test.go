package services

import (
	"regexp"
	"testing"

	"backend/models"
	"backend/repositories"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestOrderService_PlaceOrder(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock new: %v", err)
	}
	defer db.Close()

	orderRepo := repositories.NewOrderRepository(db)
	cartRepo := repositories.NewCartRepository(db)
	cartSvc := NewCartService(cartRepo, nil)
	orderSvc := NewOrderService(db, orderRepo, cartSvc)

	userID := 42

	// Expect cart lookup
	mock.ExpectQuery("SELECT id FROM carts WHERE user_id").WithArgs(userID).WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(7))
	cartItemCols := []string{"id", "cart_id", "product_id", "name", "sku", "url", "quantity", "unit_price_cents"}
	mock.ExpectQuery("SELECT ci.id, ci.cart_id, ci.product_id, p.name, p.sku").WithArgs(7).WillReturnRows(
		sqlmock.NewRows(cartItemCols).AddRow(1, 7, 10, "Test Stethoscope", "ST-001", "", 2, int64(1000)),
	)

	mock.ExpectBegin()

	// Expect inventory lock
	mock.ExpectQuery(regexp.QuoteMeta("SELECT quantity FROM inventory WHERE product_id=$1 FOR UPDATE")).WithArgs(10).WillReturnRows(sqlmock.NewRows([]string{"quantity"}).AddRow(5))
	// Expect inventory decrement
	mock.ExpectExec(regexp.QuoteMeta("UPDATE inventory SET quantity = quantity - $1 WHERE product_id=$2")).WithArgs(2, 10).WillReturnResult(sqlmock.NewResult(0, 1))

	// Expect order insert
	mock.ExpectQuery(regexp.QuoteMeta("INSERT INTO orders (user_id, total_cents, status, shipping_address, city, state, postal_code, phone, payment_method) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id")).WithArgs(userID, int64(2000), "pending", "", "", "", "", "", "online").WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(123))
	// Expect order_items insert
	mock.ExpectExec(regexp.QuoteMeta("INSERT INTO order_items (order_id, product_id, quantity, unit_cents) VALUES ($1,$2,$3,$4)")).WithArgs(123, 10, 2, int64(1000)).WillReturnResult(sqlmock.NewResult(0, 1))

	// Expect payment record insert
	mock.ExpectExec(regexp.QuoteMeta("INSERT INTO payments (order_id, provider, provider_payment_id, status, amount_cents) VALUES ($1,$2,$3,$4,$5)")).WithArgs(123, "online", "PAY-online-123-42", "completed", int64(2000)).WillReturnResult(sqlmock.NewResult(0, 1))

	// Expect ClearCartTx: select cart id then delete items
	mock.ExpectQuery("SELECT id FROM carts WHERE user_id").WithArgs(userID).WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(7))
	mock.ExpectExec(regexp.QuoteMeta("DELETE FROM cart_items WHERE cart_id=$1")).WithArgs(7).WillReturnResult(sqlmock.NewResult(0, 1))

	mock.ExpectCommit()

	req := models.CreateOrderRequest{PaymentMethod: "online"}
	oid, err := orderSvc.PlaceOrder(userID, req)
	if err != nil {
		t.Fatalf("PlaceOrder error: %v", err)
	}
	if oid != 123 {
		t.Fatalf("expected order id 123, got %d", oid)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
