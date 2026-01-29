-- Migration: Add address column to suppliers table
-- Created: 2025-11-18

-- Add address column
ALTER TABLE suppliers
ADD COLUMN address VARCHAR(500);

-- Add comment to column
COMMENT ON COLUMN suppliers.address IS 'Endereço do fornecedor importado da coluna C da aba FORNECEDORES';
