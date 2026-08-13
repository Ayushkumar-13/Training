package main

import (
    "fmt"
    "log"
    "os"
    "path/filepath"

    "backend/db"
)

func main() {
    dbConn, err := db.ConnectFromEnv()
    if err != nil {
        log.Fatalf("db connect: %v", err)
    }
    defer dbConn.Close()

    // Determine migrations directory relative to this binary working directory
    exePath, _ := os.Getwd()
    migrationsDir := filepath.Join(exePath, "db", "migrations")
    fmt.Printf("Running migrations from %s\n", migrationsDir)
    if err := db.RunMigrations(dbConn, migrationsDir); err != nil {
        log.Fatalf("migrations failed: %v", err)
    }

    if err := db.Seed(dbConn); err != nil {
        log.Fatalf("seeding failed: %v", err)
    }
    fmt.Println("Migrations and seed finished")
}
