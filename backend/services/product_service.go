package services

import (
    "context"
    "encoding/json"
    "fmt"
    "time"

    "backend/models"
    "backend/repositories"
)

type ProductService struct{
    repo *repositories.ProductRepository
    cache *Cache
}

func NewProductService(r *repositories.ProductRepository, c *Cache) *ProductService { return &ProductService{repo: r, cache: c} }

func (s *ProductService) cacheKeyForFilter(f repositories.ProductFilter) (string, error) {
    b, err := json.Marshal(f)
    if err != nil { return "", err }
    // include version to invalidate without deleting keys
    ver := int64(0)
    if s.cache != nil {
        if v, err := s.cache.GetInt(context.Background(), "products:version"); err == nil { ver = v }
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
    if err != nil { return nil, err }
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
    }
    return res, err
}

func (s *ProductService) Delete(id int) error {
    err := s.repo.Delete(id)
    if err == nil && s.cache != nil {
        _, _ = s.cache.Incr(context.Background(), "products:version")
    }
    return err
}
