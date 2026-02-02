ALTER TABLE system_settings 
DROP COLUMN IF EXISTS r2_access_key_id,
DROP COLUMN IF EXISTS r2_secret_access_key,
ADD COLUMN IF NOT EXISTS r2_api_token TEXT;

COMMENT ON COLUMN system_settings.r2_api_token IS 'Cloudflare R2 API Token';
