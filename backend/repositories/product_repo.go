package repositories

import (
	"database/sql"
	"errors"
	"fmt"

	"backend/models"
)

type ProductRepository struct{ db *sql.DB }

func NewProductRepository(db *sql.DB) *ProductRepository { return &ProductRepository{db: db} }

type ProductFilter struct {
	Query          string
	CategoryID     *int
	CategorySlug   string
	MinPriceCents  *int64
	MaxPriceCents  *int64
	IsRefurbished  *bool
	WarrantyMonths *int
	Sort           string
	Limit          int
	Offset         int
}

// List returns products matching the given filters, joined with categories and inventory.
func (r *ProductRepository) List(filter ProductFilter) ([]models.Product, error) {
	args := []interface{}{}
	where := ""
	i := 1
	if filter.Query != "" {
		where += fmt.Sprintf(" to_tsvector('english', coalesce(p.name,'') || ' ' || coalesce(p.description,'')) @@ plainto_tsquery('english', $%d)", i)
		args = append(args, filter.Query)
		i++
	}
	if filter.CategoryID != nil {
		if where != "" {
			where += " AND"
		}
		where += fmt.Sprintf(" p.category_id = $%d", i)
		args = append(args, *filter.CategoryID)
		i++
	}
	if filter.CategorySlug != "" {
		if where != "" {
			where += " AND"
		}
		where += fmt.Sprintf(" c.slug = $%d", i)
		args = append(args, filter.CategorySlug)
		i++
	}
	if filter.MinPriceCents != nil {
		if where != "" {
			where += " AND"
		}
		where += fmt.Sprintf(" p.price_cents >= $%d", i)
		args = append(args, *filter.MinPriceCents)
		i++
	}
	if filter.MaxPriceCents != nil {
		if where != "" {
			where += " AND"
		}
		where += fmt.Sprintf(" p.price_cents <= $%d", i)
		args = append(args, *filter.MaxPriceCents)
		i++
	}
	if filter.IsRefurbished != nil {
		if where != "" {
			where += " AND"
		}
		where += fmt.Sprintf(" p.is_refurbished = $%d", i)
		args = append(args, *filter.IsRefurbished)
		i++
	}
	if filter.WarrantyMonths != nil {
		if where != "" {
			where += " AND"
		}
		where += fmt.Sprintf(" p.warranty_months >= $%d", i)
		args = append(args, *filter.WarrantyMonths)
		i++
	}

	query := `
		SELECT p.id, p.sku, p.name, p.description, p.category_id,
		       c.name as category_name, c.slug as category_slug,
		       p.is_refurbished, p.warranty_months, p.price_cents, p.currency,
		       coalesce(inv.quantity, 0) as inventory_quantity,
		       p.created_at
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN inventory inv ON p.id = inv.product_id
	`
	if where != "" {
		query += " WHERE" + where
	}

	switch filter.Sort {
	case "price_asc":
		query += " ORDER BY p.price_cents ASC"
	case "price_desc":
		query += " ORDER BY p.price_cents DESC"
	case "newest":
		query += " ORDER BY p.created_at DESC"
	default:
		query += " ORDER BY p.id DESC"
	}

	if filter.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d", i)
		args = append(args, filter.Limit)
		i++

		query += fmt.Sprintf(" OFFSET $%d", i)
		args = append(args, filter.Offset)
		i++
	}

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Product
	for rows.Next() {
		var p models.Product
		var catName, catSlug sql.NullString
		var invQty sql.NullInt64
		err := rows.Scan(
			&p.ID, &p.SKU, &p.Name, &p.Description, &p.CategoryID,
			&catName, &catSlug,
			&p.IsRefurbished, &p.WarrantyMonths, &p.PriceCents, &p.Currency,
			&invQty,
			&p.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		if catName.Valid {
			p.CategoryName = catName.String
		}
		if catSlug.Valid {
			p.CategorySlug = catSlug.String
		}
		if invQty.Valid {
			p.Inventory = int(invQty.Int64)
		}
		list = append(list, p)
	}
	return list, nil
}

