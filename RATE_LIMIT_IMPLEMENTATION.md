# Rate Limiting Implementation

## Overview
Comprehensive rate limiting system to prevent abuse of signup and email verification endpoints.

## Setup Instructions

### 1. Create Database Table
Run `RATE_LIMIT_SETUP.sql` in Supabase SQL Editor to create the `rate_limits` table.

### 2. Deploy Edge Function
Deploy the `check-rate-limit` edge function:
```bash
supabase functions deploy check-rate-limit
```

Or manually create it in Supabase Dashboard using `check-rate-limit-function.ts`.

## Rate Limit Configuration

### Default Limits
- **Signup**: 3 attempts per hour per IP
- **Email Verification**: 5 attempts per hour per IP
- **Password Reset**: 3 attempts per hour per IP

### How It Works
1. User attempts action (signup/verification)
2. System fetches user's IP address via ipify.org
3. Edge function checks rate_limits table for existing records
4. If limit exceeded, returns 429 error with time remaining
5. If allowed, increments attempt counter
6. Records expire after cooldown period

## Features

### User-Facing
- Clear error messages when rate limit is reached
- Warning when approaching limit (1 attempt remaining)
- Countdown timer showing when limit resets
- Works for both signup and email verification

### Admin Features
- View all active rate limits
- Clear rate limits by IP address
- Clear rate limits by email address
- Monitor attempt counts and reset times

## Components

### SignUp.tsx
- Fetches user IP on mount
- Checks rate limit before signup
- Checks rate limit before resending verification
- Displays warnings and error messages

### RateLimitSettings.tsx
- Shows user's current rate limit status
- Displays time remaining until reset
- Refresh button to update status

### AdminRateLimitControls.tsx
- Admin-only component
- Clear rate limits manually
- Useful for customer support

## Testing

1. Attempt signup 3 times rapidly
2. Fourth attempt should be blocked with message
3. Check rate_limits table to see records
4. Wait for cooldown or use admin controls to clear

## Security Notes

- IP addresses tracked via ipify.org (fallback to 'unknown')
- Service role key required for database operations
- RLS policies restrict access to service role only
- Expired records cleaned up automatically

## Customization

To adjust rate limits, modify the `limits` object in `check-rate-limit` function:

```typescript
const limits = {
  signup: { maxAttempts: 5, windowMinutes: 120 }, // 5 per 2 hours
  email_verification: { maxAttempts: 10, windowMinutes: 60 },
  password_reset: { maxAttempts: 5, windowMinutes: 60 }
};
```

## Monitoring

Query active rate limits:
```sql
SELECT * FROM rate_limits 
WHERE reset_at > NOW() 
ORDER BY last_attempt_at DESC;
```

Clean up expired records:
```sql
SELECT cleanup_expired_rate_limits();
```
