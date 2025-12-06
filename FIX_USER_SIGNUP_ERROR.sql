-- FIX FOR: "there is no unique or exclusion constraint matching the ON CONFLICT specification"
-- This error occurs when a trigger tries to use ON CONFLICT but the table lacks the required constraint

-- Step 1: Add unique constraint to user_profiles.user_id
-- This allows ON CONFLICT (user_id) to work in triggers
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_key CASCADE;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);

-- Step 2: Ensure id is primary key
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_pkey CASCADE;

ALTER TABLE user_profiles 
ADD PRIMARY KEY (id);

-- Step 3: Recreate the trigger function with proper ON CONFLICT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, user_id, email, full_name)
  VALUES (NEW.id, NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
