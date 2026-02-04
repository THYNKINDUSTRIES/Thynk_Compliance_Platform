-- Migration: Add updated_at trigger to instrument table
-- This ensures that updated_at is automatically updated when records are modified

BEGIN;

-- Ensure updated_at column exists on instrument table
ALTER TABLE IF EXISTS public.instrument
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create the set_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Attach the trigger to the instrument table
DROP TRIGGER IF EXISTS set_updated_at_on_instrument ON public.instrument;
CREATE TRIGGER set_updated_at_on_instrument
  BEFORE UPDATE ON public.instrument
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;