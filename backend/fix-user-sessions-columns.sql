-- Fix user_sessions table columns to use camelCase as per original migrations

-- Rename snake_case columns to camelCase
ALTER TABLE user_sessions RENAME COLUMN user_id TO "userId";
ALTER TABLE user_sessions RENAME COLUMN ip_address TO "ipAddress";
ALTER TABLE user_sessions RENAME COLUMN user_agent TO "userAgent";
ALTER TABLE user_sessions RENAME COLUMN country_code TO "countryCode";
ALTER TABLE user_sessions RENAME COLUMN connected_at TO "lastActivityAt";
ALTER TABLE user_sessions RENAME COLUMN disconnected_at TO "createdAt";

-- Add missing columns
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW();

-- Drop incorrect columns
ALTER TABLE user_sessions DROP COLUMN IF EXISTS duration_seconds;
ALTER TABLE user_sessions DROP COLUMN IF EXISTS countryCode; -- This is duplicate

-- Recreate indexes with correct names
DROP INDEX IF EXISTS idx_user_sessions_user_id;
DROP INDEX IF EXISTS idx_user_sessions_ip_address;
DROP INDEX IF EXISTS idx_user_sessions_last_activity;

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions("userId");
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip_address ON user_sessions("ipAddress");
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions("lastActivityAt");

-- Update foreign key constraint
ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS fk_user_sessions_user;
ALTER TABLE user_sessions ADD CONSTRAINT fk_user_sessions_user 
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

-- Update unique constraint
ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS unique_user_ip;
ALTER TABLE user_sessions ADD CONSTRAINT unique_user_ip UNIQUE ("userId", "ipAddress");

COMMENT ON TABLE user_sessions IS 'Tracks active user sessions by IP address to enforce concurrent login limits';
