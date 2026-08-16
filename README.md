# Medical Equipment E-Commerce Platform

A production-oriented, scalable medical equipment e-commerce platform built with Go, Gin, Next.js, React, PostgreSQL, Redis, Docker, Kubernetes, GitHub Actions, and Terraform for Cloud deployment (Azure/AWS/GCP).

---

## 🎯 Assessment Requirements Checklist

| Requirement | Technology Used | Implementation Details |
|---|---|---|
| **Database** | **PostgreSQL 15** | SQL Migrations (`backend/db/migrations`), Seed data (`backend/db/seed.go`), PVC (`k8s/postgres-deployment.yaml`) |
| **Containerization** | **Docker & Docker Compose** | Multi-stage Dockerfiles (`backend`, `frontend`, `admin`), `docker-compose.yml` for local multi-container stack |
| **Orchestration** | **Kubernetes (`kind` / Cloud)** | K8s manifests in `k8s/` (Deployments, ClusterIP Services, NGINX Ingress, PersistentVolumeClaims, Kustomize) |
| **CI/CD** | **GitHub Actions** | Automated CI pipeline (`.github/workflows/ci.yml`) and Cloud CD pipeline (`.github/workflows/cd-cloud.yml`) |
| **Cloud** | **Azure / AWS / GCP** | Terraform IaC (`terraform/main.tf`) for AKS + Azure Flexible PostgreSQL server provisioning |

---

## 🏗 Tech Stack & Architecture

- **Backend**: Go (v1.22) + Gin Web Framework
- **Customer Frontend**: React + Next.js (v14) with Tailwind CSS
- **Admin Dashboard**: React + Vite with Tailwind CSS
- **Database**: PostgreSQL 15 (Migrations, Schema, Full-Text GIN Indexes, Foreign Key Constraints)
- **Caching**: Redis 7 (Read-through caching for products/categories & cache invalidation)
- **Authentication**: JWT (HMAC-SHA256) + bcrypt password hashing (Role-based: `admin` & `user`)
- **Containerization**: Multi-stage Dockerfiles + `docker-compose.yml`
- **Orchestration**: Kubernetes manifests in `k8s/`
- **CI/CD**: GitHub Actions workflows in `.github/workflows/`
- **Cloud IaC**: Terraform configuration in `terraform/main.tf`
- **API Testing**: Postman Collection in `postman_collection.json`

---

## 📁 Repository Structure

```
.
├── backend/                  # Go + Gin REST API Backend
│   ├── cmd/                  # CLI tools (migrations & seeding)
│   ├── db/                   # Database setup, migrations, and seed script
│   │   ├── migrations/       # PostgreSQL SQL schema migrations
│   │   ├── db.go             # Connection pool & migration runner
│   │   └── seed.go           # Seed script (users, products, inventory, categories)
│   ├── handlers/             # HTTP controller handlers (Auth, Product, Order, Category, Admin)
│   ├── middleware/           # CORS, JWT verification, and Admin authorization middleware
│   ├── models/               # Domain Go structs and request/response DTOs
│   ├── repositories/         # Database SQL repository layer (Parameterized queries)
│   ├── services/             # Domain business logic & Redis cache integration
│   ├── main.go               # Server entry point and API route definitions
│   └── Dockerfile            # Multi-stage Alpine Go build
├── frontend/                 # Next.js Customer Portal
│   ├── components/           # Reusable UI components (Header, ProductCard)
│   ├── lib/                  # API client helper (fetchJSON, formatPrice)
│   ├── pages/                # Next.js page routes (Index, Catalog, Detail, Cart, Checkout, Orders, Wishlist, Auth)
│   ├── styles/               # Global Tailwind CSS styling
│   └── Dockerfile            # Multi-stage Next.js production build
├── admin/                    # React Admin Dashboard (Vite)
│   ├── src/                  # React Admin App (Overview metrics, Product CRUD, Inventory, Orders)
│   └── Dockerfile            # Nginx production build
├── k8s/                      # Kubernetes manifests (Postgres, Redis, Backend, Frontend, Admin)
├── .github/workflows/ci.yml  # GitHub Actions CI workflow
├── docker-compose.yml        # Docker Compose orchestration
└── postman_collection.json   # Exported Postman API collection
```

---

## 🚀 Getting Started

### 1. Run via Docker Compose (Recommended)
```bash
# Build and run all services (DB, Redis, Backend, Customer Frontend, Admin Dashboard, Adminer)
docker-compose up --build
```
* Customer Portal: `http://localhost:3000`
* Admin Dashboard: `http://localhost:3001`
* Go REST API Backend: `http://localhost:8080`
* Adminer DB UI: `http://localhost:8081`

### 2. Run Locally (Development Mode)

#### Backend:
```bash
cd backend
# Set environment variables (or let it fallback to defaults)
export PG_HOST=localhost PG_PORT=5432 PG_USER=postgres PG_PASSWORD=postgres PG_DB=medstore REDIS_ADDR=localhost:6379 JWT_SECRET=dev_jwt_secret
go run main.go
```

#### Customer Frontend (Next.js):
```bash
cd frontend
npm install
npm run dev
```

#### Admin Dashboard (React + Vite):
```bash
cd admin
npm install
npm run dev
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | `admin@medstore.local` | `AdminPass123!` | Full Admin Console, Product CRUD, Stock Adjust, Order Fulfillment |
| **Doctor / User** | `doctor@hospital.org` | `DoctorPass123!` | Customer Catalog, Cart, Wishlist, Checkout, Order History |

---

## 🧪 Testing

### Backend Unit Tests (Go):
```bash
cd backend
go test -v ./...
```

### Frontend & Admin Production Builds:
```bash
cd frontend && npm run build
cd ../admin && npm run build
```

---

## 🧠 Technical Interview Cheatsheet

### 1. Go / Gin Clean Architecture
* Organized in strict layers: **Handlers → Services → Repositories → DB/Cache**.
* Handlers handle JSON HTTP request parsing, status codes, and response formatting.
* Services enforce domain business rules, cache invalidation, and database transactions.
* Repositories encapsulate parameterized SQL queries (`database/sql` with `$1, $2`) preventing SQL injection.

### 2. JWT Authentication & Role Authorization
* Stateless JWT signed using HMAC-SHA256 (`jwt-go`).
* `JWTMiddleware` extracts the `Authorization: Bearer <token>` header, validates claims, and populates `user_id` and `role` into Gin Context.
* `AdminOnly` middleware intercepts restricted routes (`POST/PUT/DELETE /api/products`, `/api/admin/*`) and enforces `role == "admin"`.

### 3. Order & Inventory Transactions (ACID Compliance)
* `PlaceOrder` executes within a PostgreSQL transaction (`tx, err := db.Begin()`).
* Queries inventory using row locking (`SELECT quantity FROM inventory WHERE product_id=$1 FOR UPDATE`) to prevent race conditions and over-selling.
* Order items, payment records (`payments` table), inventory decrements, and cart clearing execute atomically. If any step fails, `tx.Rollback()` ensures data consistency.

### 4. Redis Caching & Cache Invalidation
* Read-through caching pattern for product lists and details.
* Cache versioning (`products:version` counter in Redis).
* Write operations (`Create`, `Update`, `Delete`, `AdjustInventory`) increment `products:version`, instantly invalidating cached listings without expensive wildcard scans.
