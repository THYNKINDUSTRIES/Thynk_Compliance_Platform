# Enhanced State Regulations Polling System

## Overview

The enhanced cannabis-hemp-poller now covers **50 states** with:
- RSS/Atom feed parsing
- HTML news page scraping
- OpenAI GPT-4o-mini content categorization
- Document type classification (14 types)
- Urgency level assignment (critical, high, medium, low)
- Relevance flags (dispensary, licensing, compliance)

## States Covered (50 Total)

### Original 20 States
| State | Code | Agency | Has RSS |
|-------|------|--------|---------|
| California | CA | Department of Cannabis Control | ✅ |
| Colorado | CO | Marijuana Enforcement Division | |
| Washington | WA | Liquor and Cannabis Board | |
| Oregon | OR | Liquor and Cannabis Commission | |
| Nevada | NV | Cannabis Compliance Board | |
| Massachusetts | MA | Cannabis Control Commission | ✅ |
| Michigan | MI | Cannabis Regulatory Agency | |
| Illinois | IL | Dept. of Financial and Professional Regulation | |
| Arizona | AZ | Department of Health Services | |
| New York | NY | Office of Cannabis Management | |
| New Jersey | NJ | Cannabis Regulatory Commission | |
| Pennsylvania | PA | Department of Health | |
| Ohio | OH | Division of Cannabis Control | |
| Maryland | MD | Cannabis Administration | |
| Missouri | MO | Division of Cannabis Regulation | |
| Connecticut | CT | Department of Consumer Protection | |
| Virginia | VA | Cannabis Control Authority | |
| New Mexico | NM | Cannabis Control Division | |
| Maine | ME | Office of Cannabis Policy | |
| Vermont | VT | Cannabis Control Board | ✅ |

### Additional 30 States (Added December 2024)
| State | Code | Agency | Program Type |
|-------|------|--------|--------------|
| Florida | FL | Office of Medical Marijuana Use (OMMU) | Medical |
| Texas | TX | DSHS Consumable Hemp Program | Hemp |
| Georgia | GA | Access to Medical Cannabis Commission | Medical (Low-THC) |
| North Carolina | NC | Dept. of Agriculture - Plant Industry | Hemp (USDA) |
| South Carolina | SC | Dept. of Agriculture - Hemp Program | Hemp |
| Tennessee | TN | Dept. of Agriculture - Hemp Program | Hemp-Derived |
| Kentucky | KY | Office of Medical Cannabis | Medical (2025) |
| West Virginia | WV | Office of Medical Cannabis | Medical |
| Delaware | DE | Office of the Marijuana Commissioner | Adult-Use (2025) |
| Rhode Island | RI | Cannabis Control Commission | Adult-Use + Medical |
| Alaska | AK | Alcohol and Marijuana Control Office | Adult-Use + Medical |
| Hawaii | HI | Department of Health | Medical |
| Montana | MT | Department of Revenue | Adult-Use + Medical |
| Minnesota | MN | Office of Cannabis Management | Adult-Use (2025) |
| Louisiana | LA | Department of Health | Medical |
| Arkansas | AR | Alcoholic Beverage Control | Medical |
| Oklahoma | OK | Medical Marijuana Authority | Medical |
| Utah | UT | Department of Health | Medical |
| Mississippi | MS | Department of Health | Medical |
| Alabama | AL | Medical Cannabis Commission | Medical (2025) |
| New Hampshire | NH | Therapeutic Cannabis Program | Medical |
| North Dakota | ND | Department of Health | Medical |
| South Dakota | SD | Department of Health | Medical |
| Iowa | IA | Department of Public Health | Medical (CBD) |
| Kansas | KS | Department of Agriculture | Hemp |
| Nebraska | NE | Department of Agriculture | Hemp |
| Wisconsin | WI | Department of Agriculture | Hemp |
| Indiana | IN | State Department of Health | Hemp (CBD) |
| Idaho | ID | Department of Agriculture | Hemp |
| Wyoming | WY | Department of Agriculture | Hemp |

## Deployment

### Option 1: Manual Deployment (Recommended)

See **MANUAL_DEPLOY_STATE_POLLER.md** for complete step-by-step instructions with the full edge function code.

