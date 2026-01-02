# State Regulations Polling System

## Overview

The state regulations polling system tracks cannabis and hemp regulatory updates from all 50 states, including:
- **Regulations** - Official rules and regulations
- **News/Announcements** - Agency news and press releases
- **Industry Bulletins** - Updates for licensees
- **Guidance Documents** - Compliance guidance
- **Administrative Memos** - Policy memos and directives
- **Administrative Orders** - Emergency orders and directives

## States Tracked (50 Total)

### Adult-Use + Medical States
| State | Agency |
|-------|--------|
| CA | Department of Cannabis Control |
| CO | Marijuana Enforcement Division |
| WA | Liquor and Cannabis Board |
| OR | Oregon Liquor and Cannabis Commission |
| NV | Cannabis Compliance Board |
| MA | Cannabis Control Commission |
| MI | Cannabis Regulatory Agency |
| IL | Dept. of Financial and Professional Regulation |
| AZ | Department of Health Services |
| NY | Office of Cannabis Management |
| NJ | Cannabis Regulatory Commission |
| VT | Cannabis Control Board |
| ME | Office of Cannabis Policy |
| CT | Department of Consumer Protection |
| RI | Cannabis Control Commission |
| DE | Office of the Marijuana Commissioner |
| MN | Office of Cannabis Management |
| MT | Department of Revenue |
| AK | Alcohol and Marijuana Control Office |

### Medical-Only States
| State | Agency |
|-------|--------|
| FL | Office of Medical Marijuana Use |
| PA | Department of Health |
| OH | Division of Cannabis Control |
| MD | Cannabis Administration |
| MO | Division of Cannabis Regulation |
| VA | Cannabis Control Authority |
| NM | Cannabis Control Division |
| KY | Office of Medical Cannabis |
| WV | Office of Medical Cannabis |
| OK | Medical Marijuana Authority |
| AR | Alcoholic Beverage Control |
| LA | Department of Health |
| UT | Center for Medical Cannabis |
| MS | Department of Health |
| AL | Medical Cannabis Commission |
| HI | Department of Health |
| NH | Therapeutic Cannabis Program |
| ND | Department of Health |
| SD | Department of Health |

### Hemp/CBD States
| State | Agency |
|-------|--------|
| TX | Department of State Health Services |
| GA | Access to Medical Cannabis Commission |
| NC | Dept. of Agriculture |
| SC | Dept. of Agriculture |
| TN | Dept. of Agriculture |
| KS | Department of Agriculture |
| NE | Department of Agriculture |
| WI | Department of Agriculture |
| IA | Department of Public Health |
| IN | State Department of Health |
| ID | Department of Agriculture |
| WY | Department of Agriculture |

## Manual Polling

To manually trigger state regulation updates:

1. Go to **Data Management** → **State Regulations** tab
2. Click **"Poll All States"** to update all states
3. Or click **"Update [STATE]"** on individual state cards

## Scheduled Polling

The `scheduled-poller-cron` function should be updated to include state regulations:

```typescript
// In scheduled-poller-cron, add:
// Trigger Cannabis Hemp Poller - runs every 6 hours
try {
  const stateResponse = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/cannabis-hemp-poller`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({ forceRefresh: false })
    }
  );
  
  const stateData = await stateResponse.json();
  results.stateRegulations = {
    success: stateResponse.ok,
    message: stateData.message || 'Completed',
    recordsAdded: stateData.newRecords || stateData.recordsProcessed || 0
  };
} catch (error) {
  results.stateRegulations.message = `Error: ${error.message}`;
}
```

## Edge Function: cannabis-hemp-poller

The `cannabis-hemp-poller` edge function includes:

1. **50 states** with comprehensive source tracking
2. **Multiple document types** per state (regulations, news, bulletins, guidance, memos, orders)
3. **Force refresh option** to update all records regardless of last update time
4. **Individual state polling** to update a specific state only
5. **Ingestion logging** to track polling history

### Request Body Options

```json
{
  "stateCode": "CA",        // Optional: Poll specific state only
  "forceRefresh": true,     // Optional: Force update all records
  "sessionId": "uuid",      // Optional: For progress tracking
  "sourceName": "State Regulations"  // Optional: For progress tracking
}
```

### Response

```json
{
  "success": true,
  "recordsProcessed": 185,
  "newRecords": 12,
  "statesProcessed": 50,
  "states": ["CA", "CO", "WA", ...],
  "message": "Processed 185 records from 50 states. 12 new records added."
}
```

## Document Types

| Type | Label | Description |
|------|-------|-------------|
| regulations | Regulation | Official rules and regulations |
| news | News/Announcement | Agency news and press releases |
| bulletins | Industry Bulletin | Updates for licensees |
| guidance | Guidance Document | Compliance guidance |
| memos | Administrative Memo | Policy memos and directives |
| orders | Administrative Order | Emergency orders |

## Database Schema

Records are stored in the `instrument` table with:

```sql
{
  external_id: '{state_code}-{type}-{url_hash}',
  title: '{State} {Document Type}: {Description}',
  description: '{Document Type} from {Agency} - {Description}',
  effective_date: '{poll_date}',
  jurisdiction_id: '{jurisdiction_uuid}',
  source: 'state_regulations',
  url: '{source_url}',
  metadata: {
    state_code: '{code}',
    state_name: '{name}',
    agency: '{agency}',
    document_type: '{type}',
    document_type_label: '{label}',
    source_description: '{description}',
    category: 'Cannabis',
    verified: true,
    last_polled: '{timestamp}',
    auto_updated: true
  }
}
```

## Polling History

Polling runs are logged in the `ingestion_log` table:

```sql
{
  source: 'cannabis_hemp_poller',
  status: 'success' | 'partial' | 'failed',
  records_processed: 185,
  records_added: 12,
  metadata: {
    states_processed: ['CA', 'CO', ...],
    errors: [...],
    force_refresh: false,
    specific_state: null
  }
}
```

## Troubleshooting

### States Not Updating

1. Check the **Polling History** tab for errors
2. Try **Force Refresh** on the specific state
3. Verify the state's regulatory agency URLs are still valid

### Missing Document Types

Some states may not have all document types available. The system only tracks sources that exist for each state's regulatory agency.

### Polling Failures

If polling fails:
1. Check Supabase edge function logs
2. Verify API keys are configured
3. Check for rate limiting from state websites
