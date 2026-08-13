package services

import (
    "regexp"
    "testing"

    "backend/repositories"

    "github.com/DATA-DOG/go-sqlmock"
)

func TestOrderService_PlaceOrder(t *testing.T) {
    db, mock, err := sqlmock.New()
    if err != nil { t.Fatalf("sqlmock new: %v", err) }
    defer db.Close()

    // prepare repositories and services
    orderRepo := repositories.NewOrderRepository(db)
    cartRepo := repositories.NewCartRepository(db)
    cartSvc := NewCartService(cartRepo, nil)
    orderSvc := NewOrderService(db, orderRepo, cartSvc)

    userID := 42

    // sample cart and items already in DB will be read via cartRepo.GetOrCreateCart and GetItems
    // but for transaction, OrderService will lock inventory and perform updates/inserts

    // Expect initial cart lookups before transaction
    mock.ExpectQuery("SELECT id FROM carts WHERE user_id").WithArgs(userID).WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(7))
    mock.ExpectQuery(regexp.QuoteMeta("SELECT id, cart_id, product_id, quantity, unit_price_cents FROM cart_items WHERE cart_id = $1")).WithArgs(7).WillReturnRows(sqlmock.NewRows([]string{"id","cart_id","product_id","quantity","unit_price_cents"}).AddRow(1,7,10,2,int64(1000)))

    mock.ExpectBegin()

    // Expect inventory lock for product 10 returning quantity 5
    mock.ExpectQuery(regexp.QuoteMeta("SELECT quantity FROM inventory WHERE product_id=$1 FOR UPDATE")).WithArgs(10).WillReturnRows(sqlmock.NewRows([]string{"quantity"}).AddRow(5))
    // Expect decrement
    mock.ExpectExec(regexp.QuoteMeta("UPDATE inventory SET quantity = quantity - $1 WHERE product_id=$2")).WithArgs(2, 10).WillReturnResult(sqlmock.NewResult(0,1))

    // Expect order insert
    mock.ExpectQuery(regexp.QuoteMeta("INSERT INTO orders (user_id, total_cents, status) VALUES ($1,$2,$3) RETURNING id")).WithArgs(userID, int64(2000), "paid").WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(123))
    // Expect order_items insert
    mock.ExpectExec(regexp.QuoteMeta("INSERT INTO order_items (order_id, product_id, quantity, unit_cents) VALUES ($1,$2,$3,$4)")).WithArgs(123, 10, 2, int64(1000)).WillReturnResult(sqlmock.NewResult(0,1))

    // Expect ClearCartTx: select cart id then delete items
    mock.ExpectQuery("SELECT id FROM carts WHERE user_id").WithArgs(userID).WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(7))
    mock.ExpectExec(regexp.QuoteMeta("DELETE FROM cart_items WHERE cart_id=$1")).WithArgs(7).WillReturnResult(sqlmock.NewResult(0,1))

    mock.ExpectCommit()

    // (GetOrCreateCart and GetItems expectations already set above)
    oid, err := orderSvc.PlaceOrder(userID)
    if err != nil { t.Fatalf("PlaceOrder error: %v", err) }
    if oid != 123 { t.Fatalf("expected order id 123, got %d", oid) }

    if err := mock.ExpectationsWereMet(); err != nil { t.Fatalf("unmet expectations: %v", err) }
}
