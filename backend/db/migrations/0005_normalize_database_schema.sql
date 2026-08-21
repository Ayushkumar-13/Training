-- Migration 0005: 3NF Database Normalization (Third Normal Form)

-- 1. Brands Table (Normalized 3NF Entity for Manufacturers)
CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    slug VARCHAR(200) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add brand_id foreign key constraint to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL;

-- Seed standard enterprise medical equipment manufacturers into normalized brands table
INSERT INTO brands (name, slug) VALUES
('Siemens Healthineers', 'siemens'),
('GE Healthcare', 'ge-healthcare'),
('Philips Healthcare', 'philips'),
('Mindray Medical', 'mindray'),
('Hamilton Medical', 'hamilton'),
('B. Braun', 'b-braun'),
('Getinge Maquet', 'getinge'),
('Dräger', 'draeger'),
('Medtronic', 'medtronic')
ON CONFLICT (name) DO NOTHING;

-- 2. User Shipping Addresses Table (Normalized 3NF Entity for Facilities & Addresses)
CREATE TABLE IF NOT EXISTS user_addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(100) DEFAULT 'Hospital Facility',
    street_address VARCHAR(500) NOT NULL,
    city VARCHAR(200) NOT NULL,
    state VARCHAR(200) NOT NULL,
    postal_code VARCHAR(50) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Link orders to normalized user_addresses entity
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_id INTEGER REFERENCES user_addresses(id) ON DELETE SET NULL;

-- 3. Order Cancellation Audits Table (Normalized 3NF Entity for Organization Audit Logs)
CREATE TABLE IF NOT EXISTS order_cancellation_audits (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
