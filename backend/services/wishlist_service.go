package services

import (
    "backend/models"
    "backend/repositories"
)

type WishlistService struct{
    lists *repositories.WishlistRepository
    products *repositories.ProductRepository
}

func NewWishlistService(w *repositories.WishlistRepository, p *repositories.ProductRepository) *WishlistService {
    return &WishlistService{lists: w, products: p}
}

func (s *WishlistService) Add(userID, productID int) error {
    _, err := s.products.GetByID(productID)
    if err != nil { return err }
    wl, err := s.lists.GetOrCreateWishlist(userID)
    if err != nil { return err }
    return s.lists.AddItem(wl.ID, productID)
}

func (s *WishlistService) Remove(userID, productID int) error {
    wl, err := s.lists.GetOrCreateWishlist(userID)
    if err != nil { return err }
    return s.lists.RemoveItem(wl.ID, productID)
}

func (s *WishlistService) List(userID int) ([]models.Product, error) {
    wl, err := s.lists.GetOrCreateWishlist(userID)
    if err != nil { return nil, err }
    return s.lists.ListItems(wl.ID)
}
