package repositories

import (
    "database/sql"
    "fmt"

    "backend/models"
)

type ProductRepository struct{ db *sql.DB }

func NewProductRepository(db *sql.DB) *ProductRepository { return &ProductRepository{db: db} }

type ProductFilter struct {
    Query         string
    CategoryID    *int
    MinPriceCents *int64
    MaxPriceCents *int64
    IsRefurbished *bool
    WarrantyMonths *int
    Sort          string
    Limit         int
    Offset        int
}

// List returns products matching the given filters. Query is used for full-text search.
func (r *ProductRepository) List(filter ProductFilter) ([]models.Product, error) {
    args := []interface{}{}
    where := ""
    i := 1
    if filter.Query != "" {
        where += fmt.Sprintf(" to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'')) @@ plainto_tsquery('english', $%d)", i)
        args = append(args, filter.Query)
        i++
    }
    if filter.CategoryID != nil {
        if where != "" { where += " AND" }
        where += fmt.Sprintf(" category_id = $%d", i); args = append(args, *filter.CategoryID); i++
    }
    if filter.MinPriceCents != nil {
        if where != "" { where += " AND" }
        where += fmt.Sprintf(" price_cents >= $%d", i); args = append(args, *filter.MinPriceCents); i++
    }
    if filter.MaxPriceCents != nil {
        if where != "" { where += " AND" }
        where += fmt.Sprintf(" price_cents <= $%d", i); args = append(args, *filter.MaxPriceCents); i++
    }
    if filter.IsRefurbished != nil {
        if where != "" { where += " AND" }
        where += fmt.Sprintf(" is_refurbished = $%d", i); args = append(args, *filter.IsRefurbished); i++
    }
    if filter.WarrantyMonths != nil {
        if where != "" { where += " AND" }
        where += fmt.Sprintf(" warranty_months >= $%d", i); args = append(args, *filter.WarrantyMonths); i++
    }

    base := `SELECT id, sku, name, description, category_id, is_refurbished, warranty_months, price_cents, currency, created_at FROM products`
    if where != "" {
        base = base + " WHERE" + where
    }
    // sorting
    order := " ORDER BY id DESC"
    if filter.Sort != "" {
        // allow a couple of safe sort options
        switch filter.Sort {
        case "price_asc": order = " ORDER BY price_cents ASC"
        case "price_desc": order = " ORDER BY price_cents DESC"
        case "newest": order = " ORDER BY created_at DESC"
        }
    }
    // pagination
    if filter.Limit <= 0 { filter.Limit = 20 }
    base = base + order + fmt.Sprintf(" LIMIT $%d OFFSET $%d", i, i+1)
    args = append(args, filter.Limit, filter.Offset)

    rows, err := r.db.Query(base, args...)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    var out []models.Product
    for rows.Next() {
        var p models.Product
        if err := rows.Scan(&p.ID, &p.SKU, &p.Name, &p.Description, &p.CategoryID, &p.IsRefurbished, &p.WarrantyMonths, &p.PriceCents, &p.Currency, &p.CreatedAt); err != nil {
            return nil, err
        }
        out = append(out, p)
    }
    return out, nil
}

func (r *ProductRepository) GetByID(id int) (*models.Product, error) {
    var p models.Product
    err := r.db.QueryRow(`SELECT id, sku, name, description, category_id, is_refurbished, warranty_months, price_cents, currency, created_at FROM products WHERE id = $1`, id).Scan(&p.ID, &p.SKU, &p.Name, &p.Description, &p.CategoryID, &p.IsRefurbished, &p.WarrantyMonths, &p.PriceCents, &p.Currency, &p.CreatedAt)
    if err != nil {
        return nil, err
    }
    return &p, nil
}

func (r *ProductRepository) Create(p *models.Product) (*models.Product, error) {
    var id int
    err := r.db.QueryRow(`INSERT INTO products (sku, name, description, category_id, is_refurbished, warranty_months, price_cents, currency) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, created_at`, p.SKU, p.Name, p.Description, p.CategoryID, p.IsRefurbished, p.WarrantyMonths, p.PriceCents, p.Currency).Scan(&id, &p.CreatedAt)
    if err != nil {
        return nil, err
    }
    p.ID = id
    return p, nil
}

func (r *ProductRepository) Update(p *models.Product) (*models.Product, error) {
    _, err := r.db.Exec(`UPDATE products SET sku=$1, name=$2, description=$3, category_id=$4, is_refurbished=$5, warranty_months=$6, price_cents=$7, currency=$8, updated_at=now() WHERE id=$9`, p.SKU, p.Name, p.Description, p.CategoryID, p.IsRefurbished, p.WarrantyMonths, p.PriceCents, p.Currency, p.ID)
    if err != nil {
        return nil, err
    }
    return p, nil
}

func (r *ProductRepository) Delete(id int) error {
    _, err := r.db.Exec(`DELETE FROM products WHERE id=$1`, id)
    return err
}
