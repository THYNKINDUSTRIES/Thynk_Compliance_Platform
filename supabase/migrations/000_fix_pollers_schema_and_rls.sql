-- Migration: Fix poller schema and RLS to allow anon-based local testing
-- Add missing columns, dedupe & add unique constraint, and add temporary RLS policies

BEGIN;

-- 1) Ensure metadata column exists on data_population_progress
ALTER TABLE IF EXISTS public.data_population_progress
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- 2) Ensure source column exists on ingestion_log
ALTER TABLE IF EXISTS public.ingestion_log
  ADD COLUMN IF NOT EXISTS source text;

-- 3) Remove duplicate rows for (session_id, source_name) keeping earliest created_at
-- Uses ctid to avoid reliance on a specific PK name
DELETE FROM public.data_population_progress a
USING (
  SELECT ctid FROM (
    SELECT ctid, ROW_NUMBER() OVER (PARTITION BY session_id, source_name ORDER BY COALESCE(created_at, now())) as rn
    FROM public.data_population_progress
  ) t WHERE t.rn > 1
) b
WHERE a.ctid = b.ctid;

-- 4) Create unique index on (session_id, source_name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i' AND c.relname = 'uq_data_population_progress_session_source'
  ) THEN
    CREATE UNIQUE INDEX uq_data_population_progress_session_source ON public.data_population_progress (session_id, source_name);
  END IF;
END$$;

-- 5) Ensure RLS is enabled on tables and add temporary permissive policies for anon (for local testing)
-- Note: service_role bypasses RLS by default. Consider tightening these policies for production.

ALTER TABLE IF EXISTS public.instrument ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ingestion_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.data_population_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies we may recreate (safe to attempt)
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('instrument','ingestion_log','data_population_progress')
  LOOP
    IF p.policyname LIKE 'anon_%_policy' THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, (CASE WHEN p.policyname ~* 'instrument' THEN 'instrument' WHEN p.policyname ~* 'ingestion' THEN 'ingestion_log' ELSE 'data_population_progress' END));
    END IF;
  END LOOP;
END$$;

-- Create simple policies to allow anon role inserts/updates for these tables (for testing).
-- Review and tighten these before using in production.

CREATE POLICY IF NOT EXISTS anon_insert_instrument ON public.instrument
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS anon_update_instrument ON public.instrument
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS anon_insert_ingestion_log ON public.ingestion_log
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS anon_insert_progress ON public.data_population_progress
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS anon_update_progress ON public.data_population_progress
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

COMMIT;

-- Verification queries (run separately to inspect results):
-- SELECT column_name,data_type FROM information_schema.columns WHERE table_name='data_population_progress';
-- SELECT indexname FROM pg_indexes WHERE tablename='data_population_progress';
-- SELECT policyname,cmd FROM pg_policies WHERE tablename IN ('instrument','ingestion_log','data_population_progress');
