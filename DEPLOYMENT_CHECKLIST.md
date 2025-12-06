# URL Validation System - Deployment Checklist

## Prerequisites
- ✅ Supabase project access
- ✅ RESEND_API_KEY configured in Supabase secrets
- ✅ Admin email address for notifications

---

## Step 1: Create Database Table

### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the contents of `supabase-url-validation-setup.sql`
5. Click **Run** button
6. Verify success message appears

### Option B: Using Supabase CLI
```bash
supabase db push --file supabase-url-validation-setup.sql
```

### Verification
Run this query in SQL Editor to verify table was created:
```sql
SELECT * FROM url_validation_log LIMIT 1;
```
Expected: Empty result (no error)

---

## Step 2: Deploy validate-regulation-urls Function

### Using Supabase Dashboard
1. Navigate to **Edge Functions** in Supabase Dashboard
2. Click **Create Function**
3. Name: `validate-regulation-urls`
4. Copy contents from `validate-regulation-urls-function.ts`
5. Paste into function editor
6. Click **Deploy**

### Verification
Test the function:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/validate-regulation-urls \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## Step 3: Deploy send-url-validation-report Function

### Using Supabase Dashboard
1. Navigate to **Edge Functions**
2. Click **Create Function**
3. Name: `send-url-validation-report`
4. Copy contents from `send-url-validation-report-function.ts`
5. Paste into function editor
6. Click **Deploy**

### Update Admin Email
Before deploying, update line 79 in the function:
```typescript
to: ['your-admin-email@example.com'],  // Replace with actual admin email
```

### Verification
Test with sample data:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-url-validation-report \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"brokenLinks":[{"title":"Test","url":"https://test.com","jurisdiction":"Test","error":"Test error"}]}'
```

---

## Step 4: Update scheduled-poller-cron Function

### Using Supabase Dashboard
1. Navigate to **Edge Functions**
2. Find existing `scheduled-poller-cron` function
3. Click to edit
4. Replace entire contents with `scheduled-poller-cron-updated.ts`
5. Click **Deploy**

### Verification
Check function logs after deployment:
```bash
# Function should show URL validation is scheduled for Mondays at 10 AM UTC
```

---

## Step 5: Configure Cron Schedule (If Not Already Set)

### Using Supabase Dashboard
1. Navigate to **Database** > **Cron Jobs** (or use pg_cron extension)
2. Create new cron job:
   - **Name**: `scheduled-poller-cron`
   - **Schedule**: `0 * * * *` (every hour)
   - **Command**: 
   ```sql
   SELECT net.http_post(
     url:='https://YOUR_PROJECT.supabase.co/functions/v1/scheduled-poller-cron',
     headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
   );
   ```

### Alternative: Use Supabase Cron Extension
```sql
SELECT cron.schedule(
  'scheduled-poller-cron',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/scheduled-poller-cron',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

---

## Step 6: Test the Complete System

### Manual Test
1. Navigate to your app's admin dashboard
2. Find the URL Validation Monitor component
3. Click **"Validate All URLs Now"** button
4. Wait for completion
5. Check for broken links in the results

### Check Database Logs
```sql
SELECT 
  uvl.checked_at,
  uvl.is_valid,
  uvl.status_code,
  uvl.error_message,
  i.title,
  j.name as jurisdiction
FROM url_validation_log uvl
JOIN instrument i ON i.id = uvl.instrument_id
JOIN jurisdiction j ON j.id = i.jurisdiction_id
ORDER BY uvl.checked_at DESC
LIMIT 20;
```

### Verify Email Notifications
- Check admin email inbox for broken link reports
- Verify email contains proper formatting and all broken links

---

## Step 7: Monitor Scheduled Execution

### Check Next Monday at 10 AM UTC
1. Wait until Monday 10:00 AM UTC
2. Check function logs:
   ```bash
   # In Supabase Dashboard: Edge Functions > scheduled-poller-cron > Logs
   ```
3. Verify URL validation ran automatically
4. Check email for any broken link reports

### View Execution History
```sql
SELECT 
  DATE(checked_at) as check_date,
  COUNT(*) as total_checks,
  SUM(CASE WHEN is_valid THEN 1 ELSE 0 END) as valid_urls,
  SUM(CASE WHEN NOT is_valid THEN 1 ELSE 0 END) as broken_urls
FROM url_validation_log
GROUP BY DATE(checked_at)
ORDER BY check_date DESC;
```

---

## Troubleshooting

### Issue: "Unauthorized" Error
**Solution**: Check that SUPABASE_SERVICE_ROLE_KEY is properly configured in edge function environment

### Issue: No Email Received
**Solution**: 
1. Verify RESEND_API_KEY is set in Supabase secrets
2. Check admin email address in send-url-validation-report function
3. Check Resend dashboard for email delivery status

### Issue: URL Validation Not Running on Monday
**Solution**:
1. Verify scheduled-poller-cron is running every hour
2. Check function logs for error messages
3. Ensure dayOfWeek and hour conditions are correct (Monday = 1, 10 AM = hour 10)

### Issue: Table Already Exists Error
**Solution**: This is normal if table was created previously. The SQL uses `IF NOT EXISTS` so it's safe to run multiple times.

---

## Success Criteria

✅ url_validation_log table exists with proper indexes and RLS
✅ validate-regulation-urls function deployed and responding
✅ send-url-validation-report function deployed and can send emails
✅ scheduled-poller-cron updated with URL validation trigger
✅ Manual URL validation test completes successfully
✅ Broken link email received at admin address
✅ Scheduled execution runs on Monday at 10 AM UTC

---

## Schedule Summary

| Task | Frequency | Time (UTC) | Day |
|------|-----------|------------|-----|
| Federal Register Polling | Every hour | All hours | All days |
| Regulations.gov Polling | Every hour | All hours | All days |
| Comment Deadline Reminders | Daily | 9:00 AM | All days |
| **URL Validation** | **Weekly** | **10:00 AM** | **Monday** |

---

## Next Steps After Deployment

1. Monitor first automated run on Monday
2. Review broken link reports and update URLs as needed
3. Consider adjusting validation frequency if needed
4. Add more admin email addresses to notification list
5. Set up dashboard alerts for high broken link counts
