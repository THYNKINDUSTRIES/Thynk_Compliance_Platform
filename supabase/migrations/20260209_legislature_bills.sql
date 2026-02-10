-- Legislature Bills table for the state-legislature-poller and LegislatureBills page
-- Stores detailed bill data from LegiScan and OpenStates APIs

CREATE TABLE IF NOT EXISTS legislature_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL,
  bill_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  state_code TEXT NOT NULL,          -- 2-letter code (CA, NY, etc.)
  session TEXT,                       -- e.g. "2025-2026 Regular Session"
  session_year INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  status TEXT NOT NULL DEFAULT 'introduced',
  status_date TIMESTAMPTZ,
  last_action TEXT,
  last_action_date TIMESTAMPTZ,
  chamber TEXT,                       -- house, senate, joint
  bill_type TEXT,                     -- bill, resolution, joint_resolution, etc.
  sponsors JSONB DEFAULT '[]'::jsonb,
  cosponsors JSONB DEFAULT '[]'::jsonb,
  subjects TEXT[] DEFAULT '{}',
  votes JSONB DEFAULT '[]'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  amendments JSONB DEFAULT '[]'::jsonb,
  source TEXT,                        -- legiscan, openstates, etc.
  source_url TEXT,
  full_text_url TEXT,
  is_cannabis_related BOOLEAN DEFAULT false,
  cannabis_keywords TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_legislature_bills_state_code ON legislature_bills(state_code);
CREATE INDEX IF NOT EXISTS idx_legislature_bills_status ON legislature_bills(status);
CREATE INDEX IF NOT EXISTS idx_legislature_bills_session_year ON legislature_bills(session_year);
CREATE INDEX IF NOT EXISTS idx_legislature_bills_chamber ON legislature_bills(chamber);
CREATE INDEX IF NOT EXISTS idx_legislature_bills_cannabis ON legislature_bills(is_cannabis_related);
CREATE INDEX IF NOT EXISTS idx_legislature_bills_last_action ON legislature_bills(last_action_date DESC);
CREATE INDEX IF NOT EXISTS idx_legislature_bills_external ON legislature_bills(external_id);

-- Enable RLS
ALTER TABLE legislature_bills ENABLE ROW LEVEL SECURITY;

-- Public read access (regulations are public data)
CREATE POLICY "Anyone can read legislature bills"
  ON legislature_bills FOR SELECT
  USING (true);

-- Service role can insert/update (pollers use service role key)
CREATE POLICY "Service role can manage legislature bills"
  ON legislature_bills FOR ALL
  USING (auth.role() = 'service_role');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_legislature_bills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER legislature_bills_updated_at
  BEFORE UPDATE ON legislature_bills
  FOR EACH ROW
  EXECUTE FUNCTION update_legislature_bills_updated_at();
