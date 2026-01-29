-- Script de correção da estrutura do banco de dados
-- Execute SOMENTE após verificar que há problemas com o script verify-database.sql

-- ============================================
-- PARTE 1: Remover campos de geolocalização se existirem
-- ============================================

-- Verificar e remover campos antigos da tabela user_sessions
DO $$ 
BEGIN
    -- Remover campo country
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_sessions' AND column_name = 'country') THEN
        ALTER TABLE user_sessions DROP COLUMN country;
        RAISE NOTICE 'Campo country removido';
    END IF;

    -- Remover campo country_code
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_sessions' AND column_name = 'country_code') THEN
        ALTER TABLE user_sessions DROP COLUMN country_code;
        RAISE NOTICE 'Campo country_code removido';
    END IF;

    -- Remover campo region
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_sessions' AND column_name = 'region') THEN
        ALTER TABLE user_sessions DROP COLUMN region;
        RAISE NOTICE 'Campo region removido';
    END IF;

    -- Remover campo city
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_sessions' AND column_name = 'city') THEN
        ALTER TABLE user_sessions DROP COLUMN city;
        RAISE NOTICE 'Campo city removido';
    END IF;

    -- Remover campo latitude
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_sessions' AND column_name = 'latitude') THEN
        ALTER TABLE user_sessions DROP COLUMN latitude;
        RAISE NOTICE 'Campo latitude removido';
    END IF;

    -- Remover campo longitude
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_sessions' AND column_name = 'longitude') THEN
        ALTER TABLE user_sessions DROP COLUMN longitude;
        RAISE NOTICE 'Campo longitude removido';
    END IF;

    -- Remover campo connected_at
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_sessions' AND column_name = 'connected_at') THEN
        ALTER TABLE user_sessions DROP COLUMN connected_at;
        RAISE NOTICE 'Campo connected_at removido';
    END IF;
END $$;

-- ============================================
-- PARTE 2: Dropar tabela page_views se existir
-- ============================================

DROP TABLE IF EXISTS page_views CASCADE;

-- ============================================
-- PARTE 3: Garantir estrutura correta da user_sessions
-- ============================================

-- Verificar se os campos essenciais existem
DO $$ 
BEGIN
    -- Adicionar campo userId se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_sessions' AND column_name = 'userId') THEN
        ALTER TABLE user_sessions ADD COLUMN "userId" INTEGER NOT NULL;
        RAISE NOTICE 'Campo userId adicionado';
    END IF;

    -- Adicionar campo ipAddress se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_sessions' AND column_name = 'ipAddress') THEN
        ALTER TABLE user_sessions ADD COLUMN "ipAddress" VARCHAR(45) NOT NULL;
        RAISE NOTICE 'Campo ipAddress adicionado';
    END IF;

    -- Adicionar campo userAgent se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_sessions' AND column_name = 'userAgent') THEN
        ALTER TABLE user_sessions ADD COLUMN "userAgent" TEXT;
        RAISE NOTICE 'Campo userAgent adicionado';
    END IF;

    -- Adicionar campo lastActivityAt se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_sessions' AND column_name = 'lastActivityAt') THEN
        ALTER TABLE user_sessions ADD COLUMN "lastActivityAt" TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Campo lastActivityAt adicionado';
    END IF;

    -- Adicionar campo createdAt se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_sessions' AND column_name = 'createdAt') THEN
        ALTER TABLE user_sessions ADD COLUMN "createdAt" TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Campo createdAt adicionado';
    END IF;

    -- Adicionar campo updatedAt se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_sessions' AND column_name = 'updatedAt') THEN
        ALTER TABLE user_sessions ADD COLUMN "updatedAt" TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Campo updatedAt adicionado';
    END IF;
END $$;

-- ============================================
-- PARTE 4: Recriar foreign key se necessário
-- ============================================

DO $$ 
BEGIN
    -- Verificar se FK existe, se não criar
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'FK_user_sessions_userId' 
                   AND table_name = 'user_sessions') THEN
        ALTER TABLE user_sessions 
        ADD CONSTRAINT "FK_user_sessions_userId" 
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Foreign key criada';
    END IF;
END $$;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Mostrar estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'user_sessions'
ORDER BY ordinal_position;

-- Confirmar que page_views não existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'page_views')
        THEN '❌ ERRO: page_views ainda existe!'
        ELSE '✅ OK: page_views não existe'
    END as status;
