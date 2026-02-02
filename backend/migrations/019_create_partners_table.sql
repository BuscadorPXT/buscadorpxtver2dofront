CREATE TABLE IF NOT EXISTS partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  redirect_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partners_active ON partners(is_active);
CREATE INDEX IF NOT EXISTS idx_partners_order ON partners(display_order);
CREATE INDEX IF NOT EXISTS idx_partners_dates ON partners(start_date, end_date);

COMMENT ON TABLE partners IS 'Tabela de parceiros para banners de divulgação';
COMMENT ON COLUMN partners.name IS 'Nome do parceiro';
COMMENT ON COLUMN partners.image_url IS 'URL da imagem do banner';
COMMENT ON COLUMN partners.redirect_url IS 'URL de redirecionamento ao clicar no banner';
COMMENT ON COLUMN partners.is_active IS 'Se o banner está ativo para exibição';
COMMENT ON COLUMN partners.display_order IS 'Ordem de exibição (menor valor = maior prioridade)';
COMMENT ON COLUMN partners.start_date IS 'Data de início da exibição (opcional)';
COMMENT ON COLUMN partners.end_date IS 'Data de fim da exibição (opcional)';
