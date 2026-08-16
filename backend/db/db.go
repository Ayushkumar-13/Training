package db

import (
	"bufio"
	"database/sql"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"

	_ "github.com/lib/pq"
)

// loadEnvFile reads a simple .env file into os.Getenv if not already set
func loadEnvFile(filename string) {
	file, err := os.Open(filename)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			val := strings.TrimSpace(parts[1])
			val = strings.Trim(val, `"'`)
			if os.Getenv(key) == "" {
				os.Setenv(key, val)
			}
		}
	}
}

func ConnectFromEnv() (*sql.DB, error) {
	loadEnvFile(".env")
	loadEnvFile(".env.local")

	host := os.Getenv("PG_HOST")
	port := os.Getenv("PG_PORT")
	user := os.Getenv("PG_USER")
	password := os.Getenv("PG_PASSWORD")
	dbname := os.Getenv("PG_DB")
	sslmode := os.Getenv("PG_SSLMODE")

	if host == "" {
		host = "localhost"
	}
	if port == "" {
		port = "5432"
	}
	if user == "" {
		user = "postgres"
	}
	if dbname == "" {
		dbname = "medical_store"
	}
	if sslmode == "" {
		sslmode = "disable"
	}

	// 1. Try Key-Value DSN first (handles usernames with spaces like 'Ayush Kumar' and disables SSL cleanly)
	kvConnStr := fmt.Sprintf("host='%s' port='%s' user='%s' password='%s' dbname='%s' sslmode='%s'",
		strings.ReplaceAll(host, "'", "\\'"),
		strings.ReplaceAll(port, "'", "\\'"),
		strings.ReplaceAll(user, "'", "\\'"),
		strings.ReplaceAll(password, "'", "\\'"),
		strings.ReplaceAll(dbname, "'", "\\'"),
		sslmode,
	)

	db, err := sql.Open("postgres", kvConnStr)
	if err == nil {
		if errPing := db.Ping(); errPing == nil {
			return db, nil
		} else {
			db.Close()
		}
	}

	// 2. Fallback to DATABASE_URL if present
	if rawURL := os.Getenv("DATABASE_URL"); rawURL != "" {
		if strings.Contains(rawURL, "@db:") {
			rawURL = strings.Replace(rawURL, "@db:", "@localhost:", 1)
		}
		if !strings.Contains(rawURL, "sslmode=") {
			if strings.Contains(rawURL, "?") {
				rawURL += "&sslmode=disable"
			} else {
				rawURL += "?sslmode=disable"
			}
		}

		// Parse URL to check username
		if u, err := url.Parse(rawURL); err == nil {
			pass, _ := u.User.Password()
			uUser := u.User.Username()
			uHost := u.Hostname()
			uPort := u.Port()
			if uPort == "" {
				uPort = "5432"
			}
			uPath := strings.TrimPrefix(u.Path, "/")
			if uPath == "" {
				uPath = "medical_store"
			}

			fallbackKV := fmt.Sprintf("host='%s' port='%s' user='%s' password='%s' dbname='%s' sslmode='disable'",
				uHost, uPort, uUser, pass, uPath)
			db, err = sql.Open("postgres", fallbackKV)
			if err == nil {
				return db, nil
			}
		}

		db, err = sql.Open("postgres", rawURL)
		if err == nil {
			return db, nil
		}
	}

	// 3. Re-attempt key-value connection and return error if fails
	db, err = sql.Open("postgres", kvConnStr)
	if err != nil {
		return nil, err
	}
	return db, nil
}

// RunMigrations runs all .sql files in the provided directory in lexical order.
func RunMigrations(db *sql.DB, migrationsDir string) error {
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return err
	}
	var files []string
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		if strings.HasSuffix(e.Name(), ".sql") {
			files = append(files, e.Name())
		}
	}
	// sort lexically
	sort.Strings(files)
	for _, name := range files {
		path := filepath.Join(migrationsDir, name)
		content, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		// Execute as a single statement block; allow multiple statements by using Exec
		if _, err := db.Exec(string(content)); err != nil {
			return fmt.Errorf("migration %s failed: %w", name, err)
		}
	}
	return nil
}
