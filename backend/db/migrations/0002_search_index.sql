-- Add combined GIN index for full-text search on products name and description
CREATE INDEX IF NOT EXISTS idx_products_name_description_fts ON products USING gin (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'')));