func (r *ProductRepository) GetByID(id int) (*models.Product, error) {
	query := `
		SELECT p.id, p.sku, p.name, p.description, p.category_id,
		       c.name as category_name, c.slug as category_slug,
		       p.is_refurbished, p.warranty_months, p.price_cents, p.currency,
		       coalesce(inv.quantity, 0) as inventory_quantity,
		       p.created_at
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN inventory inv ON p.id = inv.product_id
		WHERE p.id = $1
	`
	var p models.Product
	var catName, catSlug sql.NullString
	var invQty sql.NullInt64
	err := r.db.QueryRow(query, id).Scan(
		&p.ID, &p.SKU, &p.Name, &p.Description, &p.CategoryID,
		&catName, &catSlug,
		&p.IsRefurbished, &p.WarrantyMonths, &p.PriceCents, &p.Currency,
		&invQty,
		&p.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}
	if catName.Valid {
		p.CategoryName = catName.String
	}
	if catSlug.Valid {
		p.CategorySlug = catSlug.String
	}
	if invQty.Valid {
		p.Inventory = int(invQty.Int64)
	}
	return &p, nil
}

func (r *ProductRepository) GetProductDetail(id int) (*models.ProductDetail, error) {
	p, err := r.GetByID(id)
	if err != nil {
		return nil, err
	}

	detail := &models.ProductDetail{Product: *p}

	// Fetch Specifications
	specRows, err := r.db.Query(`SELECT key, value FROM product_specifications WHERE product_id = $1`, id)
	if err == nil {
		defer specRows.Close()
		for specRows.Next() {
			var s models.ProductSpecification
			if err := specRows.Scan(&s.Key, &s.Value); err == nil {
				detail.Specifications = append(detail.Specifications, s)
			}
		}
	}

	// Fetch Images
	imgRows, err := r.db.Query(`SELECT url, alt, ordering FROM product_images WHERE product_id = $1 ORDER BY ordering ASC`, id)
	if err == nil {
		defer imgRows.Close()
		for imgRows.Next() {
			var img models.ProductImage
			if err := imgRows.Scan(&img.URL, &img.Alt, &img.Ordering); err == nil {
				detail.Images = append(detail.Images, img)
			}
		}
	}

	return detail, nil
}

func (r *ProductRepository) Create(p *models.Product) (*models.Product, error) {
	var id int
	err := r.db.QueryRow(
		`INSERT INTO products (sku, name, description, category_id, is_refurbished, warranty_months, price_cents, currency)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, created_at`,
		p.SKU, p.Name, p.Description, p.CategoryID, p.IsRefurbished, p.WarrantyMonths, p.PriceCents, p.Currency,
	).Scan(&id, &p.CreatedAt)

	if err != nil {
		return nil, err
	}
	p.ID = id

	// Insert initial inventory row
	_, _ = r.db.Exec(`INSERT INTO inventory (product_id, quantity, location) VALUES ($1, $2, 'Central Warehouse') ON CONFLICT DO NOTHING`, id, p.Inventory)

	return p, nil
}

func (r *ProductRepository) Update(p *models.Product) (*models.Product, error) {
	_, err := r.db.Exec(
		`UPDATE products SET sku=$1, name=$2, description=$3, category_id=$4, is_refurbished=$5, warranty_months=$6, price_cents=$7, currency=$8, updated_at=now() WHERE id=$9`,
		p.SKU, p.Name, p.Description, p.CategoryID, p.IsRefurbished, p.WarrantyMonths, p.PriceCents, p.Currency, p.ID,
	)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *ProductRepository) Delete(id int) error {
	_, err := r.db.Exec(`DELETE FROM products WHERE id=$1`, id)
	return err
}

func (r *ProductRepository) ClearAllProducts() error {
	_, err := r.db.Exec(`TRUNCATE TABLE products CASCADE`)
	return err
}

func (r *ProductRepository) AdjustInventory(productID int, delta int) error {
	_, err := r.db.Exec(`
		INSERT INTO inventory (product_id, quantity, location)
		VALUES ($1, GREATEST(0, $2), 'Central Warehouse')
		ON CONFLICT (product_id) DO UPDATE SET quantity = GREATEST(0, inventory.quantity + $2), updated_at = now()`,
		productID, delta,
	)
	return err
}

func (r *ProductRepository) GetDashboardStats() (*models.DashboardStats, error) {
	stats := &models.DashboardStats{}

	_ = r.db.QueryRow(`SELECT COUNT(*) FROM products`).Scan(&stats.TotalProducts)
	_ = r.db.QueryRow(`SELECT COUNT(*), coalesce(SUM(total_cents), 0) FROM orders`).Scan(&stats.TotalOrders, &stats.TotalRevenue)
	_ = r.db.QueryRow(`SELECT COUNT(*) FROM orders WHERE status = 'pending'`).Scan(&stats.PendingOrders)
	_ = r.db.QueryRow(`SELECT COUNT(*) FROM inventory WHERE quantity < 5`).Scan(&stats.LowStockItems)

	return stats, nil
}
