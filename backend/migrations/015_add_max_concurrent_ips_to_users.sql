-- Migration: Add maxConcurrentIps column to users table
-- This allows admin to override the plan's maxConcurrentIps for specific users
-- If null, the user will use the plan's maxConcurrentIps value

ALTER TABLE users ADD COLUMN IF NOT EXISTS max_concurrent_ips INTEGER DEFAULT NULL;

COMMENT ON COLUMN users.max_concurrent_ips IS 'Override do limite de IPs simultâneos. Se NULL, usa o limite do plano.';
