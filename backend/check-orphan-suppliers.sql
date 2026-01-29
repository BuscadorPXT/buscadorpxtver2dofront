-- Verificar produtos órfãos (supplierId sem registro na tabela suppliers)
SELECT DISTINCT p."supplierId", COUNT(*) as product_count
FROM products p
LEFT JOIN suppliers s ON p."supplierId" = s.id
WHERE s.id IS NULL
GROUP BY p."supplierId";

-- Verificar se PHOENIX GABI 1693 existe na tabela suppliers
SELECT * FROM suppliers WHERE name ILIKE '%phoenix%' OR name ILIKE '%gabi%';

-- Verificar produtos com fornecedor PHOENIX nos nomes dos suppliers
SELECT DISTINCT s.id, s.name, s.priority, COUNT(p.id) as products
FROM products p
JOIN suppliers s ON p."supplierId" = s.id
WHERE s.name ILIKE '%phoenix%'
GROUP BY s.id, s.name, s.priority;
