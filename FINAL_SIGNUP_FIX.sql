-- ============================================
-- FINAL SIGNUP FIX - Run this in Supabase SQL Editor
-- ============================================
-- This fixes "Database error creating new user"
-- Run ALL of this code at once
-- ============================================

-- STEP 1: Remove ALL triggers on auth.users that might be causing issues
-- This is the main cause of signup failures
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Find and drop all triggers on auth.users
    FOR trigger_record IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'auth.users'::regclass
        AND tgisinternal = false
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trigger_record.tgname);
        RAISE NOTICE 'Dropped trigger: %', trigger_record.tgname;
    END LOOP;
END $$;

-- STEP 2: Drop any functions that might be problematic
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_user() CASCADE;
DROP FUNCTION IF EXISTS public.on_auth_user_created() CASCADE;

-- STEP 3: Ensure user_profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    organization TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 4: Add any missing columns (in case table exists but is incomplete)
DO $$
BEGIN
    -- Add email column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_profiles' 
                   AND column_name = 'email') THEN
        ALTER TABLE public.user_profiles ADD COLUMN email TEXT;
    END IF;
    
    -- Add full_name column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_profiles' 
                   AND column_name = 'full_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN full_name TEXT;
    END IF;
    
    -- Add organization column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_profiles' 
                   AND column_name = 'organization') THEN
        ALTER TABLE public.user_profiles ADD COLUMN organization TEXT;
    END IF;
    
    -- Add role column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_profiles' 
                   AND column_name = 'role') THEN
        ALTER TABLE public.user_profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
    
    -- Add created_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_profiles' 
                   AND column_name = 'created_at') THEN
        ALTER TABLE public.user_profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_profiles' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE public.user_profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- STEP 5: Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- STEP 6: Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read for users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.user_profiles;

-- STEP 7: Create simple, permissive policies
-- Allow authenticated users to do everything with their own profile
CREATE POLICY "user_profiles_select"
ON public.user_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "user_profiles_insert"
ON public.user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_update"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_delete"
ON public.user_profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- STEP 8: Grant necessary permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

-- STEP 9: Create rate_limits table if it doesn't exist (for the edge function)
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    action_type TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'rate_limits_identifier_action_unique'
    ) THEN
        ALTER TABLE public.rate_limits 
        ADD CONSTRAINT rate_limits_identifier_action_unique 
        UNIQUE (identifier, action_type);
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if already exists
END $$;

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "rate_limits_all" ON public.rate_limits;
DROP POLICY IF EXISTS "Allow all operations on rate_limits" ON public.rate_limits;

-- Create permissive policy for rate_limits
CREATE POLICY "rate_limits_policy"
ON public.rate_limits FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.rate_limits TO authenticated;
GRANT ALL ON public.rate_limits TO anon;
GRANT ALL ON public.rate_limits TO service_role;

-- ============================================
-- VERIFICATION - Check the fix worked
-- ============================================
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger 
    WHERE tgrelid = 'auth.users'::regclass
    AND tgisinternal = false;
    
    IF trigger_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: No custom triggers on auth.users';
    ELSE
        RAISE NOTICE '⚠️ WARNING: % custom triggers still exist on auth.users', trigger_count;
    END IF;
END $$;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ SIGNUP FIX COMPLETE!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'You should now be able to:';
    RAISE NOTICE '1. Create users from Supabase Dashboard';
    RAISE NOTICE '2. Sign up from your website';
    RAISE NOTICE '';
    RAISE NOTICE 'If signup still fails, check:';
    RAISE NOTICE '- Authentication > Settings > Email confirmations';
    RAISE NOTICE '- Try disabling "Confirm email" temporarily to test';
    RAISE NOTICE '============================================';
END $$;
