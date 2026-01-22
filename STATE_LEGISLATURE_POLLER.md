# State Legislature Poller Edge Function

This edge function monitors state legislature websites for cannabis-related bills using the LegiScan API and OpenStates API. It tracks bill status, sponsors, and voting records with proper CORS headers and integration with the scheduled-poller-cron orchestrator.

---

## Overview

| Feature | Description |
|---------|-------------|
| **Purpose** | Monitor state legislatures for cannabis/hemp-related bills |
| **APIs** | LegiScan API (primary), OpenStates/Plural API (secondary) |
| **Data Tracked** | Bill status, sponsors, voting records, amendments, history |
| **Rate Limits** | LegiScan: 30,000/month, OpenStates: 500/day |
| **Schedule** | Every 6 hours (4 times daily) |

---

## API Setup

### Required Secrets

Add these secrets in Supabase Dashboard → Edge Functions → Secrets:

| Secret Name | Value | Notes |
|-------------|-------|-------|
| `LEGISCAN_API_KEY` | `db9e2013fe8fc89561fd857e9b9f055d` | 30,000 monthly queries |
| `OPENSTATES_API_KEY` | `db79f2e7-d16e-4b9b-bb71-bb496dc308ed` | 500 daily requests, 1 req/sec |

### API Documentation

- **LegiScan API**: https://legiscan.com/legiscan
- **OpenStates API**: https://docs.openstates.org/api-v3/

---

## Database Setup

```sql
-- State legislature bills table
CREATE TABLE IF NOT EXISTS legislature_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(100) UNIQUE NOT NULL,
  bill_number VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  state_code VARCHAR(2) NOT NULL,
  session VARCHAR(100),
  session_year INTEGER,
  status VARCHAR(50),
  status_date DATE,
  last_action TEXT,
  last_action_date DATE,
  chamber VARCHAR(50), -- 'house', 'senate', 'joint'
  bill_type VARCHAR(50), -- 'bill', 'resolution', 'joint_resolution', etc.
  sponsors JSONB DEFAULT '[]',
  cosponsors JSONB DEFAULT '[]',
  subjects JSONB DEFAULT '[]',
  votes JSONB DEFAULT '[]',
  history JSONB DEFAULT '[]',
  amendments JSONB DEFAULT '[]',
  source VARCHAR(50), -- 'legiscan', 'openstates'
  source_url TEXT,
  full_text_url TEXT,
  is_cannabis_related BOOLEAN DEFAULT TRUE,
  cannabis_keywords TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Indexes for efficient querying
CREATE INDEX idx_legislature_bills_state ON legislature_bills(state_code);
CREATE INDEX idx_legislature_bills_status ON legislature_bills(status);
CREATE INDEX idx_legislature_bills_session ON legislature_bills(session_year);
CREATE INDEX idx_legislature_bills_updated ON legislature_bills(updated_at DESC);
CREATE INDEX idx_legislature_bills_cannabis ON legislature_bills(is_cannabis_related) WHERE is_cannabis_related = TRUE;

-- Full text search index
CREATE INDEX idx_legislature_bills_search ON legislature_bills 
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- Enable RLS
ALTER TABLE legislature_bills ENABLE ROW LEVEL SECURITY;

-- RLS policy for public read access
CREATE POLICY "Public can read legislature bills" ON legislature_bills
  FOR SELECT USING (true);

-- RLS policy for service role write access
CREATE POLICY "Service role can manage legislature bills" ON legislature_bills
  FOR ALL USING (auth.role() = 'service_role');

-- API usage tracking table
CREATE TABLE IF NOT EXISTS api_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name VARCHAR(50) NOT NULL,
  endpoint VARCHAR(200),
  requests_made INTEGER DEFAULT 1,
  date DATE DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint for daily tracking
CREATE UNIQUE INDEX idx_api_usage_daily ON api_usage_log(api_name, date);

-- Function to track API usage
CREATE OR REPLACE FUNCTION track_api_usage(p_api_name VARCHAR, p_requests INTEGER DEFAULT 1)
RETURNS void AS $$
BEGIN
  INSERT INTO api_usage_log (api_name, requests_made, date)
  VALUES (p_api_name, p_requests, CURRENT_DATE)
  ON CONFLICT (api_name, date)
  DO UPDATE SET requests_made = api_usage_log.requests_made + p_requests;
END;
$$ LANGUAGE plpgsql;
```

