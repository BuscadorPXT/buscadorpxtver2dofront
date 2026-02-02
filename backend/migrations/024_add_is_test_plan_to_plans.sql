-- Migration: Add is_test_plan flag to plans table
-- Description: Add flag to identify test plans for automated messaging

ALTER TABLE plans
ADD COLUMN is_test_plan BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN plans.is_test_plan IS 'Flag indicating if this is a test plan (e.g., 24h trial)';
