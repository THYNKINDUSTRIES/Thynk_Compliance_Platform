# Digest Email System - Implementation Guide

## Complete Setup Instructions

### Step 1: Database Setup

Run in Supabase SQL Editor:

```sql
-- Create digest log table
CREATE TABLE IF NOT EXISTS digest_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES alert_profiles(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly')),
  regulations_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_digest_log_profile ON digest_log(profile_id);
CREATE INDEX idx_digest_log_sent_at ON digest_log(sent_at DESC);
CREATE INDEX idx_digest_log_status ON digest_log(status);
```

### Step 2: Create Edge Function

1. Go to Supabase Dashboard > Edge Functions
2. Create new function: `send-digest-emails`
3. Copy code from `DIGEST_EMAIL_SYSTEM.md`
4. Deploy function

### Step 3: Configure Email Provider

**Using Resend (Recommended):**

1. Sign up at https://resend.com
2. Get API key
3. Add to Supabase: Project Settings > Edge Functions > Secrets
   - Key: `RESEND_API_KEY`
   - Value: Your Resend API key
4. Verify domain in Resend dashboard

### Step 4: Schedule Cron Jobs

Run in Supabase SQL Editor:

```sql
-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Daily digest at 8 AM UTC
SELECT cron.schedule(
  'send-daily-digest',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-digest-emails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"frequency": "daily"}'::jsonb
  );
  $$
);

-- Weekly digest every Monday at 8 AM UTC
SELECT cron.schedule(
  'send-weekly-digest',
  '0 8 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-digest-emails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"frequency": "weekly"}'::jsonb
  );
  $$
);
```

**Replace:**
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_ANON_KEY` with your anon/public API key

### Step 5: Test the System

1. Navigate to Settings page
2. Go to "Email Digest System" tab
3. Select frequency (daily/weekly)
4. Click "Send Digest Now"
5. Check monitoring tab for results

### Step 6: Monitor Performance

View digest statistics in:
- Settings > Email Digest System > Monitoring tab
- Shows: total sent, success rate, failures, avg regulations per email

## Troubleshooting

### No Emails Sent
- Check RESEND_API_KEY is set correctly
- Verify edge function is deployed
- Check alert_profiles table has active profiles
- Ensure instruments table has recent data

### Emails Not Received
- Check spam folder
- Verify email address in alert_profiles
- Check Resend dashboard for delivery status
- Verify domain is verified in Resend

### Cron Jobs Not Running
- Verify pg_cron extension is enabled
- Check cron.job table for scheduled jobs
- View logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

### Low Match Rate
- Check keyword filters in alert profiles
- Verify instruments have proper metadata
- Adjust time window (24h for daily, 7d for weekly)

## Customization

### Change Send Times
Modify cron schedule:
- `'0 8 * * *'` = 8 AM daily
- `'0 20 * * *'` = 8 PM daily
- `'0 8 * * 1'` = 8 AM Monday
- `'0 8 * * 5'` = 8 AM Friday

### Add More Frequencies
1. Add to alert_profiles frequency check constraint
2. Update edge function to handle new frequency
3. Create new cron schedule
4. Update UI select options

### Custom Email Templates
Edit `src/lib/emailTemplates.ts`:
- Modify HTML structure
- Change colors/branding
- Add/remove sections
- Adjust regulation card layout

## Monitoring Queries

```sql
-- View recent digest sends
SELECT * FROM digest_log ORDER BY sent_at DESC LIMIT 20;

-- Success rate by frequency
SELECT 
  frequency,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  ROUND(100.0 * SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM digest_log
GROUP BY frequency;

-- Average regulations per digest
SELECT 
  frequency,
  AVG(regulations_count) as avg_regs,
  MAX(regulations_count) as max_regs
FROM digest_log
WHERE status = 'sent'
GROUP BY frequency;
```
