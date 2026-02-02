CREATE TABLE IF NOT EXISTS supplier_clicks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    clicked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    session_info JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_supplier_clicks_user ON supplier_clicks(user_id);
CREATE INDEX idx_supplier_clicks_supplier ON supplier_clicks(supplier_id);
CREATE INDEX idx_supplier_clicks_product ON supplier_clicks(product_id);
CREATE INDEX idx_supplier_clicks_date ON supplier_clicks(clicked_at);
CREATE INDEX idx_supplier_clicks_composite ON supplier_clicks(supplier_id, clicked_at);

COMMENT ON TABLE supplier_clicks IS 'Registra cliques em links de WhatsApp dos fornecedores';
COMMENT ON COLUMN supplier_clicks.user_id IS 'Usuário que realizou o clique';
COMMENT ON COLUMN supplier_clicks.supplier_id IS 'Fornecedor cujo link foi clicado';
COMMENT ON COLUMN supplier_clicks.product_id IS 'Produto relacionado ao clique (opcional)';
COMMENT ON COLUMN supplier_clicks.clicked_at IS 'Data e hora do clique';
COMMENT ON COLUMN supplier_clicks.session_info IS 'Informações adicionais da sessão (opcional)';
