# Fix Email Verification Not Sending

## Problem
Users sign up but don't receive verification emails from Supabase.

## Quick Diagnosis
1. **Check spam/junk folder** - Supabase emails often go to spam
2. **Check Supabase email logs** - Dashboard → Authentication → Logs
3. **Supabase free tier limit** - Only 4 emails/hour on free tier

---

## Solution 1: Disable Email Confirmation (Quickest Fix)

If you want users to sign up immediately without email verification:

1. Go to **Supabase Dashboard**
2. Navigate to **Authentication** → **Providers** → **Email**
3. **Turn OFF** "Confirm email"
4. Click **Save**

Users can now sign up and use the app immediately.

---

## Solution 2: Configure Custom SMTP with Resend (Recommended)

Since you have `RESEND_API_KEY` configured, use Resend as your SMTP provider:

### Step 1: Get Resend SMTP Credentials
1. Go to [resend.com/api-keys](https://resend.com/api-keys)
2. Your SMTP credentials are:
   - **Host**: `smtp.resend.com`
   - **Port**: `465` (SSL) or `587` (TLS)
   - **Username**: `resend`
   - **Password**: Your API key (the one you already have)

### Step 2: Configure in Supabase
1. Go to **Supabase Dashboard**
2. Navigate to **Project Settings** → **Authentication**
3. Scroll to **SMTP Settings**
4. Click **Enable Custom SMTP**
5. Enter:
   ```
   Host: smtp.resend.com
   Port: 465
   Username: resend
   Password: [Your RESEND_API_KEY]
   Sender email: noreply@yourdomain.com
   Sender name: Thynk Industries
   ```
6. Click **Save**

### Step 3: Verify Domain in Resend (Required)
1. Go to [resend.com/domains](https://resend.com/domains)
2. Add your domain (e.g., `thynk.com`)
3. Add the DNS records Resend provides
4. Wait for verification (usually 5-10 minutes)

**Note**: You cannot send from `@gmail.com` or other free email providers. You must use a domain you own.

---

## Solution 3: Use Resend's Default Domain (Testing Only)

For testing, Resend allows sending from `onboarding@resend.dev`:

1. In Supabase SMTP settings, set sender email to: `onboarding@resend.dev`
2. This works immediately but emails may look less professional

---

## Solution 4: Check Supabase Email Rate Limits

Supabase free tier has strict limits:
- **4 emails per hour** on free tier
- **100 emails per hour** on Pro tier

### To check if you're rate limited:
1. Go to **Supabase Dashboard**
2. Navigate to **Authentication** → **Logs**
3. Look for email send attempts and errors

### If rate limited:
- Wait 1 hour and try again
- Upgrade to Pro tier for higher limits
- Use custom SMTP (Solution 2)

---

## Solution 5: Update Site URL Configuration

Ensure your production URL is configured:

1. Go to **Supabase Dashboard**
2. Navigate to **Authentication** → **URL Configuration**
3. Set:
   - **Site URL**: `https://your-production-domain.com`
   - **Redirect URLs**: Add all valid redirect URLs:
     ```
     https://your-production-domain.com/verify-email
     https://your-production-domain.com/login
     https://your-production-domain.com/
     ```

---

## Troubleshooting Checklist

- [ ] Checked spam/junk folder
- [ ] Verified Site URL is set to production URL (not localhost)
- [ ] Checked Supabase Auth logs for errors
- [ ] Confirmed not hitting rate limits
- [ ] If using custom SMTP, verified domain in Resend

---

## Testing Email Delivery

After making changes, test with a fresh email:

1. Use an email you haven't tried before
2. Sign up through the app
3. Check inbox within 1-2 minutes
4. Check spam folder
5. Check Supabase Auth logs for delivery status

---

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Email rate limit exceeded" | Too many emails sent | Wait 1 hour or upgrade |
| "Invalid sender" | SMTP sender not verified | Verify domain in Resend |
| "Connection refused" | Wrong SMTP settings | Check host/port/credentials |
| No error but no email | Email in spam | Check spam folder |

---

## Recommended Setup for Production

1. **Verify your domain** in Resend
2. **Configure Custom SMTP** in Supabase with Resend
3. **Set proper Site URL** to your production domain
4. **Keep email confirmation ON** for security
5. **Monitor Auth logs** for delivery issues
