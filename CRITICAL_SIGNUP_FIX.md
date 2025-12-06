# CRITICAL SIGNUP FIX - Manual Deployment Required

## Issues Found
1. ❌ **check-rate-limit edge function has WRONG CODE** (checking alert limits instead of signup limits)
2. ❌ **Logo image returning 403 error** (CDN access issue)
3. ❌ **Signup returning 500 error** due to incorrect edge function

## STEP 1: Deploy Fixed check-rate-limit Function

### Via Supabase Dashboard (EASIEST):
1. Go to **Supabase Dashboard** → **Edge Functions**
2. Find `check-rate-limit` function
3. Click **Edit** or the function name
4. **DELETE ALL EXISTING CODE**
5. **PASTE THE CODE BELOW**:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { ipAddress, email, action } = await req.json();

    if (!ipAddress || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const now = new Date();
    const limits = {
      signup: { max: 3, windowMinutes: 60 },
      email_verification: { max: 5, windowMinutes: 60 }
    };

    const limit = limits[action as keyof typeof limits];
    if (!limit) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Check IP-based rate limit
    const ipCheckUrl = `${supabaseUrl}/rest/v1/rate_limits?ip_address=eq.${encodeURIComponent(ipAddress)}&action=eq.${action}&select=*`;
    const ipRes = await fetch(ipCheckUrl, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const ipRecords = await ipRes.json();
    
    let ipRecord = ipRecords[0];
    if (ipRecord) {
      const resetTime = new Date(ipRecord.reset_at);
      if (now < resetTime) {
        if (ipRecord.attempt_count >= limit.max) {
          const minutesLeft = Math.ceil((resetTime.getTime() - now.getTime()) / 60000);
          return new Response(JSON.stringify({
            allowed: false,
            reason: 'ip_limit',
            minutesUntilReset: minutesLeft,
            message: `Too many ${action} attempts. Try again in ${minutesLeft} min.`
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }
    }

    return new Response(JSON.stringify({
      allowed: true,
      message: 'Rate limit check passed'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Rate limit check error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
```

6. Click **Deploy** button
7. Wait for deployment to complete

## STEP 2: Verify rate_limits Table Exists

Run this in **Supabase SQL Editor**:

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'rate_limits'
);
```

If it returns `false`, run the complete setup from `RATE_LIMIT_SETUP.sql`

## STEP 3: Test Signup

1. Clear browser cache and cookies
2. Try signing up with a new email
3. Should work without 500 error
4. Check browser console - no more rate limit errors

## What Was Wrong

**OLD CODE (WRONG):**
- Checked `userId`, `priority`, `alertType` (for alert rate limiting)
- Completely wrong for signup flow

**NEW CODE (CORRECT):**
- Checks `ipAddress`, `email`, `action` (for signup rate limiting)
- Properly validates signup attempts by IP address

## Logo Fix Applied

Updated Header.tsx to handle 403 errors gracefully with fallback text logo.
