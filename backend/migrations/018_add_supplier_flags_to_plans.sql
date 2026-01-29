-- Add supplier visibility and contact flags to plans table
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS "disableSupplierContact" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "hideSupplier" BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN plans."disableSupplierContact" IS 'When true, disables WhatsApp contact button for suppliers in products page';
COMMENT ON COLUMN plans."hideSupplier" IS 'When true, blurs supplier name and region and disables contact in products page';
