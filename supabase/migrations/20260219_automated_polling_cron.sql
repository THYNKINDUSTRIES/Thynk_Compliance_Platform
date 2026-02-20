-- =============================================================================
-- Automated Polling Schedule via pg_cron + pg_net
-- =============================================================================
-- This migration sets up pg_cron to call the scheduled-poller-cron edge function
-- every hour. The edge function itself decides which pollers to run based on
-- the current UTC hour.
--
-- Prerequisites:
--   1. pg_cron extension must be enabled (Supabase enables it by default)
--   2. pg_net extension must be enabled (for HTTP calls from within Postgres)
--   3. SUPABASE_URL and SUPABASE_ANON_KEY are available as shown below
--
-- Run this in the Supabase SQL Editor.
-- =============================================================================

-- Enable extensions (safe to run even if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant usage to postgres role (required for pg_cron in Supabase)
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- ─── Main Polling Schedule ─────────────────────────────────────────────────
-- Runs every hour, the edge function checks UTC hour and runs appropriate pollers:
--   Hour 0,6,12,18: federal-register + cannabis-hemp
--   Hour 2,8,14,20: state-regulations
--   Hour 3: caselaw
--   Hour 4: kratom
--   Hour 5: kava
--   Hour 6: state-legislature
--   Hour 7: congress
--   Hour 9: comment reminders
--   All other hours: federal-register only
-- ───────────────────────────────────────────────────────────────────────────

-- Remove existing job if re-running this migration
SELECT cron.unschedule('trigger-scheduled-poller-cron')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'trigger-scheduled-poller-cron'
);

-- Schedule: every hour at minute 0
SELECT cron.schedule(
  'trigger-scheduled-poller-cron',
  '0 * * * *',  -- every hour
  $$
  SELECT net.http_post(
    url := 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/scheduled-poller-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtydXdiamFzemR3enR0Ymx4cXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjcwOTIsImV4cCI6MjA3Njc0MzA5Mn0.BOmy4m7qoukUVyG1j8kDyyuA__mp9BeYdiDXL_OW-ZQ'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ─── Site Health Monitor Schedule ──────────────────────────────────────────
-- Runs every 6 hours to check site health and trigger self-healing
-- ───────────────────────────────────────────────────────────────────────────

SELECT cron.unschedule('trigger-site-monitor')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'trigger-site-monitor'
);

SELECT cron.schedule(
  'trigger-site-monitor',
  '30 */6 * * *',  -- every 6 hours at :30
  $$
  SELECT net.http_post(
    url := 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/site-monitor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtydXdiamFzemR3enR0Ymx4cXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjcwOTIsImV4cCI6MjA3Njc0MzA5Mn0.BOmy4m7qoukUVyG1j8kDyyuA__mp9BeYdiDXL_OW-ZQ'
    ),
    body := '{"heal": true}'::jsonb
  );
  $$
);

-- ─── Cleanup old health checks (keep 30 days) ─────────────────────────────

SELECT cron.unschedule('cleanup-health-checks')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-health-checks'
);

SELECT cron.schedule(
  'cleanup-health-checks',
  '0 3 * * *',  -- daily at 3 AM UTC
  $$
  DELETE FROM site_health_checks WHERE checked_at < NOW() - INTERVAL '30 days';
  DELETE FROM site_health_remediations WHERE triggered_at < NOW() - INTERVAL '30 days';
  $$
);

-- ─── Verify jobs are scheduled ─────────────────────────────────────────────
SELECT jobid, jobname, schedule, command FROM cron.job ORDER BY jobname;
