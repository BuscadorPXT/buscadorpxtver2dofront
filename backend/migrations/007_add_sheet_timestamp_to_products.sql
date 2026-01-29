-- Add sheet_timestamp column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS sheet_timestamp VARCHAR(50);