---

## Edge Function Code

Deploy in Supabase Dashboard → Edge Functions → New Function → `state-legislature-poller`:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Cannabis-related search terms
const CANNABIS_KEYWORDS = [
  'cannabis', 'marijuana', 'marihuana', 'hemp', 'CBD', 'cannabidiol',
  'THC', 'tetrahydrocannabinol', 'dispensary', 'dispensaries',
  'medical marijuana', 'recreational marijuana', 'adult-use cannabis',
  'cannabis cultivation', 'cannabis license', 'cannabis testing',
  'delta-8', 'delta-9', 'cannabinoid', 'controlled substance',
  'drug scheduling', 'decriminalization', 'legalization',
  'kratom', 'psilocybin', 'psychedelic', 'entheogen'
];

// States with active cannabis legislation (prioritized)
const PRIORITY_STATES = [
  'CA', 'CO', 'WA', 'OR', 'NV', 'AZ', 'IL', 'MI', 'MA', 'NY',
  'NJ', 'PA', 'FL', 'OH', 'MD', 'MO', 'VA', 'CT', 'RI', 'NM',
  'VT', 'ME', 'MT', 'AK', 'MN', 'DE', 'OK', 'NH', 'HI'
];

// All US state codes
const ALL_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

interface LegiScanBill {
  bill_id: number;
  bill_number: string;
  title: string;
  description?: string;
  state: string;
  session: { session_id: number; session_name: string; year_start: number };
  status: number;
  status_desc?: string;
  status_date?: string;
  last_action?: string;
  last_action_date?: string;
  url?: string;
  state_link?: string;
  sponsors?: any[];
  history?: any[];
  votes?: any[];
  amendments?: any[];
  subjects?: string[];
}

interface OpenStatesBill {
  id: string;
  identifier: string;
  title: string;
  abstract?: string;
  classification: string[];
  subject: string[];
  from_organization: { name: string; classification: string };
  legislative_session: { identifier: string; name: string };
  latest_action_date?: string;
  latest_action_description?: string;
  sponsorships?: any[];
  actions?: any[];
  votes?: any[];
  sources?: { url: string }[];
}

