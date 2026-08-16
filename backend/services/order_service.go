package services

import (
	"backend/models"
	"backend/repositories"
	"database/sql"
	"fmt"
)

type OrderService struct {
	db        *sql.DB
	orderRepo *repositories.OrderRepository
	cartSvc   *CartService
}

func NewOrderService(db *sql.DB, orepo *repositories.OrderRepository, cs *CartService) *OrderService {
	return &OrderService{db: db, orderRepo: orepo, cartSvc: cs}
}

// PlaceOrder creates an order from the user's cart, decrements inventory, creates payment record, and clears the cart.
func (s *OrderService) PlaceOrder(userID int, req models.CreateOrderRequest) (int, error) {
	// get cart items
	_, items, err := s.cartSvc.GetCart(userID)
	if err != nil {
		return 0, fmt.Errorf("fetch cart: %w", err)
	}
	if len(items) == 0 {
		return 0, fmt.Errorf("cart is empty")
	}

	tx, err := s.db.Begin()
	if err != nil {
		return 0, fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	var total int64
	for _, it := range items {
		// lock and check inventory
		qty, err := s.orderRepo.GetInventoryForUpdate(tx, it.ProductID)
		if err != nil {
			return 0, fmt.Errorf("inventory lock for product %d: %w", it.ProductID, err)
		}
		if qty < it.Quantity {
			return 0, fmt.Errorf("insufficient inventory for product %d (requested %d, available %d)", it.ProductID, it.Quantity, qty)
		}
		// decrement
		if err := s.orderRepo.DecrementInventory(tx, it.ProductID, it.Quantity); err != nil {
			return 0, err
		}
		total += int64(it.Quantity) * it.UnitPriceCents
	}

	paymentMethod := req.PaymentMethod
	if paymentMethod == "" {
		paymentMethod = "online"
	}

	order := &models.Order{
		UserID:          userID,
		TotalCents:      total,
		Status:          "pending",
		ShippingAddress: req.ShippingAddress,
		City:            req.City,
		State:           req.State,
		PostalCode:      req.PostalCode,
		Phone:           req.Phone,
		PaymentMethod:   paymentMethod,
	}
	oid, err := s.orderRepo.CreateOrder(tx, order)
	if err != nil {
		return 0, err
	}

	for _, it := range items {
		oit := &models.OrderItem{OrderID: oid, ProductID: it.ProductID, Quantity: it.Quantity, UnitCents: it.UnitPriceCents}
		if err := s.orderRepo.CreateOrderItem(tx, oit); err != nil {
			return 0, err
		}
	}

	// Payment Record Status
	payStatus := "completed"
	if paymentMethod == "cod" {
		payStatus = "pending_cod"
	} else if paymentMethod == "hospital_po" {
		payStatus = "billed_net30"
	}

	payment := &models.Payment{
		OrderID:           oid,
		Provider:          paymentMethod,
		ProviderPaymentID: fmt.Sprintf("PAY-%s-%d-%d", paymentMethod, oid, userID),
		Status:            payStatus,
		AmountCents:       total,
	}
	if err := s.orderRepo.CreatePaymentRecord(tx, payment); err != nil {
		return 0, err
	}

	// Clear cart
	if err := s.cartSvc.ClearCartTx(tx, userID); err != nil {
		return 0, fmt.Errorf("clear cart: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("commit tx: %w", err)
	}
	return oid, nil
}

func (s *OrderService) GetOrdersForUser(userID int) ([]models.Order, error) {
	return s.orderRepo.GetOrdersByUserID(userID)
}

func (s *OrderService) GetAllOrders() ([]models.Order, error) {
	return s.orderRepo.GetAllOrders()
}

func (s *OrderService) GetOrderByID(orderID int) (*models.Order, error) {
	return s.orderRepo.GetOrderByID(orderID)
}

func (s *OrderService) UpdateOrderStatus(orderID int, status string) error {
	return s.orderRepo.UpdateOrderStatus(orderID, status)
}
