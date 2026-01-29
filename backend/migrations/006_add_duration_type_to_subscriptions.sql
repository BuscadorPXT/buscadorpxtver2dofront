-- Adiciona campos para controle de tipo de duração nas assinaturas
-- durationType: define se a assinatura é baseada em horas correntes ou dias
-- hoursStartedAt: marca quando as horas correntes começaram a contar

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS duration_type VARCHAR(10) DEFAULT 'days';

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS hours_started_at TIMESTAMP NULL;

-- Adiciona constraint para garantir que apenas 'hours' ou 'days' sejam aceitos
ALTER TABLE subscriptions
ADD CONSTRAINT check_subscription_duration_type CHECK (duration_type IN ('hours', 'days'));

-- Comentários para documentação
COMMENT ON COLUMN subscriptions.duration_type IS 'Tipo de duração da assinatura: hours (horas correntes) ou days (dias)';
COMMENT ON COLUMN subscriptions.hours_started_at IS 'Timestamp de quando as horas correntes começaram a contar (apenas para durationType=hours)';
