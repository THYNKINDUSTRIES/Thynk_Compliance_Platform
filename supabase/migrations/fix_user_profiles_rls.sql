-- ============================================
-- FIX USER_PROFILES RLS INFINITE RECURSION
-- ============================================
-- Run this in Supabase SQL Editor to fix the
-- "infinite recursion detected in policy" error
-- ============================================

-- STEP 1: Disable RLS temporarily to clean up
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies on user_profiles
-- This ensures no conflicting or recursive policies remain
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- STEP 3: Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create simple, non-recursive policies
-- These policies ONLY use auth.uid() which is a built-in function
-- and does NOT query any tables, preventing recursion

-- SELECT: Users can only view their own profile
-- Using auth.uid() = id is safe and non-recursive
CREATE POLICY "user_profiles_select_own"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- INSERT: Users can only insert their own profile
-- The id must match the authenticated user's id
CREATE POLICY "user_profiles_insert_own"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- UPDATE: Users can only update their own profile
CREATE POLICY "user_profiles_update_own"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- DELETE: Users can only delete their own profile
CREATE POLICY "user_profiles_delete_own"
ON public.user_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- STEP 5: Allow service_role to bypass RLS (for admin operations)
-- Service role already bypasses RLS by default, but grant permissions anyway
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.user_profiles TO authenticated;

-- STEP 6: Create an index on id for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND schemaname = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ RLS FIX COMPLETE';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Created % policies on user_profiles', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Policies created:';
    RAISE NOTICE '  - user_profiles_select_own (SELECT)';
    RAISE NOTICE '  - user_profiles_insert_own (INSERT)';
    RAISE NOTICE '  - user_profiles_update_own (UPDATE)';
    RAISE NOTICE '  - user_profiles_delete_own (DELETE)';
    RAISE NOTICE '';
    RAISE NOTICE 'These policies use auth.uid() = id which is';
    RAISE NOTICE 'non-recursive and safe.';
    RAISE NOTICE '============================================';
END $$;

-- List all current policies for verification
SELECT 
    policyname as "Policy Name",
    cmd as "Command",
    qual as "USING clause",
    with_check as "WITH CHECK clause"
FROM pg_policies 
WHERE tablename = 'user_profiles' 
AND schemaname = 'public'
ORDER BY policyname;
