package repositories

import (
	"database/sql"
	"errors"
	"strings"
	"time"

	"backend/models"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository { return &UserRepository{db: db} }

func (r *UserRepository) FindByEmail(email string) (*models.User, string, string, error) {
	var u models.User
	var roleName sql.NullString
	var passwordHash string
	err := r.db.QueryRow(`SELECT u.id, u.email, u.full_name, r.name, u.password_hash, u.created_at FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = $1`, email).Scan(&u.ID, &u.Email, &u.FullName, &roleName, &passwordHash, &u.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, "", "", nil
		}
		return nil, "", "", err
	}
	u.Role = roleName.String
	return &u, passwordHash, roleName.String, nil
}

func (r *UserRepository) CreateUser(email, passwordHash, fullName string) (*models.User, error) {
	var id int
	// get user role id
	var roleID int
	if err := r.db.QueryRow(`SELECT id FROM roles WHERE name = 'user' LIMIT 1`).Scan(&roleID); err != nil {
		// Fallback if roles table missing user role
		_ = r.db.QueryRow(`SELECT id FROM roles ORDER BY id ASC LIMIT 1`).Scan(&roleID)
	}

	var createdAt time.Time
	err := r.db.QueryRow(`INSERT INTO users (email, password_hash, full_name, role_id) VALUES ($1,$2,$3,$4) RETURNING id, created_at`, email, passwordHash, fullName, roleID).Scan(&id, &createdAt)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") || strings.Contains(err.Error(), "users_email_key") {
			return nil, errors.New("An account with this email address already exists. Please log in instead.")
		}
		return nil, err
	}
	return &models.User{ID: id, Email: email, FullName: fullName, Role: "user", CreatedAt: createdAt}, nil
}

func (r *UserRepository) GetAllUsers() ([]models.User, error) {
	rows, err := r.db.Query(`
		SELECT u.id, u.email, u.full_name, coalesce(r.name, 'user'), u.created_at
		FROM users u
		LEFT JOIN roles r ON u.role_id = r.id
		ORDER BY u.id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Email, &u.FullName, &u.Role, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}