### Option 2: Supabase Dashboard

1. Go to Supabase Dashboard > Edge Functions
2. Find `cannabis-hemp-poller`
3. Click Edit
4. Replace code with content from MANUAL_DEPLOY_STATE_POLLER.md
5. Click Deploy

## Usage

### Poll All 50 States
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/cannabis-hemp-poller \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Poll Single State
```bash
# Poll Florida
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/cannabis-hemp-poller \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"stateCode": "FL"}'

# Poll Kentucky
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/cannabis-hemp-poller \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"stateCode": "KY"}'
```

### Full Scan (Re-analyze All)
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/cannabis-hemp-poller \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"fullScan": true}'
```

## Response Format

```json
{
  "success": true,
  "recordsProcessed": 245,
  "newItemsFound": 38,
  "statesProcessed": 50,
  "totalStatesAvailable": 50,
  "errors": [],
  "recentItems": [
    {
      "state": "FL",
      "title": "2024 OMMU Weekly Update",
      "type": "announcement",
      "urgency": "medium",
      "isNew": true,
      "link": "https://knowthefactsmmj.com/..."
    }
  ]
}
```

## Document Types (14)

| Type | Description |
|------|-------------|
| `regulation` | Official regulatory text |
| `proposed_rule` | Proposed rulemaking |
| `final_rule` | Finalized rules |
| `guidance` | Agency guidance documents |
| `bulletin` | Industry bulletins |
| `memo` | Internal memos |
| `press_release` | Press releases |
| `announcement` | General announcements |
| `enforcement_action` | Enforcement actions |
| `license_update` | License-related updates |
| `policy_change` | Policy changes |
| `public_notice` | Public notices |
| `emergency_rule` | Emergency rules |
| `advisory` | Advisory notices |

## Urgency Levels

| Level | Trigger Keywords |
|-------|------------------|
| `critical` | emergency, immediate, urgent |
| `high` | deadline, required, mandatory |
| `medium` | default |
| `low` | update, reminder |

## Relevance Flags

- **isDispensaryRelated**: dispensary, retail, storefront, MMTC
- **isLicensingRelated**: license, permit, renewal, lottery
- **isComplianceRelated**: compliance, requirement, violation, inspection

## Database Requirements

Ensure all 50 states exist in the `jurisdiction` table:

```sql
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
  ('Rhode Island', 'RI', 'state'),
  ('Alaska', 'AK', 'state'),
  ('Hawaii', 'HI', 'state'),
  ('Montana', 'MT', 'state'),
  ('Minnesota', 'MN', 'state'),
  ('Louisiana', 'LA', 'state'),
  ('Arkansas', 'AR', 'state'),
  ('Oklahoma', 'OK', 'state'),
  ('Utah', 'UT', 'state'),
  ('Mississippi', 'MS', 'state'),
  ('Alabama', 'AL', 'state'),
  ('New Hampshire', 'NH', 'state'),
  ('North Dakota', 'ND', 'state'),
  ('South Dakota', 'SD', 'state'),
  ('Iowa', 'IA', 'state'),
  ('Kansas', 'KS', 'state'),
  ('Nebraska', 'NE', 'state'),
  ('Wisconsin', 'WI', 'state'),
  ('Indiana', 'IN', 'state'),
  ('Idaho', 'ID', 'state'),
  ('Wyoming', 'WY', 'state')
ON CONFLICT (code) DO NOTHING;
```

## Scheduled Polling

The `scheduled-poller-cron` function triggers the cannabis-hemp-poller every 6 hours at 0, 6, 12, 18 UTC.

## Troubleshooting

### "No jurisdiction found for XX"
Add the state to the jurisdiction table using the SQL above.

### OpenAI Analysis Not Working
Verify `OPENAI_API_KEY` is set in Supabase Edge Function secrets.

### Fetch Timeouts
Some state websites may block automated requests. The function uses:
- 15-second timeout
- 2 retries with exponential backoff
- Browser-like User-Agent header

## UI Component

The `CannabisHempPoller.tsx` component displays:
- All 50 states with status indicators
- Document type badges (AI-categorized)
- Urgency levels
- Recent items tab
- Per-state polling controls
- Polling history logs
