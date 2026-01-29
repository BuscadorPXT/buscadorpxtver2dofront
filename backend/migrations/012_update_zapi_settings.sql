-- Atualizar configurações do Z-API para incluir Client Token, Instance ID e Instance Token

-- Remover as chaves antigas
DELETE FROM system_settings WHERE key IN ('ZAPI_INSTANCE_ID', 'ZAPI_TOKEN', 'ZAPI_BASE_URL');

-- Adicionar as novas chaves
INSERT INTO system_settings (key, value, description, "isEncrypted", "createdAt", "updatedAt")
VALUES 
  ('ZAPI_CLIENT_TOKEN', '', 'Token do Cliente Z-API', true, NOW(), NOW()),
  ('ZAPI_INSTANCE_ID', '', 'ID da Instância Z-API', false, NOW(), NOW()),
  ('ZAPI_INSTANCE_TOKEN', '', 'Token da Instância Z-API', true, NOW(), NOW()),
  ('ZAPI_BASE_URL', 'https://api.z-api.io', 'URL base da API Z-API', false, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;
