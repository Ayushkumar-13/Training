-- Migration: 0009_add_order_return_policy.sql
-- Add order return columns and return audit tracking table for delivered orders

ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_status VARCHAR(50) DEFAULT 'none';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS returned_at TIMESTAMP WITH TIME ZONE;

-- Create order_return_audits table for tracking return requests
CREATE TABLE IF NOT EXISTS order_return_audits (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'requested',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Performance B-Tree indexes
CREATE INDEX IF NOT EXISTS idx_orders_return_status ON orders (return_status);
CREATE INDEX IF NOT EXISTS idx_order_return_audits_order_id ON order_return_audits (order_id);
CREATE INDEX IF NOT EXISTS idx_order_return_audits_user_id ON order_return_audits (user_id);
