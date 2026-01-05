-- ============================================
-- FIX BETA CRAWL SCHEMA ISSUES
-- ============================================
-- This migration fixes the database schema issues
-- discovered during beta testing
-- ============================================

-- Add missing columns to user_profiles table
DO $$
BEGIN
    -- Add email_verified column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'user_profiles'
                   AND column_name = 'email_verified') THEN
        ALTER TABLE public.user_profiles ADD COLUMN email_verified BOOLEAN DEFAULT false;
    END IF;

    -- Add saved_searches column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'user_profiles'
                   AND column_name = 'saved_searches') THEN
        ALTER TABLE public.user_profiles ADD COLUMN saved_searches JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add onboarding_completed column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'user_profiles'
                   AND column_name = 'onboarding_completed') THEN
        ALTER TABLE public.user_profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    END IF;

    -- Add onboarding_completed_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'user_profiles'
                   AND column_name = 'onboarding_completed_at') THEN
        ALTER TABLE public.user_profiles ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create user_favorites table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instrument_id UUID NOT NULL, -- Removed foreign key constraint for now
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one favorite per user per instrument
    UNIQUE(user_id, instrument_id)
);

-- Enable RLS on user_favorites
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for user_favorites
DROP POLICY IF EXISTS "user_favorites_select" ON public.user_favorites;
DROP POLICY IF EXISTS "user_favorites_insert" ON public.user_favorites;
DROP POLICY IF EXISTS "user_favorites_delete" ON public.user_favorites;

CREATE POLICY "user_favorites_select"
ON public.user_favorites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "user_favorites_insert"
ON public.user_favorites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_favorites_delete"
ON public.user_favorites FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_instrument_id ON user_favorites(instrument_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at);

-- Create user_alerts table if it doesn't exist (referenced in dashboard)
CREATE TABLE IF NOT EXISTS public.user_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    criteria JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_alerts
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for user_alerts
DROP POLICY IF EXISTS "user_alerts_select" ON public.user_alerts;
DROP POLICY IF EXISTS "user_alerts_insert" ON public.user_alerts;
DROP POLICY IF EXISTS "user_alerts_update" ON public.user_alerts;
DROP POLICY IF EXISTS "user_alerts_delete" ON public.user_alerts;

CREATE POLICY "user_alerts_select"
ON public.user_alerts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "user_alerts_insert"
ON public.user_alerts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_alerts_update"
ON public.user_alerts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "user_alerts_delete"
ON public.user_alerts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for user_alerts
CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_is_active ON user_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_user_alerts_created_at ON user_alerts(created_at);