-- Migration: fix beta crawl schema issues
BEGIN;

-- 1) user_profiles: add missing columns idempotently
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- 2) user_favorites: ensure instrument_id exists (nullable initially)
ALTER TABLE public.user_favorites
  ADD COLUMN IF NOT EXISTS instrument_id UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_favorites'
      AND column_name = 'regulation_id'
  ) THEN
    -- 2a) Backfill instrument_id from regulation_id -> instrument.external_id
    WITH to_update AS (
      SELECT uf.id AS uf_id, i.id AS instrument_id
      FROM public.user_favorites uf
      JOIN public.instrument i ON i.external_id = uf.regulation_id
      WHERE uf.instrument_id IS NULL AND uf.regulation_id IS NOT NULL
    )
    UPDATE public.user_favorites uf
    SET instrument_id = t.instrument_id
    FROM to_update t
    WHERE uf.id = t.uf_id;

    -- 2c) Drop the legacy regulation_id column now that instrument_id is authoritative
    ALTER TABLE public.user_favorites
      DROP COLUMN regulation_id;
  END IF;
END
$$;

-- 2b) Deduplicate rows that would violate UNIQUE(user_id, instrument_id)
WITH ranked AS (
  SELECT id, user_id, instrument_id,
         ROW_NUMBER() OVER (PARTITION BY user_id, instrument_id ORDER BY created_at NULLS FIRST, id) AS rn
  FROM public.user_favorites
  WHERE instrument_id IS NOT NULL
)
DELETE FROM public.user_favorites u
USING ranked r
WHERE u.id = r.id AND r.rn > 1;

-- 2d) Make instrument_id NOT NULL once backfill and dedupe are complete.
ALTER TABLE public.user_favorites
  ALTER COLUMN instrument_id SET NOT NULL;

-- 2e) Add unique constraint (index) on (user_id, instrument_id) concurrently where possible.
-- CREATE UNIQUE INDEX CONCURRENTLY is not allowed inside a transaction block, so create normally if transaction fails.
-- We try to create using IF NOT EXISTS via index name; if the index already exists it's a no-op.
CREATE UNIQUE INDEX IF NOT EXISTS user_favorites_user_instrument_unique
  ON public.user_favorites (user_id, instrument_id);

-- 3) Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- 3a) Drop/recreate policies for user_favorites using best-practice auth.uid() wrapper
DROP POLICY IF EXISTS "user_favorites_select" ON public.user_favorites;
DROP POLICY IF EXISTS "user_favorites_insert" ON public.user_favorites;
DROP POLICY IF EXISTS "user_favorites_update" ON public.user_favorites;
DROP POLICY IF EXISTS "user_favorites_delete" ON public.user_favorites;

CREATE POLICY "user_favorites_select"
  ON public.user_favorites FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_favorites_insert"
  ON public.user_favorites FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_favorites_update"
  ON public.user_favorites FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_favorites_delete"
  ON public.user_favorites FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 4) user_alerts: add missing columns idempotently and harmonize names
-- We preserve existing columns and add 'name' and 'criteria' if missing.
ALTER TABLE public.user_alerts
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS criteria JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- If existing schema uses alert_name, copy data into name if name is null
UPDATE public.user_alerts
SET name = COALESCE(name, alert_name)
WHERE (name IS NULL OR name = '') AND alert_name IS NOT NULL;

-- 4a) Enable RLS and recreate policies for user_alerts
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_alerts_select" ON public.user_alerts;
DROP POLICY IF EXISTS "user_alerts_insert" ON public.user_alerts;
DROP POLICY IF EXISTS "user_alerts_update" ON public.user_alerts;
DROP POLICY IF EXISTS "user_alerts_delete" ON public.user_alerts;

CREATE POLICY "user_alerts_select"
  ON public.user_alerts FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_alerts_insert"
  ON public.user_alerts FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_alerts_update"
  ON public.user_alerts FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_alerts_delete"
  ON public.user_alerts FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 5) Indexes (schema-qualified, idempotent)
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_instrument_id ON public.user_favorites(instrument_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON public.user_favorites(created_at);

CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON public.user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_is_active ON public.user_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_user_alerts_created_at ON public.user_alerts(created_at);

-- 6) Ensure updated_at auto-update trigger exists and attach to tables
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Attach trigger to user_favorites
DROP TRIGGER IF EXISTS set_updated_at_on_user_favorites ON public.user_favorites;
CREATE TRIGGER set_updated_at_on_user_favorites
  BEFORE UPDATE ON public.user_favorites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Attach trigger to user_alerts
DROP TRIGGER IF EXISTS set_updated_at_on_user_alerts ON public.user_alerts;
CREATE TRIGGER set_updated_at_on_user_alerts
  BEFORE UPDATE ON public.user_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7) user_profiles: ensure email_verified and saved_searches defaults exist (if someone runs older DB)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS saved_searches JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- If email_verified or saved_searches exist but lack defaults, set defaults (Postgres preserves existing defaults when using IF NOT EXISTS)
-- (No-op if defaults already set.)

-- 8) Good practice: ensure indexes for user_profiles (if you query by email or id)
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles (email);

COMMIT;