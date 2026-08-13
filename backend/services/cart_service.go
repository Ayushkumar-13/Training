package services

import (
    "database/sql"
    "backend/models"
    "backend/repositories"
)

type CartService struct{
    carts *repositories.CartRepository
    products *repositories.ProductRepository
}

func NewCartService(c *repositories.CartRepository, p *repositories.ProductRepository) *CartService {
    return &CartService{carts: c, products: p}
}

func (s *CartService) GetCart(userID int) (*models.Cart, []models.CartItem, error) {
    cart, err := s.carts.GetOrCreateCart(userID)
    if err != nil { return nil, nil, err }
    items, err := s.carts.GetItems(cart.ID)
    if err != nil { return nil, nil, err }
    return cart, items, nil
}

func (s *CartService) AddItem(userID, productID, quantity int) error {
    // ensure product exists and get price
    p, err := s.products.GetByID(productID)
    if err != nil { return err }
    cart, err := s.carts.GetOrCreateCart(userID)
    if err != nil { return err }
    return s.carts.AddOrUpdateItem(cart.ID, productID, quantity, p.PriceCents)
}

func (s *CartService) RemoveItem(userID, productID int) error {
    cart, err := s.carts.GetOrCreateCart(userID)
    if err != nil { return err }
    return s.carts.RemoveItem(cart.ID, productID)
}

// ClearCartTx clears the user's cart using an existing transaction.
func (s *CartService) ClearCartTx(tx *sql.Tx, userID int) error {
    return s.carts.ClearCartTx(tx, userID)
}
