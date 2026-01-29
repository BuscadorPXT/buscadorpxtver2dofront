-- Adiciona a coluna sheetDate à tabela products
-- Esta coluna armazena a data da aba da planilha no formato DD-MM (ex: 24-10)

ALTER TABLE products ADD COLUMN IF NOT EXISTS "sheetDate" VARCHAR(5);

-- Criar índice para melhorar performance de queries por data
CREATE INDEX IF NOT EXISTS idx_products_sheet_date ON products("sheetDate");

-- Comentário na coluna
COMMENT ON COLUMN products."sheetDate" IS 'Data da aba da planilha no formato DD-MM (ex: 24-10)';
