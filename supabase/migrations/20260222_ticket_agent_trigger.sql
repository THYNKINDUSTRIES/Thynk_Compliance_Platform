-- =============================================================================
-- Ticket Agent: DB trigger to auto-triage new support tickets
-- =============================================================================
-- When a new support ticket is inserted, pg_net calls the ticket-agent
-- edge function which:
--   1. AI-classifies the ticket (priority, category, sentiment)
--   2. Posts an auto-generated response comment
--   3. Sends confirmation email to the user
--   4. Sends admin notification for non-auto-resolvable tickets
--
-- Run this in the Supabase SQL Editor AFTER deploying the ticket-agent function.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

-- ─── Trigger function ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_ticket_agent()
RETURNS TRIGGER AS $$
BEGIN
  -- Fire-and-forget HTTP call to the ticket-agent edge function
  PERFORM net.http_post(
    url := 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/ticket-agent',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtydXdiamFzemR3enR0Ymx4cXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjcwOTIsImV4cCI6MjA3Njc0MzA5Mn0.BOmy4m7qoukUVyG1j8kDyyuA__mp9BeYdiDXL_OW-ZQ'
    ),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'ticket_number', NEW.ticket_number,
        'subject', NEW.subject,
        'description', NEW.description,
        'category', NEW.category,
        'priority', NEW.priority,
        'status', NEW.status,
        'user_id', NEW.user_id
      )
    ),
    timeout_milliseconds := 30000  -- 30s timeout (AI processing takes time)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Attach trigger ────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_ticket_created ON public.support_tickets;
CREATE TRIGGER on_ticket_created
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_ticket_agent();

-- ─── Allow system (null user_id) comments via RLS ──────────────────────────
-- The ticket-agent posts comments with user_id = NULL (system/bot).
-- We need a policy that allows the service role to insert these.
-- Service role bypasses RLS, but just in case, add an explicit policy:
DO $$
BEGIN
  -- Drop existing policy if it exists to avoid conflicts
  DROP POLICY IF EXISTS "System can insert comments" ON public.ticket_comments;
  
  CREATE POLICY "System can insert comments" ON public.ticket_comments
    FOR INSERT
    WITH CHECK (user_id IS NULL);
END $$;

-- ─── Add agent_response column to tickets for quick display ────────────────
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS agent_response TEXT,
  ADD COLUMN IF NOT EXISTS agent_resolved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS agent_confidence NUMERIC(3,2);

-- ─── Index for admin dashboard queries ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON public.support_tickets(created_at DESC);
