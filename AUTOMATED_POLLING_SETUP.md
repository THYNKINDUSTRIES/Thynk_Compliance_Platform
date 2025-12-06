# Automated Polling Setup Guide

This guide explains how to set up automated cron jobs to run the federal-register-poller and regulations-gov-poller functions every 4-6 hours.

## Overview

The `scheduled-poller-cron` edge function has been created to trigger both polling functions automatically. This function needs to be called on a schedule using an external cron service.

## Setup Options

### Option 1: GitHub Actions (Recommended)

Create `.github/workflows/polling-cron.yml`:

```yaml
name: Automated Regulation Polling

on:
  schedule:
    # Runs every 4 hours
    - cron: '0 */4 * * *'
  workflow_dispatch: # Allows manual triggering

jobs:
  poll-regulations:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Polling Function
        run: |
          curl -X POST \
            https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/scheduled-poller-cron \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json"
```

**Setup Steps:**
1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add `SUPABASE_SERVICE_ROLE_KEY` secret ← **CRITICAL: Use service_role, NOT anon key**
4. Create the workflow file above
5. The job will run automatically every 4 hours with full write permissions

### Option 2: Vercel Cron Jobs

If deployed on Vercel, add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron-trigger",
    "schedule": "0 */4 * * *"
  }]
}
```

Create `api/cron-trigger.ts`:

```typescript
export default async function handler(req, res) {
  const response = await fetch(
    'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/scheduled-poller-cron',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  res.status(200).json(data);
}
```

### Option 3: External Cron Service (cron-job.org)

1. Visit https://cron-job.org
2. Create a free account
3. Create a new cron job with:
   - **URL**: `https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/scheduled-poller-cron`
   - **Schedule**: Every 4 hours
   - **Request Method**: POST
   - **Headers**: 
     - `Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY` ← **NEVER use anon key for writes!**
     - `Content-Type: application/json`

## Security Note

**Never use the anon key for scheduled jobs that insert/update data.**  
The anon key respects RLS → your pollers will fail silently with no data written.

Use a dedicated **service_role** key (or better: Supabase's native pg_cron scheduled functions).

## Monitoring

Access the Polling Health Dashboard at `/source-management` to monitor:
- Success rates
- Failed jobs
- Average execution time
- Recent execution history
- Records processed per run

## Manual Triggering

You can manually trigger the polling at any time:

```bash
curl -X POST \
  https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/scheduled-poller-cron \
  -H "Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

Or use the "Testing Tools" tab in the Source Management page.

## Adjusting Frequency

To change the polling frequency, update the cron schedule:
- Every 4 hours: `0 */4 * * *`
- Every 6 hours: `0 */6 * * *`
- Every 12 hours: `0 */12 * * *`
- Daily at midnight: `0 0 * * *`

## Troubleshooting

If polling fails:
1. Check the Polling Health Dashboard for error messages
2. Verify API keys are set in Supabase secrets
3. Check rate limits on Federal Register and Regulations.gov APIs
4. Review execution logs in the dashboard
