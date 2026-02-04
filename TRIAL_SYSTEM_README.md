# THYNKFLOW Trial System Implementation

This document provides complete implementation instructions for the THYNKFLOW 3-day trial system with fraud prevention.

## Overview

The trial system implements:
- ✅ 3-day trial with credit card verification ($0 charge)
- ✅ Single jurisdiction selection
- ✅ Read-only summaries only
- ✅ No exports or notifications
- ✅ Delayed data (24-48 hours old)
- ✅ Device & payment fingerprinting
- ✅ Multi-layer abuse detection
- ✅ Authorized domain bypass

## Architecture

### Backend (Supabase Edge Functions)
- `trial-management`: Handles signup, status checks, and trial extension
- `stripe-webhook`: Processes Stripe subscription events

### Database Schema
- Extended `user_profiles` table with trial fields
- New `trial_fingerprints` table for abuse prevention
- RLS policies enforcing trial restrictions

### Frontend Integration
- FingerprintJS for device fingerprinting
- Stripe Elements for payment verification
- Trial status checking and UI restrictions

## Setup Instructions

### 1. Environment Variables

Add to Supabase Edge Function secrets:
```bash
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
AUTHORIZED_DOMAINS=thynk.guru,cultivalaw.com,discountpharms.com
```

### 2. Database Setup

Execute the SQL in `supabase/migrations/trial_system_schema.sql` in your Supabase SQL Editor.

### 3. Deploy Edge Functions

```bash
supabase functions deploy trial-management
supabase functions deploy stripe-webhook
```

### 4. Stripe Configuration

1. Create products and prices in Stripe Dashboard
2. Set up webhook endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Subscribe to events: `customer.subscription.*`, `invoice.*`, `setup_intent.succeeded`

### 5. Frontend Integration

#### Add to HTML head:
```html
<script src="https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@4/dist/fp.min.js"></script>
<script src="https://js.stripe.com/v3/"></script>
```

#### Initialize in your app:
```javascript
import { initFingerprint, initializeStripeElements, handleTrialSignup } from '@/lib/trialSystem';

// Initialize on app load
initFingerprint();
initializeStripeElements();
```

#### Use TrialSignupForm component:
```tsx
import { TrialSignupForm } from '@/components/TrialSignupForm';

// Render in your signup page
<TrialSignupForm />
```

## Abuse Prevention

### Detection Logic
- **Device Fingerprinting**: Blocks multiple trials per FingerprintJS visitorId
- **Payment Method**: Prevents reuse of Stripe payment methods
- **Domain Limiting**: Max 2 trials per company domain
- **IP Subnet**: Max 1 trial per /24 subnet
- **Authorized Domains**: @thynk.guru, @cultivalaw.com, @discountpharms.com bypass all checks

### Scoring System
- Device fingerprint match: +50 points
- Payment method match: +40 points
- Domain abuse: +30 points
- IP subnet match: +20 points
- **Block threshold**: 60+ points

### Response Actions
- **Block**: Prevent trial signup, show sales contact prompt
- **Monitor**: Log suspicious activity
- **Escalate**: High-score attempts trigger manual review

## Trial Restrictions

### Data Filtering
```sql
-- Trial users see only:
WHERE updated_at <= NOW() - INTERVAL '24 hours'
AND jurisdiction_code = user.selected_jurisdiction
```

### UI Restrictions
- Hide full regulation text
- Show "Live regulatory updates activate with a paid subscription."
- Disable export buttons
- Block notification preferences
- Display time-delayed data warnings

### Authorized Domain Override
Users from authorized domains get full access regardless of subscription status.

## Testing

### Beta Testing Helpers
- Set `SHORT_TRIAL_MINUTES=5` for 5-minute trials instead of 3 days
- Use `DEBUG_MODE=true` for verbose logging
- Admin endpoint: `POST /functions/v1/trial-management/extend` to extend trials

### Test Scenarios
1. **Normal Trial**: Signup → 3-day access → auto-convert or cancel
2. **Abuse Detection**: Multiple signups with same payment method
3. **Authorized Domain**: @thynk.guru email gets full access
4. **Data Restrictions**: Trial users see delayed/summarized data only

## Low-Cost Services Used

### Free Tier Services
- **Supabase**: PostgreSQL, Edge Functions, Auth (free tier)
- **Stripe**: Test mode, webhooks (no cost for testing)
- **FingerprintJS**: Open-source version (free)

### Cost Optimization
- RLS policies reduce database load
- Edge Functions auto-scale to zero
- Fingerprinting uses client-side hashing
- Webhook processing is event-driven

## Security Considerations

### Data Protection
- Payment methods tokenized by Stripe
- Fingerprints hashed with SHA-256
- IP addresses stored as subnets only
- No sensitive data in logs

### Privacy Compliance
- GDPR/CCPA compliant fingerprinting
- Minimal data retention
- User-controlled data deletion

## Monitoring & Maintenance

### Key Metrics
- Trial conversion rate
- Abuse detection rate
- Authorized domain usage
- Function execution times

### Maintenance Tasks
- Monitor Stripe webhook delivery
- Clean up old trial fingerprints (90 days)
- Update authorized domains as needed
- Review abuse detection rules quarterly

## Troubleshooting

### Common Issues
1. **FingerprintJS fails**: Check Content Security Policy
2. **Stripe setup fails**: Verify publishable key
3. **RLS blocks queries**: Check user profile setup
4. **Webhook not firing**: Verify endpoint URL and events

### Debug Mode
Enable `DEBUG_MODE=true` for detailed logging in Edge Functions.

## Support

For implementation questions:
- Check Edge Function logs: `supabase functions logs trial-management`
- Test webhooks with Stripe CLI: `stripe listen --forward-to localhost:54321`
- Validate RLS policies in Supabase SQL Editor

---

**Implementation preserves exact trial model specifications while maintaining security and preventing abuse.**