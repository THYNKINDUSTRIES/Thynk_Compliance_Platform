# California (CA) Poller Test Guide

## Overview

This guide explains how to test the `cannabis-hemp-poller` edge function specifically for California (CA) and verify that results are being logged to the `ingestion_log` table.

## Quick Test via UI

1. Navigate to **Data Management** page (`/source-management`)
2. Click on the **"CA Poll Test"** tab
3. Click the **"Run CA Poll Test"** button
4. Watch the test results appear in real-time
5. Check the **"Ingestion Log Verification"** section to see if new entries were created

## What Gets Tested

The test panel will invoke two edge functions:

1. **cannabis-hemp-poller** - The primary poller for cannabis/hemp regulations
2. **state-regulations-poller** - The fallback poller

Both functions are called with:
```json
{
  "stateCode": "CA",
  "fullScan": false,
  "test": true
}
```

## California Data Sources

The cannabis-hemp-poller fetches from these California sources:

| Source Type | URL |
|-------------|-----|
| RSS Feed | https://cannabis.ca.gov/feed/ |
| News Page | https://cannabis.ca.gov/about-us/announcements/ |
| Regulations | https://cannabis.ca.gov/cannabis-laws/dcc-regulations/ |

## Manual Testing via cURL

### Test cannabis-hemp-poller for CA

```bash
curl -L -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/cannabis-hemp-poller' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  --data '{"stateCode": "CA"}'
```

### Test state-regulations-poller for CA

```bash
curl -L -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/state-regulations-poller' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  --data '{"stateCode": "CA"}'
```

## Verifying Results in ingestion_log

### Via Supabase SQL Editor

Run this query to check recent California polling results:

```sql
-- Check recent ingestion logs for California
SELECT 
  id,
  source_id,
  status,
  records_fetched,
  records_created,
  started_at,
  error_message,
  metadata
FROM ingestion_log 
WHERE source_id LIKE '%cannabis%' 
   OR source_id LIKE '%state%'
   OR metadata->>'stateCode' = 'CA'
ORDER BY started_at DESC 
LIMIT 10;
```

### Expected Response Structure

A successful poll should return:

```json
{
  "success": true,
  "recordsProcessed": 5,
  "newItemsFound": 2,
  "statesProcessed": 1,
  "totalStatesAvailable": 50
}
```

And create an ingestion_log entry like:

```json
{
  "source_id": "cannabis-hemp-poller",
  "status": "success",
  "records_fetched": 5,
  "records_created": 2,
  "metadata": {
    "stateCode": "CA",
    "statesProcessed": 1,
    "fullScan": false
  }
}
```

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:
1. The edge function may not have proper CORS headers
2. See `FIX_CANNABIS_HEMP_POLLER.md` for the fix
3. Ensure the function handles OPTIONS requests

### Function Not Found (404)

If the function returns 404:
1. The edge function may not be deployed
2. Go to Supabase Dashboard > Edge Functions
3. Check if `cannabis-hemp-poller` exists
4. If not, deploy it using `MANUAL_DEPLOY_STATE_POLLER.md`

### No Logs in ingestion_log

If no logs appear after polling:
1. Check if the `ingestion_log` table exists
2. Verify the table has the `started_at` column (or `created_at`)
3. Run the SQL from `DATABASE_COLUMN_FIX.md` to add missing columns

### Empty Results

If the function returns 0 records:
1. California RSS feed may be temporarily unavailable
2. Check if cannabis.ca.gov is accessible
3. Try a full scan: `{"stateCode": "CA", "fullScan": true}`

## Related Files

- `src/components/PollerTestPanel.tsx` - Test UI component
- `src/components/StateRegulationsPoller.tsx` - Main poller UI
- `FIX_CANNABIS_HEMP_POLLER.md` - CORS fix documentation
- `MANUAL_DEPLOY_STATE_POLLER.md` - Full edge function code
- `DATABASE_COLUMN_FIX.md` - Database schema fixes

## Edge Function Deployment Status

| Function | Status | Notes |
|----------|--------|-------|
| state-regulations-poller | ✅ Deployed | Always works |
| cannabis-hemp-poller | ⚠️ Check | May need CORS fix |

## Success Criteria

A successful test should show:

1. ✅ Both edge functions respond (or gracefully fail)
2. ✅ At least one function returns `success: true`
3. ✅ New entry appears in `ingestion_log` table
4. ✅ No CORS errors in browser console
5. ✅ Response includes `recordsProcessed` > 0 (if CA has new content)
