-- Script para sincronizar usuários com subscriptions ativas
-- Atribui um planId padrão aos usuários que têm subscription ativa
-- REGRA: Usar o primeiro plano ativo disponível

BEGIN;

-- Sincronizar usuários com subscriptions ativas usando o primeiro plano ativo
DO $$
DECLARE
    default_plan_id UUID;
    default_plan_max_ips INTEGER;
    updated_users INTEGER := 0;
BEGIN
    -- Buscar o primeiro plano ativo disponível
    SELECT id, "maxConcurrentIps" INTO default_plan_id, default_plan_max_ips
    FROM plans
    WHERE "isActive" = true
    ORDER BY "displayOrder" ASC, "createdAt" DESC
    LIMIT 1;

    IF default_plan_id IS NULL THEN
        RAISE NOTICE '⚠️  Nenhum plano ativo encontrado. Nenhuma sincronização será feita.';
        RETURN;
    END IF;

    RAISE NOTICE 'Plano ativo encontrado: % (maxConcurrentIps: %)', default_plan_id, default_plan_max_ips;

    -- Atualizar usuários com subscription ativa que ainda não têm planId
    UPDATE users u
    SET 
        "planId" = default_plan_id,
        max_concurrent_ips = default_plan_max_ips
    FROM (
        SELECT DISTINCT ON (s."userId") 
            s."userId"
        FROM subscriptions s
        WHERE s.status = 'active' AND s."isActive" = true
        ORDER BY s."userId", s."updatedAt" DESC
    ) latest_sub
    WHERE u.id = latest_sub."userId"
      AND (u."planId" IS NULL OR u.max_concurrent_ips IS NULL);

    GET DIAGNOSTICS updated_users = ROW_COUNT;
    RAISE NOTICE '✅ % usuário(s) sincronizado(s) com subscription ativa!', updated_users;
END $$;

-- Verificar resultado
SELECT 
    u.id,
    u.name,
    u.email,
    u."planId",
    u.max_concurrent_ips,
    s.status as subscription_status,
    s."endDate" as subscription_end_date,
    p.name as plan_name
FROM users u
LEFT JOIN subscriptions s ON s."userId" = u.id AND s.status = 'active'
LEFT JOIN plans p ON u."planId" = p.id
WHERE s.id IS NOT NULL
ORDER BY u.id;

COMMIT;
