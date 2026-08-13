package services

import (
    "backend/models"
    "backend/repositories"
)

type ProductService struct{
    repo *repositories.ProductRepository
}

func NewProductService(r *repositories.ProductRepository) *ProductService { return &ProductService{repo: r} }

func (s *ProductService) List(filter repositories.ProductFilter) ([]models.Product, error) {
    return s.repo.List(filter)
}

func (s *ProductService) GetByID(id int) (*models.Product, error) {
    return s.repo.GetByID(id)
}

func (s *ProductService) Create(p *models.Product) (*models.Product, error) {
    return s.repo.Create(p)
}

func (s *ProductService) Update(p *models.Product) (*models.Product, error) {
    return s.repo.Update(p)
}

func (s *ProductService) Delete(id int) error {
    return s.repo.Delete(id)
}
