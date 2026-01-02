# Fix Invite Email URL (localhost:3000 → Production URL)

The invite emails are showing `localhost:3000` because the **Supabase Site URL** is not configured for production.

## Quick Fix (2 minutes)

### Step 1: Go to Supabase Dashboard

1. Open your Supabase project dashboard
2. Go to **Authentication** → **URL Configuration** (in the left sidebar)

### Step 2: Update Site URL

Change the **Site URL** from:
```
http://localhost:3000
```

To your production URL:
```
https://your-app-name.vercel.app
```

(Replace with your actual Vercel/production URL)

### Step 3: Add Redirect URLs

In the **Redirect URLs** section, add ALL of these:

```
https://your-app-name.vercel.app/**
https://your-app-name.vercel.app/verify-email
https://your-app-name.vercel.app/login
https://your-app-name.vercel.app/password-reset
```

Also keep localhost for development:
```
http://localhost:3000/**
http://localhost:5173/**
```

### Step 4: Save Changes

Click **Save** at the bottom of the page.

---

## Why This Happens

When you send invites from the Supabase Dashboard, it uses the **Site URL** configured in your project settings. The code in your app uses `window.location.origin` which works correctly, but dashboard-sent invites use the Site URL setting.

## After Fixing

1. **Resend the invite** - Old invites will still have the wrong URL
2. The new invite email will show your production URL
3. Users can click the link and be redirected to your live site

---

## Screenshot Guide

### Where to find URL Configuration:

```
Supabase Dashboard
└── Authentication (left sidebar)
    └── URL Configuration
        ├── Site URL: [Change this to production URL]
        └── Redirect URLs: [Add production URLs here]
```

---

## Common Production URLs

If you deployed to Vercel, your URL is likely:
- `https://your-project-name.vercel.app`

If you have a custom domain:
- `https://yourdomain.com`

---

## OTP Expired Error

The error `otp_expired` happens because:
1. The link pointed to localhost (which doesn't exist in production)
2. By the time you noticed and tried to use it, the token expired

After fixing the Site URL, new invites will work correctly.
