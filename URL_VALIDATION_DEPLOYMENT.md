# URL Validation System - Deployment Instructions

## Overview
This guide will help you deploy the automated URL validation system that checks all regulation URLs weekly, logs broken links, and sends email notifications to admins.

## Step 1: Create Database Table

Run the SQL script in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-url-validation-setup.sql`
4. Click "Run" to execute

This creates:
- `url_validation_log` table
- Indexes for performance
- RLS policies for security

## Step 2: Deploy Edge Functions

### Deploy validate-regulation-urls

```bash
# Navigate to your Supabase project directory
cd supabase/functions

# Create the function directory
mkdir -p validate-regulation-urls

# Copy the function code
cp ../../validate-regulation-urls-function.ts validate-regulation-urls/index.ts

# Deploy the function
supabase functions deploy validate-regulation-urls
```

### Deploy send-url-validation-report

```bash
# Create the function directory
mkdir -p send-url-validation-report

# Copy the function code
cp ../../send-url-validation-report-function.ts send-url-validation-report/index.ts

# Deploy the function
supabase functions deploy send-url-validation-report
```

## Step 3: Update scheduled-poller-cron

```bash
# Copy the updated cron function
cp ../../scheduled-poller-cron-updated.ts scheduled-poller-cron/index.ts

# Deploy the updated function
supabase functions deploy scheduled-poller-cron
```

## Step 4: Configure Admin Email

Update the admin email in `send-url-validation-report` function:

Edit `supabase/functions/send-url-validation-report/index.ts`:

```typescript
// Line ~254: Change to your actual admin email(s)
to: ['your-admin@example.com'],
// Or multiple emails:
to: ['admin1@example.com', 'admin2@example.com'],
```

Then redeploy:
```bash
supabase functions deploy send-url-validation-report
```

## Step 5: Verify Deployment

### Test URL Validation Manually

```bash
curl -X POST https://your-project.supabase.co/functions/v1/validate-regulation-urls \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Check Logs

```bash
supabase functions logs validate-regulation-urls --tail
supabase functions logs send-url-validation-report --tail
supabase functions logs scheduled-poller-cron --tail
```

## Step 6: Verify Schedule

The URL validation will run automatically:
- **Every Monday at 10:00 AM UTC**
- Triggered by the `scheduled-poller-cron` function
- Results logged to `url_validation_log` table
- Email sent if broken links are found

## Monitoring

### View Recent Validation Results

```sql
SELECT 
  checked_at,
  COUNT(*) as total_checked,
  SUM(CASE WHEN is_valid THEN 1 ELSE 0 END) as valid_count,
  SUM(CASE WHEN NOT is_valid THEN 1 ELSE 0 END) as invalid_count
FROM url_validation_log
WHERE checked_at > NOW() - INTERVAL '30 days'
GROUP BY checked_at
ORDER BY checked_at DESC;
```

### View Broken Links

```sql
SELECT 
  uvl.*,
  i.title,
  j.name as jurisdiction
FROM url_validation_log uvl
JOIN instrument i ON i.id = uvl.instrument_id
JOIN jurisdiction j ON j.id = i.jurisdiction_id
WHERE uvl.is_valid = false
ORDER BY uvl.checked_at DESC
LIMIT 50;
```

## Troubleshooting

### Functions Not Deploying
- Ensure you're in the correct directory
- Check Supabase CLI is authenticated: `supabase login`
- Verify project is linked: `supabase link`

### No Emails Being Sent
- Verify RESEND_API_KEY environment variable is set
- Check admin email address in function
- Review function logs for errors
- Ensure Resend domain is verified

### URLs Failing Validation
Some URLs may fail due to:
- Rate limiting from government sites
- Temporary server issues
- Redirect chains
- SSL certificate issues

Consider implementing retry logic or whitelisting known-good domains.

## Schedule Summary

| Task | Frequency | Time (UTC) | Day |
|------|-----------|------------|-----|
| Federal Register Polling | Hourly | Every hour | All |
| Regulations.gov Polling | Hourly | Every hour | All |
| Comment Deadline Reminders | Daily | 9:00 AM | All |
| **URL Validation** | **Weekly** | **10:00 AM** | **Monday** |

## Next Steps

After deployment, you can:
1. Add the URLValidationMonitor component to your admin dashboard
2. Set up additional email recipients
3. Customize validation logic for specific domains
4. Add retry logic for transient failures
