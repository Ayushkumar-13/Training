package services

import (
    "database/sql"
    "backend/models"
    "backend/repositories"
    "fmt"
)

type OrderService struct{
    db *sql.DB
    orderRepo *repositories.OrderRepository
    cartSvc *CartService
}

func NewOrderService(db *sql.DB, orepo *repositories.OrderRepository, cs *CartService) *OrderService {
    return &OrderService{db: db, orderRepo: orepo, cartSvc: cs}
}

// PlaceOrder creates an order from the user's cart, decrements inventory, and clears the cart.
func (s *OrderService) PlaceOrder(userID int) (int, error) {
    // get cart items
    _, items, err := s.cartSvc.GetCart(userID)
    if err != nil { return 0, fmt.Errorf("fetch cart: %w", err) }
    if len(items) == 0 { return 0, fmt.Errorf("cart is empty") }

    tx, err := s.db.Begin()
    if err != nil { return 0, fmt.Errorf("begin tx: %w", err) }
    defer func(){ if err != nil { _ = tx.Rollback() } }()

    var total int64
    for _, it := range items {
        // lock and check inventory
        qty, err := s.orderRepo.GetInventoryForUpdate(tx, it.ProductID)
        if err != nil { return 0, fmt.Errorf("inventory lock: %w", err) }
        if qty < it.Quantity { return 0, fmt.Errorf("insufficient inventory for product %d", it.ProductID) }
        // decrement
        if err := s.orderRepo.DecrementInventory(tx, it.ProductID, it.Quantity); err != nil { return 0, err }
        total += int64(it.Quantity) * it.UnitPriceCents
    }
    order := &models.Order{UserID: userID, TotalCents: total, Status: "paid"}
    oid, err := s.orderRepo.CreateOrder(tx, order)
    if err != nil { return 0, err }
    for _, it := range items {
        oit := &models.OrderItem{OrderID: oid, ProductID: it.ProductID, Quantity: it.Quantity, UnitCents: it.UnitPriceCents}
        if err := s.orderRepo.CreateOrderItem(tx, oit); err != nil { return 0, err }
    }

    // clear cart (repository handles user cart items)
    if err := s.cartSvc.ClearCartTx(tx, userID); err != nil { return 0, fmt.Errorf("clear cart: %w", err) }

    if err := tx.Commit(); err != nil { return 0, fmt.Errorf("commit tx: %w", err) }
    return oid, nil
}
