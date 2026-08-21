package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"backend/models"
	"backend/repositories"
)

type ProductService struct {
	repo  *repositories.ProductRepository
	cache *Cache
}

func NewProductService(r *repositories.ProductRepository, c *Cache) *ProductService {
	return &ProductService{repo: r, cache: c}
}

func (s *ProductService) cacheKeyForFilter(f repositories.ProductFilter) (string, error) {
	b, err := json.Marshal(f)
	if err != nil {
		return "", err
	}
	ver := int64(0)
	if s.cache != nil {
		if v, err := s.cache.GetInt(context.Background(), "products:version"); err == nil {
			ver = v
		}
	}
	return fmt.Sprintf("products:v=%d:filter=%s", ver, string(b)), nil
}

func (s *ProductService) List(filter repositories.ProductFilter) ([]models.Product, error) {
	if s.cache != nil {
		key, err := s.cacheKeyForFilter(filter)
		if err == nil {
			if val, err := s.cache.Get(context.Background(), key); err == nil {
				var out []models.Product
				if err := json.Unmarshal([]byte(val), &out); err == nil {
					return out, nil
				}
			}
		}
	}
	out, err := s.repo.List(filter)
	if err != nil {
		return nil, err
	}
	if s.cache != nil {
		if key, err := s.cacheKeyForFilter(filter); err == nil {
			if b, err := json.Marshal(out); err == nil {
				_ = s.cache.Set(context.Background(), key, string(b), 60*time.Second)
			}
		}
	}
	return out, nil
}

func (s *ProductService) GetByID(id int) (*models.Product, error) {
	return s.repo.GetByID(id)
}

func (s *ProductService) GetProductDetail(id int) (*models.ProductDetail, error) {
	if s.cache != nil {
		key := fmt.Sprintf("product_detail:%d", id)
		if val, err := s.cache.Get(context.Background(), key); err == nil {
			var detail models.ProductDetail
			if err := json.Unmarshal([]byte(val), &detail); err == nil {
				return &detail, nil
			}
		}
	}
	detail, err := s.repo.GetProductDetail(id)
	if err != nil {
		return nil, err
	}
	if s.cache != nil {
		key := fmt.Sprintf("product_detail:%d", id)
		if b, err := json.Marshal(detail); err == nil {
			_ = s.cache.Set(context.Background(), key, string(b), 120*time.Second)
		}
	}
	return detail, nil
}

func (s *ProductService) Create(p *models.Product) (*models.Product, error) {
	res, err := s.repo.Create(p)
	if err == nil && s.cache != nil {
		_, _ = s.cache.Incr(context.Background(), "products:version")
	}
	return res, err
}

func (s *ProductService) Update(p *models.Product) (*models.Product, error) {
	res, err := s.repo.Update(p)
	if err == nil && s.cache != nil {
		_, _ = s.cache.Incr(context.Background(), "products:version")
		_ = s.cache.Del(context.Background(), fmt.Sprintf("product_detail:%d", p.ID))
	}
	return res, err
}

func (s *ProductService) Delete(id int) error {
	err := s.repo.Delete(id)
	if err == nil && s.cache != nil {
		_, _ = s.cache.Incr(context.Background(), "products:version")
		_ = s.cache.Del(context.Background(), fmt.Sprintf("product_detail:%d", id))
	}
	return err
}

func (s *ProductService) ClearAllProducts() error {
	err := s.repo.ClearAllProducts()
	if err == nil && s.cache != nil {
		_, _ = s.cache.Incr(context.Background(), "products:version")
	}
	return err
}

func (s *ProductService) AdjustInventory(id int, delta int) error {
	err := s.repo.AdjustInventory(id, delta)
	if err == nil && s.cache != nil {
		_, _ = s.cache.Incr(context.Background(), "products:version")
		_ = s.cache.Del(context.Background(), fmt.Sprintf("product_detail:%d", id))
	}
	return err
}

func (s *ProductService) GetDashboardStats() (*models.DashboardStats, error) {
	return s.repo.GetDashboardStats()
}

func (s *ProductService) AddReview(rev *models.ProductReview) error {
	if rev.Rating < 1 || rev.Rating > 5 {
		return fmt.Errorf("rating must be between 1 and 5 stars")
	}
	if rev.ReviewText == "" {
		rev.ReviewText = "Product quality verified."
	}
	return s.repo.AddReview(rev)
}

func (s *ProductService) GetReviews(productID int) ([]models.ProductReview, error) {
	return s.repo.GetReviewsByProductID(productID)
}

func (s *ProductService) GetAllReviews() ([]models.ProductReview, error) {
	return s.repo.GetAllReviews()
}

func (s *ProductService) DeleteReview(id int) error {
	return s.repo.DeleteReview(id)
}

func (s *ProductService) VoteHelpfulReview(id int) error {
	return s.repo.VoteHelpfulReview(id)
}
