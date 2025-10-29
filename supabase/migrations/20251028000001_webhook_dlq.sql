-- ==============================================================================
-- Webhook Dead Letter Queue (DLQ) Table
-- ==============================================================================
-- Purpose: Store failed webhook events for manual replay and debugging
-- Used by: /app/api/admin/replay/route.ts
-- ==============================================================================

-- Create webhook_event_dlq table
CREATE TABLE IF NOT EXISTS webhook_event_dlq (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_source text NOT NULL CHECK (event_source IN ('stripe', 'invoiceninja', 'n8n')),
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  error_message text,
  received_at timestamptz NOT NULL DEFAULT now(),
  replayed_at timestamptz,
  replay_count integer NOT NULL DEFAULT 0,
  last_replay_attempt timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX idx_webhook_dlq_source ON webhook_event_dlq(event_source);
CREATE INDEX idx_webhook_dlq_received ON webhook_event_dlq(received_at DESC);
CREATE INDEX idx_webhook_dlq_replayed ON webhook_event_dlq(replayed_at) WHERE replayed_at IS NULL;
CREATE INDEX idx_webhook_dlq_event_type ON webhook_event_dlq(event_source, event_type);

-- Add comment
COMMENT ON TABLE webhook_event_dlq IS 'Dead letter queue for failed webhook events that need manual replay';
COMMENT ON COLUMN webhook_event_dlq.event_source IS 'Source system: stripe, invoiceninja, or n8n';
COMMENT ON COLUMN webhook_event_dlq.event_type IS 'Event type from the source system';
COMMENT ON COLUMN webhook_event_dlq.payload IS 'Full webhook payload as received';
COMMENT ON COLUMN webhook_event_dlq.error_message IS 'Error message from failed processing attempt';
COMMENT ON COLUMN webhook_event_dlq.replay_count IS 'Number of times this event has been replayed';
COMMENT ON COLUMN webhook_event_dlq.replayed_at IS 'Timestamp of successful replay (NULL if not yet replayed)';
