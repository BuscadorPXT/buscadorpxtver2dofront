-- Migration: Add max_concurrent_ips to plans table
-- This field defines how many simultaneous IPs/devices a user can be logged in from

ALTER TABLE plans ADD COLUMN "maxConcurrentIps" INTEGER NOT NULL DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN plans."maxConcurrentIps" IS 'Maximum number of simultaneous IPs/devices allowed for this plan';

-- Create index for better query performance
CREATE INDEX idx_plans_max_concurrent_ips ON plans("maxConcurrentIps");
