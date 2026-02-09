-- =============================================================================
-- Create missing user_favorites, user_alerts tables + comment reminder columns
-- Run this in Supabase SQL Editor
-- =============================================================================

-- 1) user_favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_favorites_user_instrument_unique
  ON public.user_favorites (user_id, instrument_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_instrument_id ON public.user_favorites(instrument_id);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_favorites_select" ON public.user_favorites;
CREATE POLICY "user_favorites_select" ON public.user_favorites
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_favorites_insert" ON public.user_favorites;
CREATE POLICY "user_favorites_insert" ON public.user_favorites
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_favorites_delete" ON public.user_favorites;
CREATE POLICY "user_favorites_delete" ON public.user_favorites
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);


-- 2) user_alerts table
CREATE TABLE IF NOT EXISTS public.user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  alert_name TEXT,
  criteria JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON public.user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_is_active ON public.user_alerts(is_active);

ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_alerts_select" ON public.user_alerts;
CREATE POLICY "user_alerts_select" ON public.user_alerts
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_alerts_insert" ON public.user_alerts;
CREATE POLICY "user_alerts_insert" ON public.user_alerts
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_alerts_update" ON public.user_alerts;
CREATE POLICY "user_alerts_update" ON public.user_alerts
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_alerts_delete" ON public.user_alerts;
CREATE POLICY "user_alerts_delete" ON public.user_alerts
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);


-- 3) Add comment reminder columns to user_profiles (if missing)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS comment_reminders_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS comment_reminder_7_days BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS comment_reminder_3_days BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS comment_reminder_1_day BOOLEAN DEFAULT true;


-- 4) comment_deadline_reminders table (used by FavoriteButton)
CREATE TABLE IF NOT EXISTS public.comment_deadline_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument_id UUID NOT NULL,
  comment_deadline TIMESTAMPTZ NOT NULL,
  reminded_7_days BOOLEAN DEFAULT false,
  reminded_3_days BOOLEAN DEFAULT false,
  reminded_1_day BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comment_reminders_user ON public.comment_deadline_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_reminders_deadline ON public.comment_deadline_reminders(comment_deadline);

ALTER TABLE public.comment_deadline_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comment_reminders_select" ON public.comment_deadline_reminders;
CREATE POLICY "comment_reminders_select" ON public.comment_deadline_reminders
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "comment_reminders_insert" ON public.comment_deadline_reminders;
CREATE POLICY "comment_reminders_insert" ON public.comment_deadline_reminders
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "comment_reminders_delete" ON public.comment_deadline_reminders;
CREATE POLICY "comment_reminders_delete" ON public.comment_deadline_reminders
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);


-- 5) Updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at_on_user_favorites ON public.user_favorites;
CREATE TRIGGER set_updated_at_on_user_favorites
  BEFORE UPDATE ON public.user_favorites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_on_user_alerts ON public.user_alerts;
CREATE TRIGGER set_updated_at_on_user_alerts
  BEFORE UPDATE ON public.user_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
