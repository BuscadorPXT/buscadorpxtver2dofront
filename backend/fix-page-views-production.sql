-- ============================================
-- SQL para corrigir page_views em produção
-- Execute este script no banco de produção
-- ============================================

-- PASSO 1: Dropar tabela page_views se existir (com tipo errado)
DROP TABLE IF EXISTS page_views CASCADE;

-- PASSO 2: Recriar tabela page_views com tipo correto (UUID)
CREATE TABLE IF NOT EXISTS page_views (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    page_path VARCHAR(500) NOT NULL,
    page_title VARCHAR(255),
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    duration_seconds INTEGER,
    referrer VARCHAR(500),
    CONSTRAINT check_left_after_entered CHECK (left_at IS NULL OR left_at >= entered_at)
);

-- PASSO 3: Criar índices
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_entered_at ON page_views(entered_at);

-- PASSO 4: Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'page_views'
ORDER BY ordinal_position;

-- PASSO 5: Confirmar que page_views existe com tipo correto
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'page_views' 
            AND column_name = 'session_id' 
            AND data_type = 'uuid'
        )
        THEN '✅ OK: page_views criada com session_id UUID'
        ELSE '❌ ERRO: page_views com tipo incorreto!'
    END as status;
