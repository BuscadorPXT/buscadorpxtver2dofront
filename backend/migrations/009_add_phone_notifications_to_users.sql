-- Adicionar campos de telefone e preferências de notificação aos usuários
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "phone" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "enableWhatsAppNotifications" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "enableEmailNotifications" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "timezone" VARCHAR(50) DEFAULT 'America/Sao_Paulo';
