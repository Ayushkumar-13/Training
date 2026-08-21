-- Migration: 0007_add_payment_receipt_no.sql
-- Add payment_receipt_no column for storing online payment receipt reference numbers

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_receipt_no VARCHAR(100);

-- Create B-Tree index on payment_receipt_no for fast lookup
CREATE INDEX IF NOT EXISTS idx_orders_payment_receipt_no ON orders (payment_receipt_no);
