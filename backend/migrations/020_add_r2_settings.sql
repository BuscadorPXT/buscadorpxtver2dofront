ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS r2_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS r2_access_key_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS r2_secret_access_key TEXT,
ADD COLUMN IF NOT EXISTS r2_bucket_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS r2_public_url TEXT;

COMMENT ON COLUMN system_settings.r2_account_id IS 'Cloudflare R2 Account ID';
COMMENT ON COLUMN system_settings.r2_access_key_id IS 'R2 Access Key ID';
COMMENT ON COLUMN system_settings.r2_secret_access_key IS 'R2 Secret Access Key';
COMMENT ON COLUMN system_settings.r2_bucket_name IS 'R2 Bucket Name';
COMMENT ON COLUMN system_settings.r2_public_url IS 'R2 Public URL (custom domain)';
