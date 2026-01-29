-- Atualizar limites de IPs nos planos existentes
-- Plano básico: 2 IPs
UPDATE plans SET "maxConcurrentIps" = 2 WHERE name = 'Facil';

-- Planos médios (R$ 150-300): 5 IPs
UPDATE plans SET "maxConcurrentIps" = 5 WHERE price >= 150 AND price < 300;

-- Planos premium (>= R$ 300): 10 IPs
UPDATE plans SET "maxConcurrentIps" = 10 WHERE price >= 300;

-- Exibir resultado
SELECT name, price, "maxConcurrentIps" as max_ips FROM plans ORDER BY price;
