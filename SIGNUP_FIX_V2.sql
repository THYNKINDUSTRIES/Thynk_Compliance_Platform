-- ALTERNATIVE FIX: Disable trigger and handle in application
-- This is more reliable than database triggers

-- Step 1: Drop the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Step 2: Ensure RLS policies allow profile creation
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (we'll validate in app)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
CREATE POLICY "Enable insert for authenticated users" ON user_profiles
  FOR INSERT WITH CHECK (true);

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Step 3: Same for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON notification_preferences;
CREATE POLICY "Enable insert for authenticated users" ON notification_preferences
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
CREATE POLICY "Users can view own preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON notification_preferences;
CREATE POLICY "Users can update own preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Done! Now the app will handle profile creation
