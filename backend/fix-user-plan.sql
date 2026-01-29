-- Verificar usuário e planos
SELECT id, name, email, "planId" FROM users WHERE email = 'joao@teste.com';

SELECT id, name, price, "maxConcurrentIps" FROM plans;

-- Associar usuário ao plano Facil (2 IPs)
UPDATE users 
SET "planId" = (SELECT id FROM plans WHERE name = 'Facil' LIMIT 1)
WHERE email = 'joao@teste.com';

-- Verificar atualização
SELECT u.id, u.name, u.email, u."planId", p.name as plan_name, p."maxConcurrentIps"
FROM users u
LEFT JOIN plans p ON u."planId" = p.id
WHERE u.email = 'joao@teste.com';

-- Limpar sessões antigas para novo teste
DELETE FROM user_sessions WHERE "userId" = (SELECT id FROM users WHERE email = 'joao@teste.com');

SELECT 'Usuario atualizado com sucesso!' as status;
