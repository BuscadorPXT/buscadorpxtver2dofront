-- Migration: Create test_messages_log table
-- Description: Track WhatsApp messages sent to users during and after test period

CREATE TABLE test_messages_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('6h_before', '1h_before', 'post_test')),
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  test_end_time TIMESTAMP NOT NULL,
  message_content TEXT NOT NULL,
  whatsapp_response JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_test_messages_user_id ON test_messages_log(user_id);
CREATE INDEX idx_test_messages_type ON test_messages_log(message_type);
CREATE INDEX idx_test_messages_sent_at ON test_messages_log(sent_at);
CREATE INDEX idx_test_messages_status ON test_messages_log(status);

COMMENT ON TABLE test_messages_log IS 'Log of automated test period messages sent to users';
COMMENT ON COLUMN test_messages_log.message_type IS 'Type of message: 6h_before, 1h_before, or post_test';
COMMENT ON COLUMN test_messages_log.test_end_time IS 'Calculated end time of the user test period';
