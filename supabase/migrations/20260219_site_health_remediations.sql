-- Site Health Remediations table
-- Tracks auto-fix actions taken by the self-healing monitor

CREATE TABLE IF NOT EXISTS site_health_remediations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  issue text NOT NULL,               -- What was detected: 'Stale data detected', 'Page 5xx detected', etc.
  action text NOT NULL,              -- What was done: 'auto_trigger_poller:federal-register-poller', 'vercel_redeploy', etc.
  status text NOT NULL DEFAULT 'triggered', -- 'triggered' | 'success' | 'failed' | 'skipped'
  details jsonb DEFAULT '{}'::jsonb,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for recent remediations
CREATE INDEX IF NOT EXISTS idx_remediations_recent
  ON site_health_remediations (triggered_at DESC);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_remediations_status
  ON site_health_remediations (status, triggered_at DESC);

-- Enable RLS
ALTER TABLE site_health_remediations ENABLE ROW LEVEL SECURITY;

-- Service role can insert (edge function)
CREATE POLICY "Service role can insert remediations"
  ON site_health_remediations
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Service role can read
CREATE POLICY "Service role can read remediations"
  ON site_health_remediations
  FOR SELECT
  TO service_role
  USING (true);

-- Authenticated users can read (admin dashboard)
CREATE POLICY "Authenticated users can read remediations"
  ON site_health_remediations
  FOR SELECT
  TO authenticated
  USING (true);
