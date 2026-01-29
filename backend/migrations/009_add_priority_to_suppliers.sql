-- Add priority column to suppliers table for sponsorship ranking
-- Priority: lower number = higher priority (1 = highest priority)
-- NULL priority means supplier is not sponsored

ALTER TABLE suppliers
ADD COLUMN priority INTEGER DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN suppliers.priority IS 'Sponsorship priority: lower number = higher priority. NULL = not sponsored';

-- Create index for better performance on priority ordering
CREATE INDEX idx_suppliers_priority ON suppliers(priority) WHERE priority IS NOT NULL;
