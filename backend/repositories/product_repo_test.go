package repositories

import (
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestProductRepository_List(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to open sqlmock: %v", err)
	}
	defer db.Close()

	repo := &ProductRepository{db: db}

	cols := []string{"id", "sku", "name", "description", "category_id", "category_name", "category_slug", "is_refurbished", "warranty_months", "price_cents", "currency", "inventory", "created_at"}
	created := time.Now()
	mockRows := sqlmock.NewRows(cols).
		AddRow(1, "SKU1", "Product 1", "Desc 1", 1, "Category 1", "cat-1", false, 12, int64(10000), "USD", 5, created).
		AddRow(2, "SKU2", "Product 2", "Desc 2", 1, "Category 1", "cat-1", true, 6, int64(5000), "USD", 10, created)

	mock.ExpectQuery("SELECT p.id, p.sku, p.name").WithArgs(2, 0).WillReturnRows(mockRows)

	filter := ProductFilter{Limit: 2, Offset: 0}
	out, err := repo.List(filter)
	if err != nil {
		t.Fatalf("List returned error: %v", err)
	}
	if len(out) != 2 {
		t.Fatalf("expected 2 results, got %d", len(out))
	}
	if out[0].ID != 1 || out[1].ID != 2 {
		t.Fatalf("unexpected IDs: %v, %v", out[0].ID, out[1].ID)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

