-- Script para corrigir planIds dos usuários existentes
-- Baseado nas subscriptions ativas

-- 1. Primeiro, veja a situação atual
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    u."planId" as current_plan_id,
    p.name as current_plan_name,
    s.amount as subscription_amount,
    s."isActive" as subscription_active
FROM users u
LEFT JOIN plans p ON u."planId" = p.id
LEFT JOIN subscriptions s ON s."userId"::int = u.id AND s."isActive" = true
ORDER BY u.id;

-- 2. Veja os planos disponíveis com seus preços
SELECT id, name, price, "maxConcurrentIps" FROM plans ORDER BY price;

-- 3. Atualizar planId baseado no preço da subscription ativa
-- Este UPDATE associa cada usuário ao plano correspondente pelo preço
UPDATE users u
SET "planId" = (
    SELECT p.id 
    FROM plans p 
    WHERE p.price = (
        SELECT s.amount 
        FROM subscriptions s 
        WHERE s."userId"::int = u.id 
        AND s."isActive" = true 
        LIMIT 1
    )
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 
    FROM subscriptions s 
    WHERE s."userId"::int = u.id 
    AND s."isActive" = true
);

-- 4. Verificar resultado final
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    u."planId",
    p.name as plan_name,
    p.price as plan_price,
    p."maxConcurrentIps" as max_ips
FROM users u
LEFT JOIN plans p ON u."planId" = p.id
WHERE u."planId" IS NOT NULL
ORDER BY u.id;

-- 5. Verificar se há usuários sem plano mas com subscription ativa
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    u."planId",
    s.amount as subscription_amount,
    s."isActive" as subscription_active
FROM users u
LEFT JOIN subscriptions s ON s."userId"::int = u.id AND s."isActive" = true
WHERE u."planId" IS NULL
AND s."isActive" = true
ORDER BY u.id;
