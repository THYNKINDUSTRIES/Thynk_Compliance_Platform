# Cloudflare Zero Trust Setup for Private Beta

This guide configures Cloudflare Zero Trust to restrict access to thynkflow.io during private beta.

## Prerequisites

- Cloudflare account with Zero Trust enabled
- Domain (thynkflow.io) proxied through Cloudflare
- Admin access to Cloudflare dashboard

---

## Step 1: Enable Zero Trust

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account
3. Navigate to **Zero Trust** in the sidebar
4. Complete the onboarding if not already done

---

## Step 2: Create Access Application

1. Go to **Zero Trust** → **Access** → **Applications**
2. Click **Add an application**
3. Select **Self-hosted**

### Application Configuration:

```
Application name: Thynk Compliance Platform (Beta)
Session Duration: 24 hours
Application domain: thynkflow.io
```

### Additional URLs (if needed):
- `*.thynkflow.io` (for subdomains)
- `beta.thynkflow.io` (preview subdomain)

---

## Step 3: Create Access Policy

### Policy 1: Email Domain Access

```yaml
Policy name: Thynk Team Access
Action: Allow
Session duration: 24 hours

Include rules:
  - Emails ending in: @thynk.guru

Require rules: (optional)
  - Valid certificate (if using mTLS)
```

### Policy 2: Office IP Access

```yaml
Policy name: Office Network Access
Action: Allow
Session duration: 24 hours

Include rules:
  - IP ranges: 192.168.1.0/24
  
Note: Replace with your actual office public IP range
For remote workers, add their static IPs or use email-based auth
```

### Combined Policy (Recommended):

```yaml
Policy name: Beta Access - Combined
Action: Allow
Session duration: 24 hours

Include rules (ANY of these):
  - Emails ending in: @thynk.guru
  - IP ranges: 192.168.1.0/24

Optional additional security:
  - Require: Country (United States)
  - Require: Login method (One-time PIN or Google Workspace)
```

---

## Step 4: Configure SSL/TLS

1. Go to **SSL/TLS** in Cloudflare dashboard
2. Set encryption mode to **Full (strict)**

### SSL/TLS Settings:

```
Encryption mode: Full (strict)
Always Use HTTPS: ON
Automatic HTTPS Rewrites: ON
Minimum TLS Version: TLS 1.2
Opportunistic Encryption: ON
TLS 1.3: ON
```

### Edge Certificates:
- Enable **Universal SSL** (free)
- Or upload custom certificate

### Origin Server:
- Ensure Vercel has valid SSL certificate
- Vercel provides automatic SSL for custom domains

---

## Step 5: Security Headers (Page Rules)

Create a Page Rule for additional security:

```
URL: thynkflow.io/*

Settings:
- SSL: Full (strict)
- Always Use HTTPS: On
- Security Level: High
- Browser Integrity Check: On
```

---

## Step 6: WAF Rules (Optional but Recommended)

### Create Custom WAF Rules:

```javascript
// Block non-US traffic (if needed)
(ip.geoip.country ne "US")
Action: Block

// Block known bad bots
(cf.client.bot)
Action: Challenge

// Rate limiting for login
(http.request.uri.path eq "/login" and http.request.method eq "POST")
Action: Rate limit (10 requests per minute)
```

---

## Step 7: Preview Subdomain Setup

For `beta.thynkflow.io`:

1. Add DNS record:
   ```
   Type: CNAME
   Name: beta
   Target: cname.vercel-dns.com
   Proxy: Yes (orange cloud)
   ```

2. Create separate Access Application for beta subdomain
3. Apply same policies

---

## Step 8: Verify Configuration

### Test Access:

1. **Authorized User Test:**
   - Sign in with @thynk.guru email
   - Should have full access

2. **Unauthorized User Test:**
   - Try accessing from non-whitelisted IP
   - Try signing in with non-@thynk.guru email
   - Should see Cloudflare Access login page

3. **SSL Test:**
   - Visit https://thynkflow.io
   - Check for valid certificate
   - Verify HTTPS redirect from HTTP

### Verification Commands:

```bash
# Check SSL certificate
curl -vI https://thynkflow.io 2>&1 | grep -i "SSL\|certificate"

# Check security headers
curl -I https://thynkflow.io

# Test HTTP to HTTPS redirect
curl -I http://thynkflow.io
```

---

## Environment Variables

Add to Vercel project settings:

```env
# Beta mode flag
VITE_BETA_MODE=true

# Allowed email domain
VITE_ALLOWED_EMAIL_DOMAIN=@thynk.guru

# Cloudflare Access settings (for API validation)
CF_ACCESS_CLIENT_ID=<your-client-id>
CF_ACCESS_CLIENT_SECRET=<your-client-secret>
```

---

## Monitoring & Logs

### Access Logs:
- Go to **Zero Trust** → **Logs** → **Access**
- Monitor login attempts and blocked requests

### Security Events:
- Go to **Security** → **Events**
- Review WAF blocks and challenges

### Set Up Alerts:
1. Go to **Notifications**
2. Create alert for:
   - Failed Access attempts
   - WAF blocks
   - SSL certificate expiration

---

## Troubleshooting

### Common Issues:

1. **"Access Denied" for authorized users:**
   - Check email domain spelling
   - Verify policy is active
   - Clear browser cookies and retry

2. **SSL errors:**
   - Ensure origin has valid certificate
   - Check SSL mode is "Full (strict)"
   - Verify DNS is proxied (orange cloud)

3. **Infinite redirect loop:**
   - Check "Always Use HTTPS" setting
   - Verify Vercel HTTPS configuration
   - Check for conflicting page rules

---

## Rollback Plan

To disable Zero Trust (for public launch):

1. Go to **Access** → **Applications**
2. Disable or delete the application
3. Update `VITE_BETA_MODE=false` in Vercel
4. Remove `noindex` meta tags from index.html
5. Update robots.txt to allow indexing

---

## Security Checklist

- [ ] Zero Trust application created
- [ ] Email domain policy configured (@thynk.guru)
- [ ] IP whitelist policy configured (192.168.1.0/24)
- [ ] SSL/TLS set to Full (strict)
- [ ] Always Use HTTPS enabled
- [ ] Security headers configured
- [ ] WAF rules active
- [ ] Access logs monitored
- [ ] Alerts configured
- [ ] Preview subdomain secured

---

## Support

For issues with Cloudflare Zero Trust:
- [Cloudflare Zero Trust Docs](https://developers.cloudflare.com/cloudflare-one/)
- [Community Forums](https://community.cloudflare.com/)

For internal support:
- Email: support@thynk.guru
- Slack: #platform-security
