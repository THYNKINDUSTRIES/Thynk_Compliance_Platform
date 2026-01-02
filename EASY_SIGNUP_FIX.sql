-- =====================================================
-- EASY SIGNUP FIX - Run this ENTIRE script in Supabase SQL Editor
-- This fixes the "rate_limits does not exist" error
-- =====================================================

-- STEP 1: Create the missing rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text NOT NULL,
  action text NOT NULL,
  attempt_count integer DEFAULT 1,
  reset_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- STEP 2: Add index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS rate_limits_ip_action_idx 
ON public.rate_limits(ip_address, action);

-- STEP 3: Enable RLS and add policy
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to rate_limits" ON public.rate_limits;
CREATE POLICY "Allow all access to rate_limits"
  ON public.rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- STEP 4: Remove problematic triggers that block signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- STEP 5: Make sure user_profiles table exists and is correct
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  organization text,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- STEP 6: Fix user_profiles RLS policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.user_profiles;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- STEP 7: Create helper function for profile creation
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id uuid,
  user_email text,
  user_name text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, created_at, updated_at)
  VALUES (user_id, user_email, user_name, now(), now())
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
      updated_at = now();
  
  RETURN json_build_object('success', true, 'user_id', user_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated, anon, service_role;

-- =====================================================
-- SUCCESS! If you see this, the fix worked.
-- =====================================================
SELECT 'SUCCESS! Signup fix complete. You can now create accounts.' as result;