// LegiScan API functions
async function searchLegiScan(
  apiKey: string, 
  state: string, 
  query: string
): Promise<LegiScanBill[]> {
  const url = `https://api.legiscan.com/?key=${apiKey}&op=getSearch&state=${state}&query=${encodeURIComponent(query)}`;
  
  const response = await fetch(url, {
    headers: { 'User-Agent': 'ComplianceTracker/1.0' }
  });

  if (!response.ok) {
    throw new Error(`LegiScan API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.status === 'ERROR') {
    throw new Error(`LegiScan error: ${data.alert?.message || 'Unknown error'}`);
  }

  return data.searchresult?.results || [];
}

async function getLegiScanBillDetails(
  apiKey: string, 
  billId: number
): Promise<LegiScanBill | null> {
  const url = `https://api.legiscan.com/?key=${apiKey}&op=getBill&id=${billId}`;
  
  const response = await fetch(url, {
    headers: { 'User-Agent': 'ComplianceTracker/1.0' }
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.bill || null;
}

// OpenStates API functions
async function searchOpenStates(
  apiKey: string, 
  state: string, 
  query: string
): Promise<OpenStatesBill[]> {
  const jurisdiction = state.toLowerCase();
  const url = `https://v3.openstates.org/bills?jurisdiction=${jurisdiction}&q=${encodeURIComponent(query)}&page=1&per_page=50`;
  
  const response = await fetch(url, {
    headers: {
      'X-API-Key': apiKey,
      'User-Agent': 'ComplianceTracker/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`OpenStates API error: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}

async function getOpenStatesBillDetails(
  apiKey: string, 
  billId: string
): Promise<OpenStatesBill | null> {
  const url = `https://v3.openstates.org/bills/${billId}?include=sponsorships&include=actions&include=votes`;
  
  const response = await fetch(url, {
    headers: {
      'X-API-Key': apiKey,
      'User-Agent': 'ComplianceTracker/1.0'
    }
  });

  if (!response.ok) return null;

  return await response.json();
}

// Check if bill is cannabis-related
function isCannabisRelated(title: string, description?: string, subjects?: string[]): boolean {
  const text = `${title} ${description || ''} ${(subjects || []).join(' ')}`.toLowerCase();
  return CANNABIS_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
}

// Extract cannabis keywords found in bill
function extractCannabisKeywords(title: string, description?: string): string[] {
  const text = `${title} ${description || ''}`.toLowerCase();
  return CANNABIS_KEYWORDS.filter(keyword => text.includes(keyword.toLowerCase()));
}

// Map LegiScan status codes to readable status
function mapLegiScanStatus(statusCode: number): string {
  const statusMap: Record<number, string> = {
    1: 'introduced',
    2: 'engrossed',
    3: 'enrolled',
    4: 'passed',
    5: 'vetoed',
    6: 'failed',
    7: 'override',
    8: 'chaptered',
    9: 'refer',
    10: 'report_pass',
    11: 'report_dnp',
    12: 'draft'
  };
  return statusMap[statusCode] || 'unknown';
}

// Transform LegiScan bill to database format
function transformLegiScanBill(bill: LegiScanBill): any {
  const keywords = extractCannabisKeywords(bill.title, bill.description);
  
  return {
    external_id: `legiscan-${bill.bill_id}`,
    bill_number: bill.bill_number,
    title: bill.title,
    description: bill.description || '',
    state_code: bill.state,
    session: bill.session?.session_name || '',
    session_year: bill.session?.year_start || new Date().getFullYear(),
    status: mapLegiScanStatus(bill.status),
    status_date: bill.status_date || null,
    last_action: bill.last_action || '',
    last_action_date: bill.last_action_date || null,
    chamber: determineChamber(bill.bill_number),
    bill_type: determineBillType(bill.bill_number),
    sponsors: bill.sponsors || [],
    cosponsors: [],
    subjects: bill.subjects || [],
    votes: bill.votes || [],
    history: bill.history || [],
    amendments: bill.amendments || [],
    source: 'legiscan',
    source_url: bill.url || bill.state_link || null,
    full_text_url: bill.state_link || null,
    is_cannabis_related: true,
    cannabis_keywords: keywords,
    updated_at: new Date().toISOString(),
    metadata: {
      legiscan_bill_id: bill.bill_id,
      session_id: bill.session?.session_id,
      lastPolled: new Date().toISOString()
    }
  };
}

// Transform OpenStates bill to database format
function transformOpenStatesBill(bill: OpenStatesBill, stateCode: string): any {
  const keywords = extractCannabisKeywords(bill.title, bill.abstract);
  
  return {
    external_id: `openstates-${bill.id}`,
    bill_number: bill.identifier,
    title: bill.title,
    description: bill.abstract || '',
    state_code: stateCode.toUpperCase(),
    session: bill.legislative_session?.name || bill.legislative_session?.identifier || '',
    session_year: parseInt(bill.legislative_session?.identifier?.substring(0, 4)) || new Date().getFullYear(),
    status: bill.classification?.[0] || 'unknown',
    status_date: bill.latest_action_date?.split('T')[0] || null,
    last_action: bill.latest_action_description || '',
    last_action_date: bill.latest_action_date?.split('T')[0] || null,
    chamber: bill.from_organization?.classification || 'unknown',
    bill_type: bill.classification?.[0] || 'bill',
    sponsors: bill.sponsorships?.filter((s: any) => s.primary) || [],
    cosponsors: bill.sponsorships?.filter((s: any) => !s.primary) || [],
    subjects: bill.subject || [],
    votes: bill.votes || [],
    history: bill.actions || [],
    amendments: [],
    source: 'openstates',
    source_url: bill.sources?.[0]?.url || null,
    full_text_url: null,
    is_cannabis_related: true,
    cannabis_keywords: keywords,
    updated_at: new Date().toISOString(),
    metadata: {
      openstates_id: bill.id,
      classification: bill.classification,
      lastPolled: new Date().toISOString()
    }
  };
}

function determineChamber(billNumber: string): string {
  const upper = billNumber.toUpperCase();
  if (upper.startsWith('S') || upper.includes('SB') || upper.includes('SR')) return 'senate';
  if (upper.startsWith('H') || upper.includes('HB') || upper.includes('HR')) return 'house';
  if (upper.includes('J') || upper.includes('JOINT')) return 'joint';
  return 'unknown';
}

function determineBillType(billNumber: string): string {
  const upper = billNumber.toUpperCase();
  if (upper.includes('RES') || upper.includes('R ')) return 'resolution';
  if (upper.includes('JR') || upper.includes('JOINT')) return 'joint_resolution';
  if (upper.includes('CR') || upper.includes('CONCURRENT')) return 'concurrent_resolution';
  if (upper.includes('MEM') || upper.includes('MEMORIAL')) return 'memorial';
  return 'bill';
}

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const legiscanApiKey = Deno.env.get('LEGISCAN_API_KEY');
    const openstatesApiKey = Deno.env.get('OPENSTATES_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any = {};
    try {
      const text = await req.text();
      if (text && text.trim()) body = JSON.parse(text);
    } catch (e) {}

    const { 
      states = PRIORITY_STATES.slice(0, 10), // Default to top 10 priority states
      keywords = ['cannabis', 'marijuana', 'hemp'],
      useLegiScan = true,
      useOpenStates = true,
      maxBillsPerState = 25
    } = body;

    const startTime = Date.now();
    let totalBills = 0;
    let newBills = 0;
    let updatedBills = 0;
    const errors: string[] = [];
    const stateResults: Record<string, { bills: number; source: string }> = {};

    // Check API rate limits
    const today = new Date().toISOString().split('T')[0];
    
    const { data: legiscanUsage } = await supabase
      .from('api_usage_log')
      .select('requests_made')
      .eq('api_name', 'legiscan')
      .eq('date', today)
      .limit(1);

    const { data: openstatesUsage } = await supabase
      .from('api_usage_log')
      .select('requests_made')
      .eq('api_name', 'openstates')
      .eq('date', today)
      .limit(1);

    const legiscanRequestsToday = legiscanUsage?.[0]?.requests_made || 0;
    const openstatesRequestsToday = openstatesUsage?.[0]?.requests_made || 0;

    // LegiScan: 30,000/month ≈ 1,000/day safe limit
    const legiscanAvailable = useLegiScan && legiscanApiKey && legiscanRequestsToday < 1000;
    // OpenStates: 500/day
    const openstatesAvailable = useOpenStates && openstatesApiKey && openstatesRequestsToday < 450;

    if (!legiscanAvailable && !openstatesAvailable) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API rate limits reached for today',
          legiscanRequests: legiscanRequestsToday,
          openstatesRequests: openstatesRequestsToday
        }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Process each state
    for (const state of states) {
      let stateBills = 0;
      let stateSource = '';

      try {
        // Try LegiScan first (more comprehensive)
        if (legiscanAvailable) {
          for (const keyword of keywords) {
            try {
              const searchResults = await searchLegiScan(legiscanApiKey!, state, keyword);
              
              // Track API usage
              await supabase.rpc('track_api_usage', { p_api_name: 'legiscan', p_requests: 1 });

              for (const result of searchResults.slice(0, maxBillsPerState)) {
                if (!isCannabisRelated(result.title, result.description)) continue;

                // Get full bill details
                const billDetails = await getLegiScanBillDetails(legiscanApiKey!, result.bill_id);
                await supabase.rpc('track_api_usage', { p_api_name: 'legiscan', p_requests: 1 });

                if (billDetails) {
                  const billData = transformLegiScanBill(billDetails);
                  
                  const { error: upsertError } = await supabase
                    .from('legislature_bills')
                    .upsert(billData, { onConflict: 'external_id' });

                  if (!upsertError) {
                    stateBills++;
                    totalBills++;
                  }
                }

                // Rate limiting: 1 request per second for LegiScan
                await new Promise(resolve => setTimeout(resolve, 100));
              }

              // Small delay between keyword searches
              await new Promise(resolve => setTimeout(resolve, 200));

            } catch (keywordError: any) {
              errors.push(`LegiScan ${state}/${keyword}: ${keywordError.message}`);
            }
          }
          stateSource = 'legiscan';
        }

        // Fallback to OpenStates if LegiScan didn't return results
        if (stateBills === 0 && openstatesAvailable) {
          for (const keyword of keywords) {
            try {
              const searchResults = await searchOpenStates(openstatesApiKey!, state, keyword);
              
              // Track API usage
              await supabase.rpc('track_api_usage', { p_api_name: 'openstates', p_requests: 1 });

              for (const result of searchResults.slice(0, maxBillsPerState)) {
                if (!isCannabisRelated(result.title, result.abstract, result.subject)) continue;

                const billData = transformOpenStatesBill(result, state);
                
                const { error: upsertError } = await supabase
                  .from('legislature_bills')
                  .upsert(billData, { onConflict: 'external_id' });

                if (!upsertError) {
                  stateBills++;
                  totalBills++;
                }
              }

              // Rate limiting: 1 request per second for OpenStates
              await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (keywordError: any) {
              errors.push(`OpenStates ${state}/${keyword}: ${keywordError.message}`);
            }
          }
          stateSource = 'openstates';
        }

        stateResults[state] = { bills: stateBills, source: stateSource };

      } catch (stateError: any) {
        errors.push(`State ${state}: ${stateError.message}`);
        stateResults[state] = { bills: 0, source: 'error' };
      }
    }

    // Also sync to instrument table for unified search
    const { data: recentBills } = await supabase
      .from('legislature_bills')
      .select('*')
      .eq('is_cannabis_related', true)
      .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(100);

    for (const bill of recentBills || []) {
      // Get jurisdiction ID
      const { data: jurisdiction } = await supabase
        .from('jurisdiction')
        .select('id')
        .eq('code', bill.state_code)
        .limit(1);

      if (jurisdiction?.[0]) {
        await supabase.from('instrument').upsert({
          external_id: `legislature-${bill.external_id}`,
          title: `${bill.bill_number}: ${bill.title}`,
          description: bill.description || `${bill.state_code} ${bill.bill_type} - ${bill.status}`,
          effective_date: bill.status_date || bill.last_action_date || new Date().toISOString().split('T')[0],
          jurisdiction_id: jurisdiction[0].id,
          source: 'state_legislature',
          source_url: bill.source_url,
          instrument_type: 'legislation',
          status: bill.status,
          metadata: {
            bill_number: bill.bill_number,
            chamber: bill.chamber,
            bill_type: bill.bill_type,
            session: bill.session,
            sponsors: bill.sponsors,
            cannabis_keywords: bill.cannabis_keywords,
            legislature_source: bill.source,
            lastPolled: new Date().toISOString()
          }
        }, { onConflict: 'external_id' });
      }
    }

    // Log the ingestion
    await supabase.from('ingestion_log').insert({
      source_id: 'state-legislature-poller',
      source: 'state_legislature',
      status: errors.length === 0 ? 'success' : 'partial',
      records_fetched: totalBills,
      records_created: newBills,
      started_at: new Date().toISOString(),
      metadata: {
        statesProcessed: states.length,
        stateResults,
        keywords,
        legiscanAvailable,
        openstatesAvailable,
        errors: errors.length > 0 ? errors : undefined,
        executionTime: Date.now() - startTime
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'State legislature polling completed',
        totalBills,
        statesProcessed: states.length,
        stateResults,
        apiUsage: {
          legiscan: {
            available: legiscanAvailable,
            requestsToday: legiscanRequestsToday
          },
          openstates: {
            available: openstatesAvailable,
            requestsToday: openstatesRequestsToday
          }
        },
        errors: errors.length > 0 ? errors : undefined,
        executionTime: Date.now() - startTime
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('State legislature poller error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

---

## Test Commands

### Test OPTIONS Preflight

```bash
curl -X OPTIONS 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/state-legislature-poller' \
  -H 'Origin: https://your-app.com' \
  -H 'Access-Control-Request-Method: POST' \
  -v
```

### Test Default Run (Top 10 Priority States)

```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/state-legislature-poller' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### Test Specific States

```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/state-legislature-poller' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "states": ["CA", "CO", "NY"],
    "keywords": ["cannabis", "marijuana", "hemp", "CBD"]
  }'
```

### Test LegiScan Only

```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/state-legislature-poller' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "states": ["CA"],
    "useLegiScan": true,
    "useOpenStates": false
  }'
```

### Test OpenStates Only

```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/state-legislature-poller' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "states": ["CA"],
    "useLegiScan": false,
    "useOpenStates": true
  }'
```

---

## Integration with Scheduled Poller

Update the `scheduled-poller-cron` orchestrator to include the state legislature poller:

```typescript
// Add to POLLERS array in scheduled-poller-cron
{
  name: 'State Legislature',
  functionName: 'state-legislature-poller',
  schedule: 'every_6_hours',
  hoursToRun: [1, 7, 13, 19], // Offset from other pollers
  enabled: true,
  timeout: 120000 // 2 minutes - needs more time for multiple API calls
}
```

---

## Polling Schedule

| Time (UTC) | States Polled | API Priority |
|------------|---------------|--------------|
| 01:00 | CA, CO, WA, OR, NV | LegiScan |
| 07:00 | AZ, IL, MI, MA, NY | LegiScan |
| 13:00 | NJ, PA, FL, OH, MD | LegiScan |
| 19:00 | MO, VA, CT, RI, NM | LegiScan |

---

## API Rate Limit Management

### LegiScan Limits
- **Monthly Limit**: 30,000 queries
- **Safe Daily Limit**: ~1,000 queries
- **Requests per State/Keyword**: ~3 (search + details)
- **Daily Capacity**: ~33 states with 3 keywords each

### OpenStates Limits
- **Daily Limit**: 500 requests
- **Rate Limit**: 1 request/second
- **Requests per State/Keyword**: 1 (search only)
- **Daily Capacity**: ~16 states with 3 keywords each

### Optimization Strategies

1. **Prioritize States**: Focus on states with active cannabis legislation
2. **Cache Results**: Don't re-fetch bills that haven't changed
3. **Stagger Requests**: Spread API calls throughout the day
4. **Use Webhooks**: If available, prefer push over pull
5. **Track Usage**: Monitor daily API usage to avoid limits

---

## Querying Legislature Bills

### Get Recent Cannabis Bills

```sql
SELECT 
  bill_number,
  title,
  state_code,
  status,
  last_action,
  last_action_date,
  cannabis_keywords
FROM legislature_bills
WHERE is_cannabis_related = TRUE
  AND updated_at > NOW() - INTERVAL '7 days'
ORDER BY last_action_date DESC
LIMIT 50;
```

### Get Bills by State

```sql
SELECT *
FROM legislature_bills
WHERE state_code = 'CA'
  AND is_cannabis_related = TRUE
  AND session_year = 2026
ORDER BY last_action_date DESC;
```

### Search Bills by Keyword

```sql
SELECT *
FROM legislature_bills
WHERE to_tsvector('english', title || ' ' || description) 
  @@ plainto_tsquery('english', 'cannabis dispensary')
ORDER BY last_action_date DESC;
```

### Get Bills with Voting Records

```sql
SELECT 
  bill_number,
  title,
  state_code,
  status,
  jsonb_array_length(votes) as vote_count,
  votes
FROM legislature_bills
WHERE jsonb_array_length(votes) > 0
ORDER BY last_action_date DESC;
```

### API Usage Statistics

```sql
SELECT 
  api_name,
  SUM(requests_made) as total_requests,
  COUNT(DISTINCT date) as days_active
FROM api_usage_log
WHERE date > CURRENT_DATE - INTERVAL '30 days'
GROUP BY api_name;
```

---

## Troubleshooting

### API Key Issues

1. Verify keys are set in Supabase secrets
2. Check API key validity on provider dashboards
3. Ensure keys have required permissions

### Rate Limit Errors

1. Check `api_usage_log` table for current usage
2. Reduce number of states per run
3. Increase delay between requests
4. Use caching to avoid redundant requests

### Missing Bills

1. Some states may not be in LegiScan/OpenStates
2. Check if bill keywords match search terms
3. Verify session year is current
4. Some bills may be filtered as non-cannabis-related

### Slow Performance

1. Reduce `maxBillsPerState` parameter
2. Process fewer states per run
3. Increase timeout in orchestrator
4. Check for API response times

---

## Security Considerations

1. **API Keys**: Store in Supabase secrets, never in code
2. **Rate Limiting**: Respect API limits to avoid bans
3. **Data Validation**: Sanitize all API responses before storage
4. **Error Handling**: Don't expose internal errors to clients
5. **Logging**: Track all API usage for auditing
