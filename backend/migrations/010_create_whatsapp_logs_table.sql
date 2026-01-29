-- Criar tabela de logs de WhatsApp
CREATE TABLE IF NOT EXISTS "whatsapp_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" INTEGER,
  "phone" VARCHAR(20) NOT NULL,
  "messageType" VARCHAR(50) DEFAULT 'text',
  "message" TEXT NOT NULL,
  "status" VARCHAR(20) DEFAULT 'pending',
  "errorMessage" TEXT,
  "metadata" JSONB,
  "zapiMessageId" VARCHAR(255),
  "attempts" INTEGER DEFAULT 1,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "sentAt" TIMESTAMP,
  CONSTRAINT "FK_whatsapp_logs_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS "IDX_whatsapp_logs_userId" ON "whatsapp_logs" ("userId");
CREATE INDEX IF NOT EXISTS "IDX_whatsapp_logs_status" ON "whatsapp_logs" ("status");
CREATE INDEX IF NOT EXISTS "IDX_whatsapp_logs_messageType" ON "whatsapp_logs" ("messageType");
CREATE INDEX IF NOT EXISTS "IDX_whatsapp_logs_createdAt" ON "whatsapp_logs" ("createdAt");
