package services

import (
	"context"

	"backend/models"
	"backend/repositories"
)

type CategoryService struct {
	repo *repositories.CategoryRepository
}

func NewCategoryService(repo *repositories.CategoryRepository) *CategoryService {
	return &CategoryService{repo: repo}
}

func (s *CategoryService) List(ctx context.Context) ([]models.Category, error) {
	return s.repo.List(ctx)
}

func (s *CategoryService) Create(ctx context.Context, c *models.Category) error {
	return s.repo.Create(ctx, c)
}
