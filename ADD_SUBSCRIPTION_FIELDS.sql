-- ============================================
-- ADD SUBSCRIPTION FIELDS TO USER_PROFILES
-- ============================================
-- Run this in Supabase SQL Editor to add subscription/trial functionality
-- ============================================

-- Add subscription and trial fields to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 days'),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Update existing users to have trial status
UPDATE public.user_profiles
SET
  subscription_status = 'trial',
  trial_started_at = created_at,
  trial_ends_at = created_at + INTERVAL '3 days'
WHERE subscription_status IS NULL OR subscription_status = '';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON public.user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_trial_ends_at ON public.user_profiles(trial_ends_at);

-- Update RLS policies to include new fields (if needed)
-- The existing policies should work fine with the new columns