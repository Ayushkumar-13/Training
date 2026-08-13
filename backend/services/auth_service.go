package services

import (
    "errors"
    "time"

    "backend/models"
    "backend/repositories"

    "golang.org/x/crypto/bcrypt"
    "github.com/golang-jwt/jwt/v5"
)

type AuthService struct {
    users *repositories.UserRepository
    secret string
}

func NewAuthService(ur *repositories.UserRepository, secret string) *AuthService {
    return &AuthService{users: ur, secret: secret}
}

func (s *AuthService) Register(email, password, fullName string) (*models.User, error) {
    if email == "" || password == "" {
        return nil, errors.New("email and password required")
    }
    hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        return nil, err
    }
    return s.users.CreateUser(email, string(hash), fullName)
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
    // create token
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "sub": u.ID,
        "role": role,
        "exp": time.Now().Add(24 * time.Hour).Unix(),
    })
    signed, err := token.SignedString([]byte(s.secret))
    if err != nil {
        return nil, "", err
    }
    return u, signed, nil
}
