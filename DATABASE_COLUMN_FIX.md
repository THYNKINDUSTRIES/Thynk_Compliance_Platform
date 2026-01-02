# Database Column Fix Documentation

## Issues Fixed

### 1. `ingestion_log.created_at` Column Error
**Error:** `column ingestion_log.created_at does not exist` (PostgreSQL error code 42703)

**Root Cause:** The `ingestion_log` table uses `started_at` as the timestamp column, but the frontend code was querying `created_at`.

**Fix Applied:** Updated `src/components/StateRegulationsPoller.tsx` to:
- Try `started_at` first (the documented column name)
- Fall back to `timestamp` if that fails
- Fall back to querying without ordering if both fail
- Gracefully handle missing tables (error codes 42P01, PGRST116)

### 2. `providers` Table 404 Error
**Error:** HEAD request to `/rest/v1/providers` returns 404

**Root Cause:** The `providers` table may not exist in the database.

**Fix Applied:** Updated provider queries to:
- Check if table exists before querying
- Gracefully handle 404 and missing table errors
- Return empty arrays instead of throwing errors

## Component Relationship: StateRegulationsPoller.tsx and cannabis-hemp-poller

### Understanding the Naming

- **StateRegulationsPoller.tsx** - The React frontend component that displays state regulation polling status
- **cannabis-hemp-poller** - The Supabase Edge Function that polls cannabis/hemp regulatory agencies
- **state-regulations-poller** - A fallback Supabase Edge Function

### How They Work Together

1. **StateRegulationsPoller.tsx** is the UI component that:
   - Displays status for 47+ state cannabis agencies
   - Shows polling history from `ingestion_log` table
   - Triggers polling by calling edge functions
   - Filters logs by source IDs including `cannabis-hemp-poller`

2. **Edge Function Calls:**
   ```typescript
   // Primary call - always attempted
   supabase.functions.invoke('state-regulations-poller', { body: { stateCode, fullScan } })
   
   // Secondary call - may fail if not deployed
   supabase.functions.invoke('cannabis-hemp-poller', { body: { stateCode, fullScan } })
   ```

3. **Log Filtering:**
   The component filters `ingestion_log` entries by these source IDs:
   - `cannabis-hemp-poller`
   - `cannabis_hemp_poller`
   - `state-regulations-poller`
   - `state_regulations_poller`
   - `state_regulations`
   - `enhanced-state-poller`
   - `state-news-scraper`

### Deployment Status

Per `CANNABIS_HEMP_POLLER_DEPLOYMENT.md`:
- `state-regulations-poller` - **Deployed and working**
- `cannabis-hemp-poller` - **May need deployment** (see deployment docs)

The frontend gracefully handles if `cannabis-hemp-poller` is not deployed - it will log a warning but continue working with `state-regulations-poller`.

## Files Modified

1. **src/components/StateRegulationsPoller.tsx**
   - Fixed `fetchPollingLogs()` function to use correct column name
   - Added fallback handling for different column names
   - Added graceful error handling for missing tables
   - Updated interfaces to properly document column mappings
   - Added constants for edge function names and source IDs

2. **src/components/AppLayout.tsx**
   - Enhanced providers query with table existence check
   - Added silent error handling for missing providers table

3. **src/components/ProviderCard.tsx**
   - Improved error detection in `useProviders` hook
   - Added handling for 404, 42P01, and PGRST116 error codes

## Verification Steps

### Test the Fix
1. Navigate to the app and click on "Cannabis" category
2. The error should no longer appear in the console
3. The State Regulations Poller should load without errors

### Check Database Schema
```sql
-- Check ingestion_log columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ingestion_log';

-- Check if providers table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'providers'
);
```

### Test Polling
```bash
# Test state-regulations-poller (should work)
curl -L -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/state-regulations-poller' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"stateCode": "CA"}'

# Test cannabis-hemp-poller (may need deployment)
curl -L -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/cannabis-hemp-poller' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"stateCode": "CA"}'
```
## Creating Missing Tables and Columns (Manual SQL Required)

**Note:** The Supabase SQL API is returning authorization errors. Please run these SQL commands manually in the Supabase SQL Editor at:
https://supabase.com/dashboard/project/kruwbjaszdwzttblxqwr/sql

### Add `created_at` Column to `ingestion_log` Table

Run this SQL to add the `created_at` column so both `started_at` and `created_at` work:

```sql
-- Add created_at column to ingestion_log (if it doesn't exist)
ALTER TABLE ingestion_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Optionally sync created_at with started_at for existing rows
UPDATE ingestion_log SET created_at = started_at WHERE created_at IS NULL AND started_at IS NOT NULL;

-- Add index for faster queries on created_at
CREATE INDEX IF NOT EXISTS idx_ingestion_log_created_at ON ingestion_log(created_at DESC);
```

### Create `ingestion_log` Table (If Missing)
```sql
CREATE TABLE IF NOT EXISTS ingestion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  records_fetched INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ingestion_log_started_at ON ingestion_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_log_created_at ON ingestion_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_log_source_id ON ingestion_log(source_id);
```

### Create `providers` Table (If Missing)
```sql
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  tier TEXT DEFAULT 'Standard',
  category TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON providers
  FOR SELECT USING (true);

-- Add some sample providers (optional)
INSERT INTO providers (name, description, website, tier, category) VALUES
  ('Metrc', 'State-mandated seed-to-sale tracking system', 'https://metrc.com', 'Enterprise', 'Compliance'),
  ('Dutchie', 'Cannabis e-commerce and POS platform', 'https://dutchie.com', 'Premium', 'Technology'),
  ('Leafly', 'Cannabis information and marketplace', 'https://leafly.com', 'Premium', 'Marketing'),
  ('Weedmaps', 'Cannabis discovery and ordering platform', 'https://weedmaps.com', 'Premium', 'Marketing'),
  ('Flowhub', 'Cannabis retail management software', 'https://flowhub.com', 'Standard', 'Technology'),
  ('Treez', 'Cannabis retail and supply chain platform', 'https://treez.io', 'Standard', 'Technology'),
  ('Simplifya', 'Cannabis compliance software', 'https://simplifya.com', 'Standard', 'Compliance'),
  ('Green Bits', 'Cannabis POS and compliance', 'https://greenbits.com', 'Standard', 'Technology')
ON CONFLICT DO NOTHING;
```

## Verification After Running SQL

After running the SQL commands, verify the changes:

```sql
-- Check ingestion_log columns (should now include created_at)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ingestion_log'
ORDER BY ordinal_position;

-- Check if providers table exists and has data
SELECT COUNT(*) as provider_count FROM providers;

-- Test querying with created_at
SELECT id, source_id, status, created_at, started_at 
FROM ingestion_log 
ORDER BY created_at DESC 
LIMIT 5;
```
