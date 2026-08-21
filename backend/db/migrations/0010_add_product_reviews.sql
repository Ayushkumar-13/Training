-- Migration: 0010_add_product_reviews.sql
-- Create product_reviews table for customer equipment ratings, verified purchase, and helpful votes

CREATE TABLE IF NOT EXISTS product_reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    is_verified_purchase BOOLEAN DEFAULT TRUE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(product_id, user_id)
);

ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT TRUE;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
