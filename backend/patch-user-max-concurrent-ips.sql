-- Script para aplicar patch de maxConcurrentIps nos usuários
-- Este script:
-- 1. Garante que a coluna max_concurrent_ips existe na tabela users
-- 2. Copia o maxConcurrentIps do plano para todos os usuários que têm plano

BEGIN;

-- Passo 1: Garantir que a coluna existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_concurrent_ips INTEGER DEFAULT NULL;

COMMENT ON COLUMN users.max_concurrent_ips IS 'Override do limite de IPs simultâneos. Se NULL, usa o limite do plano.';

-- Passo 2: Atualizar todos os usuários que têm plano com o maxConcurrentIps do plano
UPDATE users u
SET max_concurrent_ips = p."maxConcurrentIps"
FROM plans p
WHERE u."planId" = p.id
  AND u."planId" IS NOT NULL
  AND u.max_concurrent_ips IS NULL; -- Só atualizar se ainda não foi definido manualmente

-- Relatório do que foi atualizado
DO $$
DECLARE
    updated_count INTEGER;
    total_with_plans INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM users u
    INNER JOIN plans p ON u."planId" = p.id
    WHERE u.max_concurrent_ips IS NOT NULL;
    
    SELECT COUNT(*) INTO total_with_plans
    FROM users
    WHERE "planId" IS NOT NULL;
    
    RAISE NOTICE '✅ Patch aplicado com sucesso!';
    RAISE NOTICE '📊 Usuários com plano: %', total_with_plans;
    RAISE NOTICE '📊 Usuários atualizados com maxConcurrentIps: %', updated_count;
END $$;

COMMIT;
