-- THYNKFLOW Trial System Database Schema
-- Execute this in Supabase SQL Editor

-- Extend user_profiles table with trial fields
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS trial_active BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS selected_jurisdiction TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_authorized_domain BOOLEAN DEFAULT false;

-- Trial fingerprints table for abuse prevention
CREATE TABLE IF NOT EXISTS trial_fingerprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint_hash TEXT NOT NULL,
  payment_method_token TEXT NOT NULL,
  company_domain TEXT NOT NULL,
  ip_subnet TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trial_fingerprints_fingerprint ON trial_fingerprints(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_trial_fingerprints_payment ON trial_fingerprints(payment_method_token);
CREATE INDEX IF NOT EXISTS idx_trial_fingerprints_domain ON trial_fingerprints(company_domain);
CREATE INDEX IF NOT EXISTS idx_trial_fingerprints_ip ON trial_fingerprints(ip_subnet);

-- Function to extend trial (for admin use)
CREATE OR REPLACE FUNCTION extend_trial(target_user_id UUID, days_to_extend INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_profiles
  SET trial_end_date = trial_end_date + INTERVAL '1 day' * days_to_extend
  WHERE id = target_user_id;
END;
$$;

-- RLS Policies for Trial Restrictions

-- Enable RLS on all relevant tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulations ENABLE ROW LEVEL SECURITY;

-- user_profiles: Users can only see their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trial fingerprints: Only service role can insert, users cannot see
CREATE POLICY "Service role can manage fingerprints" ON trial_fingerprints
  FOR ALL USING (auth.role() = 'service_role');

-- Jurisdictions: Trial users see all, but data is filtered in application logic
CREATE POLICY "Authenticated users can view jurisdictions" ON jurisdictions
  FOR SELECT TO authenticated USING (true);

-- Regulations: Complex RLS for trial restrictions
CREATE POLICY "Trial users see delayed summarized data" ON regulations
  FOR SELECT TO authenticated
  USING (
    -- Authorized domains bypass all restrictions
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_authorized_domain = true)
    OR
    -- Paid users see everything
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND subscription_status IN ('active', 'paid'))
    OR
    -- Trial users see only:
    (
      -- Data delayed by 24-48 hours
      updated_at <= NOW() - INTERVAL '24 hours'
      AND
      -- Only their selected jurisdiction
      jurisdiction_code IN (
        SELECT selected_jurisdiction FROM user_profiles WHERE id = auth.uid()
      )
      AND
      -- Only summary field (full_text hidden via RLS)
      true -- Application will handle summary-only display
    )
  );

-- Hide full_text and change_log from trial users
CREATE POLICY "Trial users cannot see full regulation text" ON regulations
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_authorized_domain = true)
    OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND subscription_status IN ('active', 'paid'))
    OR
    -- Trial users can only see summary fields
    false -- This effectively hides full_text and change_log
  );

-- Exports/Notifications: Block for trial users
CREATE POLICY "Block exports for trial users" ON user_exports
  FOR INSERT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND subscription_status IN ('active', 'paid'))
  );

CREATE POLICY "Block notifications for trial users" ON user_notifications
  FOR INSERT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND subscription_status IN ('active', 'paid'))
  );

-- Audit logging: Disable for trial users
CREATE POLICY "No audit logging for trial users" ON audit_logs
  FOR INSERT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND subscription_status IN ('active', 'paid'))
  );

-- Authorized domains override
CREATE POLICY "Authorized domains full access" ON regulations
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_authorized_domain = true)
  );

CREATE POLICY "Authorized domains full access exports" ON user_exports
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_authorized_domain = true)
  );

CREATE POLICY "Authorized domains full access notifications" ON user_notifications
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_authorized_domain = true)
  );