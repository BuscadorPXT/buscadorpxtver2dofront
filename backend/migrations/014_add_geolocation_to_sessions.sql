-- Migration: Add geolocation fields to user_sessions table
-- Description: Adds country, region, city, lat/lon, timezone and ISP fields for IP geolocation tracking

-- Add geolocation columns to user_sessions
ALTER TABLE user_sessions
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS "countryCode" VARCHAR(10),
ADD COLUMN IF NOT EXISTS region VARCHAR(100),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
ADD COLUMN IF NOT EXISTS isp VARCHAR(200);

-- Create index on city for faster location queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_city ON user_sessions(city);

-- Create index on country for faster country-based queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_country ON user_sessions(country);

-- Create index on latitude/longitude for geospatial queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_location ON user_sessions(latitude, longitude);

COMMENT ON COLUMN user_sessions.country IS 'Country name from IP geolocation';
COMMENT ON COLUMN user_sessions."countryCode" IS 'ISO country code (e.g., BR, US)';
COMMENT ON COLUMN user_sessions.region IS 'Region/state name from IP geolocation';
COMMENT ON COLUMN user_sessions.city IS 'City name from IP geolocation';
COMMENT ON COLUMN user_sessions.latitude IS 'Latitude coordinate from IP geolocation';
COMMENT ON COLUMN user_sessions.longitude IS 'Longitude coordinate from IP geolocation';
COMMENT ON COLUMN user_sessions.timezone IS 'Timezone from IP geolocation';
COMMENT ON COLUMN user_sessions.isp IS 'Internet Service Provider from IP geolocation';
