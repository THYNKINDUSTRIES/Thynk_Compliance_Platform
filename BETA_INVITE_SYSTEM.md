# Beta Invite System

This document describes the beta invite system that allows existing beta users to invite new users by email, bypassing the email domain restriction.

## Overview

The beta invite system enables:
- Existing beta users (with approved email domains) to send invites to anyone
- Invited users to sign up using an invite code, bypassing domain restrictions
- Tracking of who invited whom
- Management of sent invites (view status, revoke pending invites)

## Database Setup

Create the `beta_invites` table in Supabase:

```sql
CREATE TABLE beta_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_code VARCHAR(32) UNIQUE NOT NULL,
  inviter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  inviter_email VARCHAR(255) NOT NULL,
  invited_email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT
);

-- Create indexes for faster lookups
CREATE INDEX idx_beta_invites_code ON beta_invites(invite_code);
CREATE INDEX idx_beta_invites_inviter ON beta_invites(inviter_user_id);
CREATE INDEX idx_beta_invites_invited_email ON beta_invites(invited_email);
CREATE INDEX idx_beta_invites_status ON beta_invites(status);

-- Enable RLS
ALTER TABLE beta_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sent invites
CREATE POLICY "Users can view their sent invites" ON beta_invites
  FOR SELECT USING (auth.uid() = inviter_user_id);

-- Policy: Users can view invites sent to their email
CREATE POLICY "Users can view invites to their email" ON beta_invites
  FOR SELECT USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy: Authenticated users can create invites
CREATE POLICY "Authenticated users can create invites" ON beta_invites
  FOR INSERT WITH CHECK (auth.uid() = inviter_user_id);

-- Policy: Allow public read of valid invite codes (for signup validation)
CREATE POLICY "Public can validate invite codes" ON beta_invites
  FOR SELECT USING (status = 'pending' AND expires_at > NOW());
```

Also add columns to user_profiles to track invite relationships:

```sql
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS invite_code_used VARCHAR(32);
```

## Edge Function

Deploy the `beta-invite-system` edge function with the following actions:

### Actions

1. **create_invite** - Create a new invite
   - Parameters: `inviterUserId`, `inviterEmail`, `invitedEmail`, `notes` (optional)
   - Sends email via Resend API
   - Returns: `{ success: true, invite: {...} }`

2. **validate_invite** - Validate an invite code
   - Parameters: `inviteCode`
   - Returns: `{ valid: boolean, error?: string, invite?: {...} }`

3. **accept_invite** - Mark invite as accepted after signup
   - Parameters: `inviteCode`, `userId`
   - Updates invite status and user profile
   - Returns: `{ success: true, inviterEmail: string }`

4. **get_my_invites** - Get all invites sent by a user
   - Parameters: `userId`
   - Returns: `{ invites: [...] }`

5. **revoke_invite** - Revoke a pending invite
   - Parameters: `inviteId`, `userId`
   - Returns: `{ success: true }`

6. **get_invite_stats** - Get invite statistics
   - Parameters: `userId`
   - Returns: `{ stats: { total, pending, accepted, expired, revoked } }`

## Frontend Components

### BetaInviteManager (`src/components/BetaInviteManager.tsx`)
- Full invite management UI
- Send new invites with optional personal notes
- View all sent invites with status
- Copy invite links
- Revoke pending invites
- Statistics dashboard

### Updated SignUp Page (`src/pages/SignUp.tsx`)
- Accepts invite code from URL parameter (`?invite=CODE`)
- Manual invite code entry option
- Real-time invite code validation
- Pre-fills email if invite has specific recipient
- Bypasses domain restriction for valid invite codes

### BetaInvites Page (`src/pages/BetaInvites.tsx`)
- Protected route for managing invites
- Only accessible to users with approved email domains
- Uses BetaInviteManager component

### UserMenu (`src/components/UserMenu.tsx`)
- Added "Beta Invites" link for eligible users

## Configuration

Beta configuration is in `src/lib/betaAccess.ts`:

```typescript
export const BETA_CONFIG = {
  enabled: true,
  allowedEmailDomains: ['@thynk.guru', '@cultivalaw.com', '@discountpharms.com'],
  maxInvitesPerUser: 10,
  inviteExpirationDays: 7,
  // ...
};
```

## User Flow

### Sending an Invite
1. Beta user navigates to `/beta-invites`
2. Clicks "Send Invite" button
3. Enters recipient email and optional note
4. System generates unique 8-character code
5. Email sent to recipient with invite link
6. Invite appears in user's invite list

### Using an Invite
1. Recipient clicks link in email or navigates to signup
2. If using link, invite code is pre-filled
3. If manual, user enters code in "Have an invite code?" section
4. Code is validated in real-time
5. User completes signup form
6. On successful signup, invite is marked as accepted
7. User profile is updated with inviter reference

### Invite Statuses
- **pending** - Invite sent, not yet used
- **accepted** - Recipient signed up using the code
- **expired** - 7 days passed without use
- **revoked** - Inviter cancelled the invite

## Security Considerations

1. Invite codes are 8 characters using unambiguous characters (no 0/O, 1/I/L)
2. Codes expire after 7 days
3. Each code can only be used once
4. Users can revoke pending invites
5. Maximum 10 invites per user (configurable)
6. Only domain-verified users can send invites
7. Invite chain is tracked for accountability
