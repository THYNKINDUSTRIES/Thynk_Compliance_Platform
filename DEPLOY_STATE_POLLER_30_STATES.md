# Deploy Enhanced State Regulations Poller (30 States)

## Quick Deployment Guide

The automated deployment is experiencing connectivity issues. Please follow these manual steps:

### Step 1: Add New States to Database

Run this SQL in your Supabase Dashboard > SQL Editor:

```sql
-- Add the 10 new states to the jurisdiction table
INSERT INTO jurisdiction (name, code, type) VALUES 
  ('Florida', 'FL', 'state'),
  ('Texas', 'TX', 'state'),
  ('Georgia', 'GA', 'state'),
  ('North Carolina', 'NC', 'state'),
  ('South Carolina', 'SC', 'state'),
  ('Tennessee', 'TN', 'state'),
  ('Kentucky', 'KY', 'state'),
  ('West Virginia', 'WV', 'state'),
  ('Delaware', 'DE', 'state'),
  ('Rhode Island', 'RI', 'state')
ON CONFLICT (code) DO NOTHING;
```

### Step 2: Deploy Edge Function

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Find `state-regulations-poller` and click **Edit**
3. **Replace ALL code** with the content from `MANUAL_DEPLOY_STATE_POLLER.md`
4. Click **Deploy**

### Step 3: Test the Deployment

Test Florida (new state):
```bash
curl -X POST https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/state-regulations-poller \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"stateCode": "FL"}'
```

Expected response:
```json
{
  "success": true,
  "recordsProcessed": 5,
  "newItemsFound": 5,
  "statesProcessed": 1,
  "totalStatesAvailable": 30,
  "errors": [],
  "recentItems": [...]
}
```

## New States Added

| Code | State | Agency | Program Type |
|------|-------|--------|--------------|
| FL | Florida | Office of Medical Marijuana Use (OMMU) | Medical |
| TX | Texas | DSHS Consumable Hemp Program | Hemp |
| GA | Georgia | Access to Medical Cannabis Commission | Medical (Low-THC) |
| NC | North Carolina | Dept of Agriculture | Hemp (USDA) |
| SC | South Carolina | Dept of Agriculture | Hemp |
| TN | Tennessee | Dept of Agriculture | Hemp-Derived |
| KY | Kentucky | Office of Medical Cannabis | Medical (2025) |
| WV | West Virginia | Office of Medical Cannabis | Medical |
| DE | Delaware | Office of Marijuana Commissioner | Adult-Use (2025) |
| RI | Rhode Island | Cannabis Control Commission | Adult-Use + Medical |

## Features

- **30 states** total coverage
- **RSS feed parsing** for CA, MA, VT
- **HTML news page scraping** for all states
- **OpenAI GPT-4o-mini** content categorization
- **14 document types** (regulation, proposed_rule, final_rule, guidance, bulletin, memo, press_release, announcement, enforcement_action, license_update, policy_change, public_notice, emergency_rule, advisory)
- **Urgency levels** (critical, high, medium, low)
- **Relevance flags** (isDispensaryRelated, isLicensingRelated, isComplianceRelated)
- **Deduplication** with external_id tracking

## Test Commands

```bash
# Test single state
curl -X POST .../state-regulations-poller -d '{"stateCode": "FL"}'
curl -X POST .../state-regulations-poller -d '{"stateCode": "TX"}'
curl -X POST .../state-regulations-poller -d '{"stateCode": "KY"}'

# Test all 30 states
curl -X POST .../state-regulations-poller -d '{}'

# Full scan (re-analyze existing items)
curl -X POST .../state-regulations-poller -d '{"fullScan": true}'
```

## Troubleshooting

### "No jurisdiction found for XX, skipping"
Run the SQL in Step 1 to add missing states.

### OpenAI Analysis Not Working
Verify `OPENAI_API_KEY` is set in Supabase Dashboard > Project Settings > Edge Functions > Secrets.

### Fetch Timeouts
Some state websites may block automated requests. The function uses:
- 15-second timeout
- 2 retries with exponential backoff
- Browser-like User-Agent header
