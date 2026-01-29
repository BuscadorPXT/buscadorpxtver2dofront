-- Migration: Adicionar valor 'welcome_registration' ao enum whatsapp_logs_messagetype_enum
-- Data: 2026-01-21

-- Adicionar novo valor ao enum existente
ALTER TYPE whatsapp_logs_messagetype_enum ADD VALUE IF NOT EXISTS 'welcome_registration';
