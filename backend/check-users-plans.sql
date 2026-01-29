-- Query simples para verificar quais usuários devem ter planos
SELECT 
    u.id,
    u.name,
    u.email,
    u."planId" as user_plan_id,
    u.max_concurrent_ips
FROM users u
ORDER BY u.id;
``