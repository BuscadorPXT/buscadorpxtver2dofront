-- Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS "system_settings" (
  "id" SERIAL PRIMARY KEY,
  "key" VARCHAR(255) UNIQUE NOT NULL,
  "value" TEXT,
  "description" TEXT,
  "isEncrypted" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Criar índice para busca por chave
CREATE INDEX IF NOT EXISTS "IDX_system_settings_key" ON "system_settings" ("key");

-- Inserir configurações padrão do Z-API (valores vazios, serão preenchidos pelo admin)
INSERT INTO "system_settings" ("key", "value", "description", "isEncrypted")
VALUES 
  ('ZAPI_INSTANCE_ID', '', 'ID da instância Z-API', true),
  ('ZAPI_TOKEN', '', 'Token de autenticação Z-API', true),
  ('ZAPI_BASE_URL', 'https://api.z-api.io', 'URL base da API Z-API', false)
ON CONFLICT ("key") DO NOTHING;
