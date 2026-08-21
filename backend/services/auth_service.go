package services

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"backend/models"
	"backend/repositories"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	users  *repositories.UserRepository
	secret string
	cache  *Cache
}

func NewAuthService(ur *repositories.UserRepository, secret string, c *Cache) *AuthService {
	return &AuthService{users: ur, secret: secret, cache: c}
}

func (s *AuthService) Register(email, password, fullName string) (*models.User, error) {
	if email == "" || password == "" {
		return nil, errors.New("email and password required")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	u, err := s.users.CreateUser(email, string(hash), fullName)
	if err == nil && s.cache != nil {
		_ = s.cache.Del(context.Background(), "users:all")
	}
	return u, err
}

func (s *AuthService) Authenticate(email, password string) (*models.User, string, error) {
	u, hash, role, err := s.users.FindByEmail(email)
	if err != nil {
		return nil, "", err
	}
	if u == nil {
		return nil, "", errors.New("invalid credentials")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)); err != nil {
		return nil, "", errors.New("invalid credentials")
	}
	// Create 24-day JWT user login session token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  u.ID,
		"role": role,
		"exp":  time.Now().Add(24 * 24 * time.Hour).Unix(), // 24 Days Expiration
	})
	signed, err := token.SignedString([]byte(s.secret))
	if err != nil {
		return nil, "", err
	}
	return u, signed, nil
}

func (s *AuthService) GetAllUsers() ([]models.User, error) {
	if s.cache != nil {
		if val, err := s.cache.Get(context.Background(), "users:all"); err == nil {
			var cachedUsers []models.User
			if err := json.Unmarshal([]byte(val), &cachedUsers); err == nil {
				return cachedUsers, nil
			}
		}
	}

	users, err := s.users.GetAllUsers()
	if err != nil {
		return nil, err
	}

	if s.cache != nil {
		if b, err := json.Marshal(users); err == nil {
			_ = s.cache.Set(context.Background(), "users:all", string(b), 300*time.Second)
		}
	}
	return users, nil
}

