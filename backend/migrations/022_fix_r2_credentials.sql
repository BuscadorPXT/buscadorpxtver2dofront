ALTER TABLE system_settings DROP COLUMN IF EXISTS r2_api_token;

ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS r2_access_key_id TEXT,
ADD COLUMN IF NOT EXISTS r2_secret_access_key TEXT;

COMMENT ON COLUMN system_settings.r2_access_key_id IS 'Cloudflare R2 S3 Access Key ID';
COMMENT ON COLUMN system_settings.r2_secret_access_key IS 'Cloudflare R2 S3 Secret Access Key';
