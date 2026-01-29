-- Tabela user_sessions já existe (migration 010)
-- Não recriar para evitar conflitos

-- Tabela para rastrear navegação de páginas
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

-- Tabela agregada para mapa de calor (dados sumarizados)
CREATE TABLE IF NOT EXISTS location_stats (
    id SERIAL PRIMARY KEY,
    country VARCHAR(100) NOT NULL,
    country_code VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    total_sessions INTEGER DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    total_duration_seconds BIGINT DEFAULT 0,
    avg_duration_seconds INTEGER DEFAULT 0,
    last_access TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(country_code, region, city)
);

-- Tabela para estatísticas de páginas mais acessadas
CREATE TABLE IF NOT EXISTS page_stats (
    id SERIAL PRIMARY KEY,
    page_path VARCHAR(500) NOT NULL UNIQUE,
    total_views INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    total_duration_seconds BIGINT DEFAULT 0,
    avg_duration_seconds INTEGER DEFAULT 0,
    last_access TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices de user_sessions já criados na migration 010

CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_entered_at ON page_views(entered_at);

CREATE INDEX IF NOT EXISTS idx_location_stats_country_code ON location_stats(country_code);
CREATE INDEX IF NOT EXISTS idx_location_stats_total_sessions ON location_stats(total_sessions DESC);

CREATE INDEX IF NOT EXISTS idx_page_stats_page_path ON page_stats(page_path);
CREATE INDEX IF NOT EXISTS idx_page_stats_total_views ON page_stats(total_views DESC);

-- Trigger para atualizar updated_at em location_stats
CREATE OR REPLACE FUNCTION update_location_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_location_stats_timestamp
    BEFORE UPDATE ON location_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_location_stats_timestamp();

-- Trigger para atualizar updated_at em page_stats
CREATE OR REPLACE FUNCTION update_page_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_page_stats_timestamp
    BEFORE UPDATE ON page_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_page_stats_timestamp();
