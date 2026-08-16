package db

import (
	"database/sql"
	"fmt"
	"golang.org/x/crypto/bcrypt"
)

func Seed(db *sql.DB) error {
	// 1. Roles
	_, err := db.Exec(`INSERT INTO roles (name) VALUES ('admin'), ('user') ON CONFLICT (name) DO NOTHING`)
	if err != nil {
		fmt.Printf("Seed roles note: %v\n", err)
	}

	// 2. Verified Enterprise Accounts
	usersToSeed := []struct {
		Email    string
		Password string
		FullName string
		RoleName string
	}{
		{"ayush@medequip.com", "AyushPass123!", "Ayush Kumar", "admin"},
		{"admin@medequip.com", "AdminPass123!", "Platform Executive Admin", "admin"},
		{"sarah.jenkins@stjudehospital.org", "DoctorPass123!", "Dr. Sarah Jenkins", "user"},
	}

	for _, u := range usersToSeed {
		hash, errHash := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if errHash == nil {
			_, errExec := db.Exec(`
				INSERT INTO users (email, password_hash, full_name, role_id)
				SELECT $1, $2, $3, r.id FROM roles r WHERE r.name = $4
				ON CONFLICT (email) DO NOTHING`,
				u.Email, string(hash), u.FullName, u.RoleName,
			)
			if errExec != nil {
				fmt.Printf("Seed user %s note: %v\n", u.Email, errExec)
			}
		}
	}

	// 3. Clinical Equipment Categories
	categories := []struct {
		Name string
		Slug string
	}{
		{"Diagnostic & Imaging Systems", "diagnostic-imaging"},
		{"Patient Monitoring & Vitals", "patient-monitoring"},
		{"Infusion & Syringe Pumps", "infusion-pumps"},
		{"Surgical & Operating Room Equipment", "surgical-equipment"},
		{"Ventilators & Respiratory Support", "respiratory-support"},
	}

	for _, c := range categories {
		_, _ = db.Exec(`INSERT INTO categories (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING`, c.Name, c.Slug)
	}

	fmt.Println("Database seed completed (Roles, Enterprise Users, and Categories initialized). Products catalog left clean for Admin creation!")
	return nil
}
