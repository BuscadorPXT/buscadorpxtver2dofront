-- Adicionar campo para controlar notificações de cobrança por usuário
-- Esta configuração permite que o usuário desabilite notificações de vencimento/cobrança via WhatsApp

ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "enableBillingNotifications" BOOLEAN DEFAULT true;

-- Comentário: Quando FALSE, o usuário não receberá:
-- - Avisos de vencimento próximo (5 dias, 3 dias, 2 dias, 1 dia, hoje)
-- - Avisos de assinatura vencida
-- - Avisos de teste expirado
-- Mas ainda receberá outras notificações de WhatsApp se enableWhatsAppNotifications = true
