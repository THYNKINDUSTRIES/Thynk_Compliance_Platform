# Cannabis Hemp Poller - Manual Deployment Required

## Current Status

**The `cannabis-hemp-poller` edge function does NOT exist in your Supabase project.** 

The documentation exists (in `MANUAL_DEPLOY_STATE_POLLER.md`), but the function was never actually deployed. This is causing CORS errors when the "Poll All States" button tries to call it.

## Working Alternative

The `state-regulations-poller` function IS deployed and working. It currently:
- Processes 47 states
- Has basic URL tracking for cannabis regulatory agencies
- Works without errors

The frontend has been updated to use `state-regulations-poller` instead of the non-existent `cannabis-hemp-poller`.

## To Deploy the Full Cannabis Hemp Poller

If you want the full functionality (RSS feeds, news scraping, OpenAI categorization), you need to manually deploy the function:

### Option 1: Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar
4. Click **New Function**
5. Name it: `cannabis-hemp-poller`
6. Copy the code from `MANUAL_DEPLOY_STATE_POLLER.md` (the section between the ``` code blocks)
7. Click **Deploy**

### Option 2: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref kruwbjaszdwzttblxqwr

# Create the function file
mkdir -p supabase/functions/cannabis-hemp-poller
# Copy the code from MANUAL_DEPLOY_STATE_POLLER.md to supabase/functions/cannabis-hemp-poller/index.ts

# Deploy
supabase functions deploy cannabis-hemp-poller
```

## Required Environment Variables

Make sure these secrets are set in your Supabase project:
- `OPENAI_API_KEY` - For AI-powered document categorization

To set secrets:
1. Go to Supabase Dashboard > Project Settings > Edge Functions
2. Add the `OPENAI_API_KEY` secret

## Testing After Deployment

```bash
# Test single state
curl -X POST https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/cannabis-hemp-poller \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"stateCode": "CA"}'

# Test all states
curl -X POST https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/cannabis-hemp-poller \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Features of the Full Poller

When deployed, the cannabis-hemp-poller provides:

1. **50 State Coverage** - All US states with cannabis/hemp programs
2. **RSS Feed Parsing** - Automatic parsing of state agency RSS feeds
3. **News Page Scraping** - HTML scraping of news/announcement pages
4. **AI Categorization** - OpenAI GPT-4o-mini classifies documents by:
   - Document type (regulation, proposed_rule, guidance, bulletin, etc.)
   - Urgency level (low, medium, high, critical)
   - Topics (dispensary, licensing, compliance, hemp, medical cannabis)
5. **Logging** - All runs logged to `ingestion_log` table

## Troubleshooting

### CORS Errors
If you see CORS errors, the function doesn't exist. Deploy it using the instructions above.

### No Jurisdiction Found
If logs show "No jurisdiction found for XX", add the state to the `jurisdiction` table:
```sql
INSERT INTO jurisdiction (name, code, type) VALUES ('State Name', 'XX', 'state') ON CONFLICT (code) DO NOTHING;
```

### OpenAI Not Working
Check that `OPENAI_API_KEY` is set in Edge Function secrets. The function will fall back to keyword-based classification if OpenAI is unavailable.
