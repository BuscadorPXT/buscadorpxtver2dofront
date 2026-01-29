-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    image_url TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_global BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_is_global ON notifications(is_global);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Comentários
COMMENT ON TABLE notifications IS 'Armazena notificações para usuários';
COMMENT ON COLUMN notifications.title IS 'Título da notificação';
COMMENT ON COLUMN notifications.message IS 'Mensagem em formato Markdown';
COMMENT ON COLUMN notifications.image_url IS 'URL da imagem anexada (opcional)';
COMMENT ON COLUMN notifications.user_id IS 'ID do usuário destinatário (NULL para notificações globais)';
COMMENT ON COLUMN notifications.is_global IS 'Se TRUE, notificação é para todos os usuários';
COMMENT ON COLUMN notifications.is_read IS 'Se o usuário já leu a notificação';
