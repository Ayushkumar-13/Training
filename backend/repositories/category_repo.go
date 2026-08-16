package repositories

import (
	"context"
	"database/sql"

	"backend/models"
)

type CategoryRepository struct {
	db *sql.DB
}

func NewCategoryRepository(db *sql.DB) *CategoryRepository {
	return &CategoryRepository{db: db}
}

func (r *CategoryRepository) List(ctx context.Context) ([]models.Category, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, name, slug, parent_id FROM categories ORDER BY name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []models.Category
	for rows.Next() {
		var c models.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.ParentID); err != nil {
			return nil, err
		}
		categories = append(categories, c)
	}
	return categories, rows.Err()
}

func (r *CategoryRepository) Create(ctx context.Context, c *models.Category) error {
	return r.db.QueryRowContext(ctx,
		`INSERT INTO categories (name, slug, parent_id) VALUES ($1, $2, $3) RETURNING id`,
		c.Name, c.Slug, c.ParentID,
	).Scan(&c.ID)
}
