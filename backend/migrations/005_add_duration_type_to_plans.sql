-- Adiciona coluna durationType na tabela plans
-- Permite escolher se o plano é baseado em horas ou dias

ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS duration_type VARCHAR(10) DEFAULT 'hours';

-- Adiciona constraint para garantir que apenas 'hours' ou 'days' sejam aceitos
ALTER TABLE plans
ADD CONSTRAINT check_duration_type CHECK (duration_type IN ('hours', 'days'));

-- Comentário para documentação
COMMENT ON COLUMN plans.duration_type IS 'Tipo de duração do plano: hours (horas) ou days (dias)';
