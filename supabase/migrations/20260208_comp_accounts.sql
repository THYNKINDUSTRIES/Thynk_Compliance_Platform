-- =============================================================================
-- Comp Accounts Table
-- Allows specific emails to automatically receive full paid access on signup
-- To add a comp account: INSERT INTO comp_accounts (email) VALUES ('user@example.com');
-- =============================================================================

-- Create the comp_accounts table
CREATE TABLE IF NOT EXISTS comp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  notes TEXT,                          -- Optional: why this account is comped
  granted_by TEXT DEFAULT 'admin',     -- Who granted the comp
  expires_at TIMESTAMPTZ,             -- NULL = never expires
  is_active BOOLEAN DEFAULT true,     -- Can be deactivated without deleting
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast email lookups during signup
CREATE INDEX IF NOT EXISTS idx_comp_accounts_email ON comp_accounts (email);
CREATE INDEX IF NOT EXISTS idx_comp_accounts_active ON comp_accounts (is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE comp_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read (needed for signup check with anon key)
DROP POLICY IF EXISTS "comp_accounts_read_all" ON comp_accounts;
CREATE POLICY "comp_accounts_read_all" ON comp_accounts
  FOR SELECT USING (true);

-- Policy: Only admins can insert/update/delete
DROP POLICY IF EXISTS "comp_accounts_admin_write" ON comp_accounts;
CREATE POLICY "comp_accounts_admin_write" ON comp_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- =============================================================================
-- Seed some comp accounts (add your emails here!)
-- =============================================================================
-- INSERT INTO comp_accounts (email, notes) VALUES
--   ('friend@example.com', 'Early supporter'),
--   ('partner@company.com', 'Strategic partner');
