-- Script para corrigir colunas duplicadas duration_type/durationType
-- Execute este script no banco de dados de produção

-- 1. Verificar se existe coluna duplicada "durationType" na tabela plans
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plans' AND column_name = 'durationType'
    ) THEN
        -- Copiar dados de durationType para duration_type (se duration_type tiver valor padrão)
        UPDATE plans 
        SET duration_type = "durationType" 
        WHERE "durationType" IS NOT NULL AND "durationType" != duration_type;
        
        -- Remover coluna duplicada
        ALTER TABLE plans DROP COLUMN IF EXISTS "durationType";
        
        RAISE NOTICE 'Coluna durationType removida da tabela plans';
    ELSE
        RAISE NOTICE 'Coluna durationType não existe na tabela plans - OK';
    END IF;
END $$;

-- 2. Verificar se existe coluna duplicada "durationType" na tabela subscriptions
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'durationType'
    ) THEN
        -- Copiar dados de durationType para duration_type (se duration_type tiver valor padrão)
        UPDATE subscriptions 
        SET duration_type = "durationType" 
        WHERE "durationType" IS NOT NULL AND "durationType" != duration_type;
        
        -- Remover coluna duplicada
        ALTER TABLE subscriptions DROP COLUMN IF EXISTS "durationType";
        
        RAISE NOTICE 'Coluna durationType removida da tabela subscriptions';
    ELSE
        RAISE NOTICE 'Coluna durationType não existe na tabela subscriptions - OK';
    END IF;
END $$;

-- 3. Verificar e mostrar o estado atual das tabelas
SELECT 'plans' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'plans' AND column_name ILIKE '%duration%'
UNION ALL
SELECT 'subscriptions' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' AND column_name ILIKE '%duration%';

-- 4. Mostrar valores atuais dos planos
SELECT id, name, duration_type, hours 
FROM plans 
WHERE is_active = true
ORDER BY display_order;
