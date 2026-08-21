-- Migration: 0011_add_order_refunds.sql
-- Add online payment refund tracking fields to orders

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50) DEFAULT 'none';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;
