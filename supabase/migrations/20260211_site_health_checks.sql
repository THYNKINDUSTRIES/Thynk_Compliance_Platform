-- Site Health Checks table
-- Stores results from the site-monitor edge function
-- Used by the admin monitoring dashboard

CREATE TABLE IF NOT EXISTS site_health_checks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  check_type text NOT NULL,          -- 'page' | 'edge_function' | 'database' | 'ssl'
  check_name text NOT NULL,          -- e.g. 'Homepage', 'cannabis-hemp-poller', 'connectivity'
  status text NOT NULL DEFAULT 'pass', -- 'pass' | 'warn' | 'fail'
  response_time_ms integer NOT NULL DEFAULT 0,
  details jsonb DEFAULT '{}'::jsonb,
  checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying by type and time
CREATE INDEX IF NOT EXISTS idx_health_checks_type_time
  ON site_health_checks (check_type, checked_at DESC);

-- Index for querying recent checks
CREATE INDEX IF NOT EXISTS idx_health_checks_recent
  ON site_health_checks (checked_at DESC);

-- Index for failed checks
CREATE INDEX IF NOT EXISTS idx_health_checks_failures
  ON site_health_checks (status, checked_at DESC)
  WHERE status = 'fail';

-- Enable RLS
ALTER TABLE site_health_checks ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert (edge function uses service role key)
CREATE POLICY "Service role can insert health checks"
  ON site_health_checks
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow service role to read all
CREATE POLICY "Service role can read health checks"
  ON site_health_checks
  FOR SELECT
  TO service_role
  USING (true);

-- Allow authenticated users to read (for admin dashboard)
CREATE POLICY "Authenticated users can read health checks"
  ON site_health_checks
  FOR SELECT
  TO authenticated
  USING (true);

-- Auto-cleanup: delete checks older than 30 days (optional cron)
-- You can set up a pg_cron job:
-- SELECT cron.schedule('cleanup-health-checks', '0 3 * * *',
--   $$DELETE FROM site_health_checks WHERE checked_at < now() - interval '30 days'$$
-- );

-- Summary view for easy dashboard queries
CREATE OR REPLACE VIEW site_health_summary AS
SELECT 
  check_type,
  check_name,
  status,
  response_time_ms,
  details,
  checked_at,
  ROW_NUMBER() OVER (PARTITION BY check_type, check_name ORDER BY checked_at DESC) as rn
FROM site_health_checks;

-- Latest check per (type, name) — the "current status" view
CREATE OR REPLACE VIEW site_health_latest AS
SELECT check_type, check_name, status, response_time_ms, details, checked_at
FROM site_health_summary
WHERE rn = 1;
