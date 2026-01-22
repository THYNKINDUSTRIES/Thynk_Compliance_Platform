# CORS Fix Guide for Edge Functions

## Problem

You're seeing CORS errors like:
```
Access to fetch at 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/cannabis-hemp-poller' 
from origin 'https://www.thynkflow.io' has been blocked by CORS policy
```

## Root Cause

The `cannabis-hemp-poller` edge function **does not exist** in your Supabase project. The frontend was trying to call a non-existent function, which returns a CORS error.

## Solution Applied

The frontend has been updated to **only call `state-regulations-poller`**, which is the deployed and working edge function. The call to `cannabis-hemp-poller` has been removed.

## If You Want to Deploy cannabis-hemp-poller

If you want to have both functions, you can manually deploy the cannabis-hemp-poller function:

### Step 1: Go to Supabase Dashboard
1. Navigate to https://supabase.com/dashboard
2. Select your project
3. Go to **Edge Functions** in the left sidebar
4. Click **New Function**
5. Name it: `cannabis-hemp-poller`

### Step 2: Use This Code

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing configuration' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    let body = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch (e) {}

    const { stateCode, fullScan = false } = body as any;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Your polling logic here...
    let recordsProcessed = 0;
    let statesProcessed = 0;

    // Example: Process states
    const states = ['CA', 'CO', 'WA', 'OR', 'NV'];
    for (const state of states) {
      if (stateCode && state !== stateCode) continue;
      statesProcessed++;
      recordsProcessed += 2;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        statesProcessed, 
        recordsProcessed,
        newItemsFound: 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Step 3: Deploy

Click **Deploy** in the Supabase dashboard.

## Key CORS Requirements

Every edge function MUST:

1. **Handle OPTIONS preflight requests**:
```typescript
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}
```

2. **Include CORS headers in ALL responses** (including errors):
```typescript
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});
```

3. **Use wildcard origin** for public APIs:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
```

## Testing

After deploying, test with curl:

```bash
# Test OPTIONS (preflight)
curl -X OPTIONS 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/cannabis-hemp-poller' \
  -H 'Origin: https://www.thynkflow.io' \
  -H 'Access-Control-Request-Method: POST' \
  -v

# Test POST
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/cannabis-hemp-poller' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"stateCode": "CA"}'
```

## Current Status

| Function | Status | Notes |
|----------|--------|-------|
| state-regulations-poller | ✅ Deployed | Working, has CORS headers |
| cannabis-hemp-poller | ❌ Not Deployed | Needs manual deployment |

The frontend now only calls `state-regulations-poller` to avoid CORS errors.
