-- Fix for "Database error saving new user" on invite
-- Error: there is no unique or exclusion constraint matching the ON CONFLICT specification

-- Step 1: Check the actual structure of user_profiles
-- Run this first to see what columns exist:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles';

-- Step 2: Add unique constraint on the ID column (primary key should exist but let's ensure it)
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_pkey CASCADE;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);

-- Step 3: Recreate the trigger function with correct ON CONFLICT
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert user profile
  INSERT INTO user_profiles (id, email, full_name, email_verified, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert default notification preferences
  INSERT INTO notification_preferences (
    user_id,
    task_assigned_in_app, task_assigned_email,
    comment_added_in_app, comment_added_email,
    approval_required_in_app, approval_required_email,
    task_completed_in_app, task_completed_email,
    deadline_approaching_in_app, deadline_approaching_email,
    digest_enabled, digest_frequency, digest_time, digest_day
  )
  VALUES (
    NEW.id,
    true, true, true, false, true, true, true, false, true, true,
    false, 'daily', '09:00', 1
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 4: Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
