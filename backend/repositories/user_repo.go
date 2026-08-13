package repositories

import (
    "database/sql"
    "errors"

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
        return nil, err
    }
    var createdAt string
    err := r.db.QueryRow(`INSERT INTO users (email, password_hash, full_name, role_id) VALUES ($1,$2,$3,$4) RETURNING id, created_at`, email, passwordHash, fullName, roleID).Scan(&id, &createdAt)
    if err != nil {
        return nil, err
    }
    return &models.User{ID: id, Email: email, FullName: fullName, Role: "user"}, nil
}
