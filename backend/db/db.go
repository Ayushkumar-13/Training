package db

import (
    "database/sql"
    "fmt"
    "os"
    "path/filepath"
    "sort"
    "strings"
    _ "github.com/lib/pq"
)

func ConnectFromEnv() (*sql.DB, error) {
    // Prefer a full DATABASE_URL if provided
    if url := os.Getenv("DATABASE_URL"); url != "" {
        db, err := sql.Open("postgres", url)
        if err != nil {
            return nil, err
        }
        return db, nil
    }

    host := os.Getenv("PG_HOST")
    port := os.Getenv("PG_PORT")
    user := os.Getenv("PG_USER")
    password := os.Getenv("PG_PASSWORD")
    dbname := os.Getenv("PG_DB")
    sslmode := os.Getenv("PG_SSLMODE")
    if sslmode == "" {
        sslmode = "disable"
    }
    if port == "" {
        port = "5432"
    }
    if host == "" || user == "" || dbname == "" {
        return nil, fmt.Errorf("DATABASE_URL or PG_HOST, PG_USER and PG_DB must be set")
    }
    connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s", host, port, user, password, dbname, sslmode)
    db, err := sql.Open("postgres", connStr)
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
