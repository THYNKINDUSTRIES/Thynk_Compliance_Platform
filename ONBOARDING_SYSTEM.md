# Onboarding System

This document describes the user onboarding flow implemented for new users.

## Overview

When a new user signs up or logs in for the first time, they are shown a guided tour modal that introduces the key features of the platform. The onboarding status is tracked and persisted so users only see it once.

## Components

### OnboardingModal (`src/components/OnboardingModal.tsx`)

A multi-step modal dialog that guides users through the platform features:

- **Step 1: Welcome** - Introduction to Thynk Compliance
- **Step 2: Dashboard** - Overview of the personal dashboard
- **Step 3: Regulations** - How to discover and track regulations
- **Step 4: Alerts** - Setting up notification alerts

Features:
- Progress bar showing completion
- Step indicators for navigation
- Skip button to exit early
- Back/Next navigation
- Beautiful gradient styling per step

## User Flow

1. User creates account on `/signup`
2. After successful signup, redirected to `/dashboard`
3. Dashboard detects new user (onboarding not completed)
4. OnboardingModal displays automatically after 500ms delay
5. User completes tour or skips
6. Onboarding status saved to localStorage and database

## State Management

### AuthContext

The `AuthContext` provides:

```typescript
{
  onboardingCompleted: boolean;  // Whether user has completed onboarding
  completeOnboarding: () => Promise<void>;  // Mark onboarding as complete
  resetOnboarding: () => void;  // Reset for replay
}
```

### Storage

Onboarding status is stored in two places for reliability:

1. **localStorage** (fallback)
   - Key: `thynk_onboarding_completed`
   - Value: `{ [userId]: true }`

2. **Database** (primary)
   - Table: `user_profiles`
   - Columns: `onboarding_completed`, `onboarding_completed_at`

## Database Schema

Add these columns to the `user_profiles` table:

```sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;
```

## Customization

### Adding New Steps

Edit the `steps` array in `OnboardingModal.tsx`:

```typescript
const steps: OnboardingStep[] = [
  {
    id: 5,
    title: 'New Feature',
    description: 'Description of the new feature',
    icon: <YourIcon className="w-12 h-12" />,
    features: [
      'Feature benefit 1',
      'Feature benefit 2',
    ],
    color: 'from-red-500 to-rose-600'
  }
];
```

### Changing Colors

Each step has a `color` property using Tailwind gradient classes:
- `from-blue-500 to-indigo-600` (Welcome)
- `from-purple-500 to-pink-600` (Dashboard)
- `from-emerald-500 to-teal-600` (Regulations)
- `from-amber-500 to-orange-600` (Alerts)

## Replay Tour

Users can replay the onboarding tour from their Profile page:

1. Go to Profile → Preferences tab
2. Click "Replay Welcome Tour"
3. Visit Dashboard to see the tour again

## Integration Points

- **Dashboard.tsx** - Shows OnboardingModal for new users
- **SignUp.tsx** - Redirects to dashboard after signup
- **Login.tsx** - Redirects to dashboard after login
- **Profile.tsx** - Provides "Replay Tour" option
- **AuthContext.tsx** - Manages onboarding state

## Troubleshooting

### Modal not showing
- Check `onboardingCompleted` state in AuthContext
- Clear localStorage key `thynk_onboarding_completed`
- Verify user is logged in

### Modal keeps showing
- Check if `completeOnboarding()` is being called
- Verify localStorage is being written
- Check database for `onboarding_completed` column

### Performance issues
- Modal only renders on Dashboard page
- Early return when `isOpen` is false
- No global wrapper affecting all routes
