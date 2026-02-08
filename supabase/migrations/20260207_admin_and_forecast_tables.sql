-- Add role column to user_profiles + set admin + create forecast tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/kruwbjaszdwzttblxqwr/sql/new

-- ==========================================
-- 1. Add role column to user_profiles
-- ==========================================
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Set admin accounts: first insert profile if missing, then update
-- This looks up your UUID from auth.users and creates/updates the profile
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  -- Loop through all @thynk.guru auth users
  FOR auth_user IN
    SELECT id, email, raw_user_meta_data->>'full_name' as full_name, created_at
    FROM auth.users
    WHERE email ILIKE '%@thynk.guru'
  LOOP
    -- Insert profile if it doesn't exist
    INSERT INTO public.user_profiles (id, email, full_name, role, subscription_status, subscription_started_at, subscription_ends_at, trial_started_at, trial_ends_at, created_at, updated_at)
    VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(auth_user.full_name, 'Admin'),
      'admin',
      'active',
      NOW(),
      NOW() + INTERVAL '100 years',
      auth_user.created_at,
      NOW() + INTERVAL '100 years',
      auth_user.created_at,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      subscription_status = 'active',
      subscription_started_at = NOW(),
      subscription_ends_at = NOW() + INTERVAL '100 years',
      updated_at = NOW();

    RAISE NOTICE 'Set admin: % (%)', auth_user.email, auth_user.id;
  END LOOP;
END $$;

-- ==========================================
-- 2. Create regulatory_forecasts table
-- ==========================================
CREATE TABLE IF NOT EXISTS regulatory_forecasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jurisdiction_id UUID REFERENCES jurisdiction(id),
  product TEXT NOT NULL,
  prediction_type TEXT NOT NULL DEFAULT 'regulatory_change',
  direction TEXT NOT NULL DEFAULT 'restrictive',
  confidence NUMERIC(5,2) NOT NULL DEFAULT 50.0,
  predicted_quarter TEXT,
  predicted_date DATE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  rationale TEXT,
  risk_level TEXT DEFAULT 'medium',
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  supporting_signals JSONB DEFAULT '[]'::jsonb,
  model_version TEXT DEFAULT 'gpt-4o-mini-v1',
  data_points_analyzed INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forecasts_product ON regulatory_forecasts(product);
CREATE INDEX IF NOT EXISTS idx_forecasts_jurisdiction ON regulatory_forecasts(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_confidence ON regulatory_forecasts(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_forecasts_status ON regulatory_forecasts(status);
CREATE INDEX IF NOT EXISTS idx_forecasts_risk ON regulatory_forecasts(risk_level);
CREATE INDEX IF NOT EXISTS idx_forecasts_created ON regulatory_forecasts(created_at DESC);

ALTER TABLE regulatory_forecasts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'regulatory_forecasts' AND policyname = 'Anyone can read forecasts') THEN
    CREATE POLICY "Anyone can read forecasts" ON regulatory_forecasts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'regulatory_forecasts' AND policyname = 'Service role can manage forecasts') THEN
    CREATE POLICY "Service role can manage forecasts" ON regulatory_forecasts FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ==========================================
-- 3. Create forecast_scenarios table
-- ==========================================
CREATE TABLE IF NOT EXISTS forecast_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE forecast_scenarios ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'forecast_scenarios' AND policyname = 'Users can manage own scenarios') THEN
    CREATE POLICY "Users can manage own scenarios" ON forecast_scenarios FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ==========================================
-- 4. Verify
-- ==========================================
SELECT 'Admin accounts:' as info;
SELECT id, email, role FROM public.user_profiles WHERE role = 'admin';

SELECT 'Tables created:' as info;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('regulatory_forecasts', 'forecast_scenarios');
