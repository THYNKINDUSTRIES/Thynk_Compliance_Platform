-- Complete fix for signup issues (400, 422, 500 errors)
-- Run this in Supabase SQL Editor

-- 1. Drop problematic triggers that cause 500 errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Ensure user_profiles table has proper structure
ALTER TABLE public.user_profiles 
  DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- 3. Fix RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Fix rate_limits table RLS
DROP POLICY IF EXISTS "Allow service role full access" ON public.rate_limits;

CREATE POLICY "Allow service role full access"
  ON public.rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 6. Create helper function for profile creation (called from app, not trigger)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id uuid,
  user_email text,
  user_name text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, created_at, updated_at)
  VALUES (user_id, user_email, user_name, now(), now())
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
      updated_at = now();
  
  SELECT json_build_object(
    'success', true,
    'user_id', user_id
  ) INTO result;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated, anon;

-- 7. Verify table structure
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_profiles' AND column_name = 'id') THEN
    RAISE EXCEPTION 'user_profiles table missing id column';
  END IF;
END $$;

-- Success message
SELECT 'Signup fix applied successfully. Triggers removed, RLS policies fixed, profile creation moved to application code.' as status;
