-- Migration: 0008_add_unique_to_inventory_product_id.sql
-- Deduplicate duplicate rows if any exist and add UNIQUE constraint to inventory.product_id

DELETE FROM inventory a USING inventory b
WHERE a.id < b.id AND a.product_id = b.product_id;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'inventory_product_id_unique'
    ) THEN
        ALTER TABLE inventory ADD CONSTRAINT inventory_product_id_unique UNIQUE (product_id);
    END IF;
END $$;
