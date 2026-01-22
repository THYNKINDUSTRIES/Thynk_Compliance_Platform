# Automated Polling with pg_cron Setup

This guide explains how to set up automated scheduled polling using Supabase's pg_cron extension to run the pollers daily/hourly and keep your regulation data fresh.

## Step 1: Update the scheduled-poller-cron Edge Function

Go to Supabase Dashboard > Edge Functions > `scheduled-poller-cron` and replace with this code:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const now = new Date();
    const hour = now.getUTCHours();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const results: Record<string, any> = {
      federalRegister: { success: false, message: '', recordsAdded: 0 },
      regulationsGov: { success: false, message: '', recordsAdded: 0 },
      stateRegulations: { success: false, message: '', recordsProcessed: 0 },
      commentReminders: { success: false, message: '', remindersSent: 0 }
    };

    // Trigger Federal Register Poller (runs every execution)
    try {
      const frResponse = await fetch(
        `${supabaseUrl}/functions/v1/federal-register-poller`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          }
        }
      );
      
      const frData = await frResponse.json();
      results.federalRegister = {
        success: frResponse.ok,
        message: frData.message || 'Completed',
        recordsAdded: frData.recordsAdded || 0
      };
    } catch (error: any) {
      results.federalRegister.message = `Error: ${error.message}`;
    }

    // Trigger Regulations.gov Poller (runs every execution)
    try {
      const rgResponse = await fetch(
        `${supabaseUrl}/functions/v1/regulations-gov-poller`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          }
        }
      );
      
      const rgData = await rgResponse.json();
      results.regulationsGov = {
        success: rgResponse.ok,
        message: rgData.message || 'Completed',
        recordsAdded: rgData.recordsAdded || 0
      };
    } catch (error: any) {
      results.regulationsGov.message = `Error: ${error.message}`;
    }

    // Trigger State Regulations Poller (Cannabis/Hemp) - runs at 6 AM, 12 PM, 6 PM, 12 AM UTC
    // This replaces the old cannabis-hemp-poller
    if (hour % 6 === 0) {
      try {
        const stateResponse = await fetch(
          `${supabaseUrl}/functions/v1/state-regulations-poller`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify({})
          }
        );
        
        const stateData = await stateResponse.json();
        results.stateRegulations = {
          success: stateResponse.ok,
          message: stateData.message || 'Completed',
          recordsProcessed: stateData.recordsProcessed || 0
        };
        
        // Log to ingestion_log
        await supabase.from('ingestion_log').insert({
          source_id: 'state-regulations-poller',
          status: stateResponse.ok ? 'success' : 'error',
          records_fetched: stateData.recordsProcessed || 0,
          message: stateData.message || 'Scheduled state regulations poll completed',
          metadata: { 
            triggered_by: 'scheduled-poller-cron',
            hour: hour,
            results: stateData
          }
        });
      } catch (error: any) {
        results.stateRegulations.message = `Error: ${error.message}`;
        
        // Log error to ingestion_log
        await supabase.from('ingestion_log').insert({
          source_id: 'state-regulations-poller',
          status: 'error',
          records_fetched: 0,
          message: `Scheduled poll failed: ${error.message}`,
          metadata: { 
            triggered_by: 'scheduled-poller-cron',
            hour: hour,
            error: error.message
          }
        });
      }
    } else {
      results.stateRegulations.message = `Skipped - runs every 6 hours (current hour: ${hour})`;
    }

    // Process comment deadline reminders daily at 9 AM UTC
    if (hour === 9) {
      try {
        const reminderResponse = await fetch(
          `${supabaseUrl}/functions/v1/process-comment-deadline-reminders`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            }
          }
        );
        
        const reminderData = await reminderResponse.json();
        results.commentReminders = {
          success: reminderResponse.ok,
          message: reminderData.message || 'Completed',
          remindersSent: reminderData.remindersSent || 0
        };
      } catch (error: any) {
        results.commentReminders.message = `Error: ${error.message}`;
      }
    } else {
      results.commentReminders.message = `Skipped - only runs at 9 AM UTC (current hour: ${hour})`;
    }

    const duration = Date.now() - startTime;
    
    // Log execution to job_execution_log
    await supabase.from('job_execution_log').insert({
      job_name: 'scheduled-poller-cron',
      status: 'completed',
      duration_ms: duration,
      metadata: {
        hour: hour,
        dayOfWeek: dayOfWeek,
        results: results
      }
    });

    return new Response(JSON.stringify({
      success: true,
      executionTime: duration,
      currentHour: hour,
      dayOfWeek: dayOfWeek,
      results
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
```

## Step 2: Enable pg_cron Extension

Run this SQL in Supabase SQL Editor:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;
```

## Step 3: Create the Cron Job

Run this SQL to set up hourly polling:

```sql
-- Create a cron job that runs every hour
-- This calls the scheduled-poller-cron edge function
SELECT cron.schedule(
  'hourly-regulation-poller',  -- job name
  '0 * * * *',                 -- every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/scheduled-poller-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

### Alternative: Daily Schedule (if hourly is too frequent)

```sql
-- Run once daily at 6 AM UTC
SELECT cron.schedule(
  'daily-regulation-poller',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/scheduled-poller-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

### Alternative: Every 6 Hours

```sql
-- Run every 6 hours (0, 6, 12, 18 UTC)
SELECT cron.schedule(
  'six-hourly-regulation-poller',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/scheduled-poller-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

## Step 4: Using pg_net for HTTP Calls

If pg_cron doesn't support direct HTTP calls, enable pg_net:

```sql
-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;
```

Then use this alternative approach:

```sql
-- Create a function to call the edge function
CREATE OR REPLACE FUNCTION trigger_scheduled_poller()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key TEXT;
BEGIN
  -- Get the service role key from vault or settings
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- If not in settings, use a hardcoded value (not recommended for production)
  IF service_role_key IS NULL THEN
    service_role_key := 'YOUR_SERVICE_ROLE_KEY_HERE';
  END IF;
  
  -- Make HTTP POST request to edge function
  PERFORM net.http_post(
    url := 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/scheduled-poller-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Schedule the function to run hourly
SELECT cron.schedule(
  'hourly-regulation-poller',
  '0 * * * *',
  'SELECT trigger_scheduled_poller()'
);
```

## Step 5: Verify Cron Jobs

```sql
-- List all scheduled cron jobs
SELECT * FROM cron.job;

-- View recent job executions
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```

## Step 6: Manage Cron Jobs

```sql
-- Disable a job temporarily
UPDATE cron.job SET active = false WHERE jobname = 'hourly-regulation-poller';

-- Re-enable a job
UPDATE cron.job SET active = true WHERE jobname = 'hourly-regulation-poller';

-- Delete a job
SELECT cron.unschedule('hourly-regulation-poller');

-- Change schedule
SELECT cron.schedule(
  'hourly-regulation-poller',
  '30 * * * *',  -- Changed to run at minute 30
  'SELECT trigger_scheduled_poller()'
);
```

## Testing the Edge Function

### Test OPTIONS (Preflight)
```bash
curl -X OPTIONS 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/scheduled-poller-cron' \
  -H 'Origin: https://www.thynkflow.io' \
  -H 'Access-Control-Request-Method: POST' \
  -v
```

Expected: HTTP 204 with CORS headers

### Test POST
```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/scheduled-poller-cron' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### Test generate-checklist-from-template
```bash
# OPTIONS preflight
curl -X OPTIONS 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/generate-checklist-from-template' \
  -H 'Origin: https://www.thynkflow.io' \
  -H 'Access-Control-Request-Method: POST' \
  -v

# POST request
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/generate-checklist-from-template' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"templateId": "YOUR_TEMPLATE_ID", "userId": "YOUR_USER_ID"}'
```

## Polling Schedule Summary

| Poller | Schedule | Description |
|--------|----------|-------------|
| Federal Register | Every hour | Polls federal register for new regulations |
| Regulations.gov | Every hour | Polls regulations.gov for proposed rules |
| State Regulations | Every 6 hours | Polls state cannabis/hemp regulatory agencies |
| Comment Reminders | Daily at 9 AM UTC | Sends deadline reminders for open comment periods |

## Monitoring

Check the `ingestion_log` table for polling results:

```sql
SELECT 
  source_id,
  status,
  records_fetched,
  message,
  created_at
FROM ingestion_log
WHERE source_id IN ('federal-register-poller', 'regulations-gov-poller', 'state-regulations-poller')
ORDER BY created_at DESC
LIMIT 50;
```

Check `job_execution_log` for cron execution history:

```sql
SELECT 
  job_name,
  status,
  duration_ms,
  metadata,
  created_at
FROM job_execution_log
WHERE job_name = 'scheduled-poller-cron'
ORDER BY created_at DESC
LIMIT 20;
```

## Troubleshooting

### pg_cron not available
If you get an error about pg_cron not being available, it may need to be enabled in your Supabase project settings:
1. Go to Database > Extensions
2. Search for "pg_cron"
3. Enable it

### HTTP calls failing
If HTTP calls from pg_cron fail:
1. Ensure pg_net extension is enabled
2. Check that the edge function URL is correct
3. Verify the authorization header is properly set

### Jobs not running
1. Check if the job is active: `SELECT * FROM cron.job WHERE jobname = 'hourly-regulation-poller';`
2. Check job run history: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
3. Ensure the database is not in a paused state
