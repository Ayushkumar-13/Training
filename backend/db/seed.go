package db

import (
    "database/sql"
    "fmt"
    "golang.org/x/crypto/bcrypt"
)

func Seed(db *sql.DB) error {
    tx, err := db.Begin()
    if err != nil {
        return err
    }
    defer func() {
        if err != nil {
            tx.Rollback()
        }
    }()

    // Roles
    if _, err = tx.Exec(`INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, "admin"); err != nil {
        return err
    }
    if _, err = tx.Exec(`INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, "user"); err != nil {
        return err
    }

    // Categories
    if _, err = tx.Exec(`INSERT INTO categories (name, slug) VALUES
        ('Imaging','imaging'),
        ('Patient Monitoring','patient-monitoring'),
        ('Infusion & Syringe Pumps','infusion-pumps')
        ON CONFLICT (slug) DO NOTHING`); err != nil {
        return err
    }

    // Sample products
    if _, err = tx.Exec(`INSERT INTO products (sku, name, description, category_id, is_refurbished, warranty_months, price_cents, currency)
        SELECT $1,$2,$3,c.id,$4,$5,$6,$7 FROM categories c WHERE c.slug = $8
        ON CONFLICT (sku) DO NOTHING`,
        "XR-1000", "X-Ray System XR-1000", "High-resolution digital X-Ray system suitable for radiology departments.", false, 24, 15000000, "USD", "imaging"); err != nil {
        return err
    }

    if _, err = tx.Exec(`INSERT INTO products (sku, name, description, category_id, is_refurbished, warranty_months, price_cents, currency)
        SELECT $1,$2,$3,c.id,$4,$5,$6,$7 FROM categories c WHERE c.slug = $8
        ON CONFLICT (sku) DO NOTHING`,
        "INF-200", "Infusion Pump IP-200", "Volumetric infusion pump with safety alarms and battery backup.", false, 12, 350000, "USD", "infusion-pumps"); err != nil {
        return err
    }

    if _, err = tx.Exec(`INSERT INTO products (sku, name, description, category_id, is_refurbished, warranty_months, price_cents, currency)
        SELECT $1,$2,$3,c.id,$4,$5,$6,$7 FROM categories c WHERE c.slug = $8
        ON CONFLICT (sku) DO NOTHING`,
        "PM-500", "Patient Monitor PM-500", "Multi-parameter patient monitor for vitals surveillance.", false, 12, 1250000, "USD", "patient-monitoring"); err != nil {
        return err
    }

    // Inventory
    if _, err = tx.Exec(`INSERT INTO inventory (product_id, quantity, location)
        SELECT p.id, $1, 'main-warehouse' FROM products p WHERE p.sku = $2
        ON CONFLICT DO NOTHING`, 5, "INF-200"); err != nil {
        // ignore conflict errors
    }

    // Create admin user with a secure hashed password (demo password: AdminPass123!).
    password := []byte("AdminPass123!")
    hash, err := bcrypt.GenerateFromPassword(password, bcrypt.DefaultCost)
    if err != nil {
        return err
    }
    // Insert admin user if not exists
    if _, err = tx.Exec(`INSERT INTO users (email, password_hash, full_name, role_id)
        SELECT $1, $2, $3, r.id FROM roles r WHERE r.name = 'admin' AND NOT EXISTS (SELECT 1 FROM users u WHERE u.email = $1)`,
        "admin@medstore.local", string(hash), "Platform Admin"); err != nil {
        return err
    }

    if err = tx.Commit(); err != nil {
        return err
    }
    fmt.Println("Seed completed")
    return nil
}
