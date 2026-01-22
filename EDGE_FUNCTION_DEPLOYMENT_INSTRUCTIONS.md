# Edge Function Deployment Instructions

## Step 1: Add API Secrets to Supabase

Go to your Supabase Dashboard → Edge Functions → Secrets and add the following:

| Secret Name | Value |
|-------------|-------|
| `LEGISCAN_API_KEY` | `db9e2013fe8fc89561fd857e9b9f055d` |
| `OPENSTATES_API_KEY` | `db79f2e7-d16e-4b9b-bb71-bb496dc308ed` |

### How to Add Secrets:

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar
4. Click on **Secrets** tab
5. Click **Add new secret**
6. Enter the secret name (e.g., `LEGISCAN_API_KEY`)
7. Enter the secret value
8. Click **Save**
9. Repeat for `OPENSTATES_API_KEY`

---

## Step 2: Run Database Migrations

Execute the following SQL in your Supabase SQL Editor:

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
  chamber VARCHAR(50),
  bill_type VARCHAR(50),
  sponsors JSONB DEFAULT '[]',
  cosponsors JSONB DEFAULT '[]',
  subjects JSONB DEFAULT '[]',
  votes JSONB DEFAULT '[]',
  history JSONB DEFAULT '[]',
  amendments JSONB DEFAULT '[]',
  source VARCHAR(50),
  source_url TEXT,
  full_text_url TEXT,
  is_cannabis_related BOOLEAN DEFAULT TRUE,
  cannabis_keywords TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_legislature_bills_state ON legislature_bills(state_code);
CREATE INDEX IF NOT EXISTS idx_legislature_bills_status ON legislature_bills(status);
CREATE INDEX IF NOT EXISTS idx_legislature_bills_session ON legislature_bills(session_year);
CREATE INDEX IF NOT EXISTS idx_legislature_bills_updated ON legislature_bills(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_legislature_bills_cannabis ON legislature_bills(is_cannabis_related) WHERE is_cannabis_related = TRUE;

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_legislature_bills_search ON legislature_bills 
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- Enable RLS
ALTER TABLE legislature_bills ENABLE ROW LEVEL SECURITY;

-- RLS policy for public read access
DROP POLICY IF EXISTS "Public can read legislature bills" ON legislature_bills;
CREATE POLICY "Public can read legislature bills" ON legislature_bills
  FOR SELECT USING (true);

-- RLS policy for service role write access
DROP POLICY IF EXISTS "Service role can manage legislature bills" ON legislature_bills;
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
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_usage_daily ON api_usage_log(api_name, date);

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

## Step 3: Deploy Edge Functions

### Option A: Deploy via Supabase Dashboard (Recommended)

1. Go to **Edge Functions** in your Supabase Dashboard
2. Click **New Function**
3. Name it `state-legislature-poller`
4. Copy the code from `STATE_LEGISLATURE_POLLER.md` (the Edge Function Code section)
5. Click **Deploy**

### Option B: Deploy via CLI

If you have the Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref kruwbjaszdwzttblxqwr

# Deploy the function
supabase functions deploy state-legislature-poller
```

---

## Step 4: Test the Edge Function

### Test OPTIONS Preflight (CORS)

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

---

## Step 5: Verify Data in Database

After running the poller, check if bills were inserted:

```sql
-- Check recent bills
SELECT 
  bill_number,
  title,
  state_code,
  status,
  last_action_date,
  cannabis_keywords
FROM legislature_bills
ORDER BY updated_at DESC
LIMIT 20;

-- Check API usage
SELECT * FROM api_usage_log ORDER BY created_at DESC LIMIT 10;
```

---

## API Rate Limits

| API | Limit | Safe Daily Usage |
|-----|-------|------------------|
| LegiScan | 30,000/month | ~1,000/day |
| OpenStates | 500/day | ~450/day |

The edge function automatically tracks API usage and will stop if limits are approached.

---

## Troubleshooting

### "API rate limits reached" Error
- Check `api_usage_log` table for current usage
- Wait until the next day for limits to reset
- Reduce the number of states per request

### No Bills Returned
- Verify API keys are correctly set in secrets
- Check if the state has active cannabis legislation
- Try different keywords

### CORS Errors
- Ensure the function handles OPTIONS requests
- Check that `corsHeaders` are included in all responses

---

## Frontend Integration

The Legislature Bills page is now available at `/legislature-bills`. It:

1. Fetches bills from the `legislature_bills` table
2. Provides filters for state, status, chamber, and session year
3. Shows bill details including sponsors, votes, and history
4. Allows triggering a refresh to poll for new bills
5. Supports exporting bills to CSV

Navigate to the page via the "Bills" link in the header navigation.
