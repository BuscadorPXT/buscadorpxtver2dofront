-- Script para verificar e sincronizar planId dos usuários com suas assinaturas ativas
-- Verifica subscriptions ativas e atualiza o planId e maxConcurrentIps dos usuários

BEGIN;

-- Primeiro, vamos ver quais usuários têm subscriptions ativas mas sem planId
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email,
    u."planId" as current_plan_id,
    u.max_concurrent_ips as current_max_ips,
    s."planId" as subscription_plan_id,
    s.status as subscription_status,
    s."endDate" as subscription_end_date,
    p.name as plan_name,
    p."maxConcurrentIps" as plan_max_ips
FROM users u
INNER JOIN subscriptions s ON s."userId"::integer = u.id
LEFT JOIN plans p ON s."planId" = p.id
WHERE s.status = 'active'
  AND s."endDate" > NOW()
ORDER BY u.id;

-- Agora atualizar os usuários que têm subscription ativa mas planId está NULL ou desatualizado
UPDATE users u
SET 
    "planId" = s."planId",
    max_concurrent_ips = p."maxConcurrentIps"
FROM subscriptions s
INNER JOIN plans p ON s."planId" = p.id
WHERE s."userId"::integer = u.id
  AND s.status = 'active'
  AND s."endDate" > NOW()
  AND (u."planId" IS NULL OR u."planId" != s."planId");

-- Relatório
DO $$
DECLARE
    updated_count INTEGER;
    active_subs INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM users u
    WHERE u."planId" IS NOT NULL;
    
    SELECT COUNT(*) INTO active_subs
    FROM subscriptions
    WHERE status = 'active' AND "endDate" > NOW();
    
    RAISE NOTICE '✅ Sincronização concluída!';
    RAISE NOTICE '📊 Assinaturas ativas: %', active_subs;
    RAISE NOTICE '📊 Usuários com planId: %', updated_count;
END $$;

COMMIT;
