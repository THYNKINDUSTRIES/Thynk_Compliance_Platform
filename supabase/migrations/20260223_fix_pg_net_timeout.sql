-- =============================================================================
-- Fix pg_net 5000ms timeout on scheduled-poller-cron
-- =============================================================================
-- PROBLEM: net.http_post() defaults to 5000ms timeout, but scheduled-poller-cron
--   calls multiple edge functions sequentially and can take several minutes.
--   This causes the cron trigger to time out before the pollers finish.
--
-- FIX: Add timeout_milliseconds := 300000 (5 minutes) to the HTTP call.
--
-- Run this in the Supabase SQL Editor.
-- =============================================================================

-- Remove existing jobs
SELECT cron.unschedule('trigger-scheduled-poller-cron')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'trigger-scheduled-poller-cron'
);

SELECT cron.unschedule('trigger-site-monitor')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'trigger-site-monitor'
);

-- Re-schedule with 5-minute timeout (300000 ms)
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
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
  $$
);

-- Re-schedule site monitor with 2-minute timeout (120000 ms)
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
    body := '{"heal": true}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
