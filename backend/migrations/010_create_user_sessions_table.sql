-- Migration: Create user_sessions table
-- This table tracks active login sessions by IP address for each user

CREATE TABLE user_sessions (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" INTEGER NOT NULL,
  "ipAddress" VARCHAR(45) NOT NULL, -- IPv4 (15 chars) or IPv6 (45 chars)
  "userAgent" TEXT,
  "lastActivityAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Foreign key to users table
  CONSTRAINT fk_user_sessions_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  
  -- One user can only have one session per IP
  CONSTRAINT unique_user_ip UNIQUE ("userId", "ipAddress")
);

-- Indexes for better query performance
CREATE INDEX idx_user_sessions_user_id ON user_sessions("userId");
CREATE INDEX idx_user_sessions_ip_address ON user_sessions("ipAddress");
CREATE INDEX idx_user_sessions_last_activity ON user_sessions("lastActivityAt");

-- Comments for documentation
COMMENT ON TABLE user_sessions IS 'Tracks active user sessions by IP address to enforce concurrent login limits';
COMMENT ON COLUMN user_sessions."userId" IS 'Reference to the user who owns this session';
COMMENT ON COLUMN user_sessions."ipAddress" IS 'IP address of the client (IPv4 or IPv6)';
COMMENT ON COLUMN user_sessions."userAgent" IS 'Browser/device user agent string for identification';
COMMENT ON COLUMN user_sessions."lastActivityAt" IS 'Last time this session made a request (for cleanup of inactive sessions)';
