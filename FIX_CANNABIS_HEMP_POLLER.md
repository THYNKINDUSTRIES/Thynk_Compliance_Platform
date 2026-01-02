# Fix Cannabis-Hemp-Poller CORS Issue

## Problem
The `cannabis-hemp-poller` edge function exists in your Supabase dashboard but is returning CORS errors when called from the frontend. This is because the function is not properly handling the OPTIONS preflight request.

## Solution

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar
4. Click on **cannabis-hemp-poller**

### Step 2: Update the Function Code

The function needs to properly handle CORS. Make sure the **VERY FIRST LINES** of your function look like this:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// ... rest of your code ...

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight FIRST
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ... your existing code ...
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
```

### Step 3: Verify CORS Headers Are Included in ALL Responses

Every `return new Response(...)` in your function MUST include `corsHeaders`:

```typescript
// ✅ CORRECT
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});

// ❌ WRONG - Missing corsHeaders
return new Response(JSON.stringify(data), {
  headers: { 'Content-Type': 'application/json' }
});
```

### Step 4: Deploy the Updated Function

After making changes in the Supabase dashboard:
1. Click **Deploy** button
2. Wait for deployment to complete
3. Test the function

### Step 5: Test via Terminal

```bash
# Test OPTIONS request (should return 200 with CORS headers)
curl -X OPTIONS 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/cannabis-hemp-poller' \
  -H 'Origin: https://preview-0hf4u5vl--compliance-tracking-regulation.deploypad.app' \
  -H 'Access-Control-Request-Method: POST' \
  -v

# Test actual POST request
curl -L -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/cannabis-hemp-poller' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  --data '{"test": true}'
```

## Complete Working Function Template

Here's a complete working template for the cannabis-hemp-poller function:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const STATE_CANNABIS_SOURCES: Record<string, {
  agency: string;
  agencyName: string;
  rssFeeds: string[];
  newsPages: string[];
  regulationPages: string[];
}> = {
  'CA': {
    agency: 'https://cannabis.ca.gov',
    agencyName: 'California Department of Cannabis Control',
    rssFeeds: ['https://cannabis.ca.gov/feed/'],
    newsPages: ['https://cannabis.ca.gov/about-us/announcements/'],
    regulationPages: ['https://cannabis.ca.gov/cannabis-laws/dcc-regulations/']
  },
  'CO': {
    agency: 'https://sbg.colorado.gov/med',
    agencyName: 'Colorado Marijuana Enforcement Division',
    rssFeeds: [],
    newsPages: ['https://sbg.colorado.gov/med/news'],
    regulationPages: ['https://sbg.colorado.gov/med/rules']
  },
  // ... add more states as needed
};

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight request FIRST
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const body = await req.json().catch(() => ({}));
    const { stateCode, fullScan = false } = body;

    console.log(`Starting cannabis-hemp-poller. State: ${stateCode || 'all'}`);

    // Your polling logic here...
    let recordsProcessed = 0;
    let newItemsFound = 0;
    let statesProcessed = 0;

    for (const [code, sources] of Object.entries(STATE_CANNABIS_SOURCES)) {
      if (stateCode && code !== stateCode) continue;
      
      statesProcessed++;
      // Process RSS feeds, news pages, etc.
      recordsProcessed += sources.rssFeeds.length + sources.newsPages.length;
    }

    // Log to ingestion_log
    await supabase.from('ingestion_log').insert({
      source_id: 'cannabis-hemp-poller',
      status: 'success',
      records_fetched: recordsProcessed,
      records_created: newItemsFound,
      metadata: { statesProcessed, fullScan }
    });

    const result = {
      success: true,
      recordsProcessed,
      newItemsFound,
      statesProcessed,
      totalStatesAvailable: Object.keys(STATE_CANNABIS_SOURCES).length
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
```

## Common Issues

### Issue: "Response to preflight request doesn't pass access control check"
**Cause**: The OPTIONS handler is missing or not returning proper headers
**Fix**: Add the OPTIONS handler at the very start of `Deno.serve`

### Issue: "No 'Access-Control-Allow-Origin' header is present"
**Cause**: The corsHeaders are not being spread into the response
**Fix**: Ensure every Response includes `headers: { ...corsHeaders, ... }`

### Issue: Function works in terminal but not in browser
**Cause**: Browser sends OPTIONS preflight, terminal doesn't
**Fix**: Ensure OPTIONS handler returns 200 with corsHeaders

## Verification

After fixing, the "Poll All States" button should work without CORS errors. Check the browser console - you should see:
- ✅ No CORS errors
- ✅ Both `state-regulations-poller` and `cannabis-hemp-poller` responses

The frontend has been updated to:
1. Call both pollers (state-regulations-poller and cannabis-hemp-poller)
2. Gracefully handle if cannabis-hemp-poller fails (won't break the whole operation)
3. Aggregate results from both pollers
