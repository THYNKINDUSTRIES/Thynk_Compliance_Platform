-- ============================================
-- FIX TRIAL SIGNUP - Run in Supabase SQL Editor
-- ============================================
-- This restores the handle_new_user trigger (removed by FINAL_SIGNUP_FIX.sql)
-- and fixes existing users who have no profile row.
-- ============================================

-- STEP 1: Recreate the handle_new_user trigger function
-- This runs as SECURITY DEFINER so it bypasses RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  trial_end TIMESTAMPTZ;
BEGIN
  trial_end := NOW() + INTERVAL '3 days';
  
  -- Insert user profile with trial defaults
  INSERT INTO public.user_profiles (
    id, email, full_name, role,
    subscription_status, trial_started_at, trial_ends_at, trial_end_date,
    created_at, updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user',
    'trial',
    NOW(),
    trial_end,
    trial_end,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert default notification preferences
  INSERT INTO public.notification_preferences (
    user_id, digest_enabled
  )
  VALUES (NEW.id, false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- STEP 2: Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- STEP 4: Fix existing users who have auth accounts but no profile rows
-- This creates profile rows for any auth.users that are missing one
INSERT INTO public.user_profiles (
  id, email, full_name, role,
  subscription_status, trial_started_at, trial_ends_at, trial_end_date,
  created_at, updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  'user',
  'trial',
  au.created_at,
  -- Give them a fresh 3-day trial from NOW (not from original signup)
  NOW() + INTERVAL '3 days',
  NOW() + INTERVAL '3 days',
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- STEP 5: Verify the fix
SELECT 
  'auth_users' AS source,
  COUNT(*) AS count
FROM auth.users
UNION ALL
SELECT 
  'user_profiles' AS source,
  COUNT(*) AS count
FROM public.user_profiles
UNION ALL
SELECT
  'missing_profiles' AS source,
  COUNT(*) AS count
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE up.id IS NULL;
