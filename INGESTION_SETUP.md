# Real-Time Data Ingestion System

## Overview
The Integrated Regulatory Platform (IRP) uses Supabase Edge Functions to poll government APIs every 15 minutes and ingest regulatory documents automatically.

## Architecture

### Database Schema
- **jurisdiction**: States and federal government
- **authority**: Regulatory agencies (DEA, FDA, DCC, etc.)
- **source**: Data sources (APIs, RSS feeds)
- **instrument**: Regulatory documents (rules, notices, orders)
- **tag**: Product and requirement tags
- **ingestion_log**: Tracks polling runs and freshness

### Edge Functions

#### 1. federal-register-poller
Polls Federal Register API for hemp, cannabis, kratom, nicotine, and psychedelic regulations.
- **Endpoint**: `/functions/v1/federal-register-poller`
- **Schedule**: Every 15 minutes (set up via cron)
- **API**: https://www.federalregister.gov/api/v1/documents.json
- **NLP**: Automatically analyzes first 5 new documents with OpenAI

#### 2. regulations-gov-poller
Polls Regulations.gov API for dockets and documents.
- **Endpoint**: `/functions/v1/regulations-gov-poller`
- **Schedule**: Every 15 minutes
- **API**: https://api.regulations.gov/v4/documents
- **Requires**: REGULATIONS_GOV_API_KEY environment variable

#### 3. rss-feed-poller
Generic RSS/Atom feed parser for state agency news feeds.
- **Endpoint**: `/functions/v1/rss-feed-poller`
- **Schedule**: Every 15 minutes per source
- **Supports**: RSS 2.0, Atom feeds
- **Managed via**: Source Management UI at `/admin/sources`

#### 4. webhook-receiver
Receives instant updates from government APIs that support webhooks.
- **Endpoint**: `/functions/v1/webhook-receiver`
- **Method**: POST
- **Payload**: `{ source: string, data: object }`

#### 5. nlp-analyzer
Uses OpenAI GPT-4o-mini to extract structured information from regulatory documents.
- **Endpoint**: `/functions/v1/nlp-analyzer`
- **Method**: POST
- **Extracts**: Products, regulatory stage, dates, jurisdiction, requirements, penalties
- **Confidence Scores**: Each extracted entity includes 0-1 confidence score
- **Storage**: Entities stored in `extracted_entity` table
- **Requires**: OPENAI_API_KEY environment variable



## Setup Instructions

### 1. Source Management UI
Access the Source Management interface at `/admin/sources` to:
- View all RSS feeds and data sources
- Add new state agency RSS feeds
- Test feed parsing in real-time
- Monitor feed health status
- Configure polling intervals
- View last polled timestamps

### 2. Manual Polling (Testing)
You can manually trigger polling by calling the edge functions:

```bash
# IMPORTANT: Use service_role key for write operations, NOT anon key
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/federal-register-poller \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

Test an RSS feed:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/rss-feed-poller \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sourceId": "SOURCE_UUID", "feedUrl": "https://example.gov/feed.xml"}'
```

### 3. Automated Polling (Production)
Set up scheduled polling using one of these methods:


#### Option A: GitHub Actions (Recommended)
Create `.github/workflows/poll-regulations.yml`:

```yaml
name: Poll Regulatory APIs
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:

jobs:
  poll:
    runs-on: ubuntu-latest
    steps:
      - name: Poll Federal Register
        run: |
          # CRITICAL: Use service_role key for write operations
          curl -X POST ${{ secrets.SUPABASE_URL }}/functions/v1/federal-register-poller \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
      
      - name: Poll Regulations.gov
        run: |
          # CRITICAL: Use service_role key for write operations
          curl -X POST ${{ secrets.SUPABASE_URL }}/functions/v1/regulations-gov-poller \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
```

**⚠️ IMPORTANT**: Always use `SUPABASE_SERVICE_ROLE_KEY` for polling operations that write to the database. The anon key respects RLS and will cause silent write failures.

#### Option B: Cron Job Service
Use services like cron-job.org or EasyCron to hit your edge function URLs every 15 minutes.
**Note**: Configure the service to use the service_role key in the Authorization header.

#### Option C: Supabase pg_cron
Enable pg_cron extension and schedule function calls directly in Postgres.



### 4. Webhook Configuration

For instant updates, register your webhook URL with supported APIs:
- **Webhook URL**: `https://YOUR_PROJECT.supabase.co/functions/v1/webhook-receiver`
- **Method**: POST
- **Content-Type**: application/json

## Data Flow

1. **Polling**: Edge function fetches data from government API
2. **Normalization**: Converts API response to standard format
3. **Deduplication**: Checks hash to avoid duplicates
4. **Storage**: Inserts/updates instrument records
5. **NLP Analysis**: OpenAI extracts structured entities (products, dates, requirements, penalties)
6. **Entity Storage**: Extracted entities saved with confidence scores
7. **Tagging**: Automatically tags with products/requirements
8. **Logging**: Records ingestion metrics in ingestion_log
9. **Real-time**: Frontend subscribes to changes via Supabase Realtime

## NLP Analysis

### Automatic Analysis
New documents are automatically analyzed by OpenAI GPT-4o-mini to extract:
- **Products**: Cannabis, hemp, kratom, nicotine, psilocybin, etc.
- **Regulatory Stage**: Proposed, final, interim, emergency
- **Key Dates**: Effective dates, comment deadlines, compliance dates, hearing dates
- **Jurisdiction**: Federal, state, or local scope
- **Compliance Requirements**: Licensing, testing, packaging, labeling, reporting
- **Penalties**: Fines, suspensions, revocations, warnings

### Manual Analysis
Click the "Analyze with AI" button in any regulation modal to trigger analysis on-demand.

### Confidence Scores
Each extracted entity includes a confidence score (0-1) indicating the AI's certainty:
- **0.9-1.0**: High confidence
- **0.7-0.9**: Medium confidence
- **0.0-0.7**: Low confidence (review recommended)

### Viewing Extracted Entities
Regulations with AI analysis show a purple sparkle icon (✨) and display extracted entities grouped by type with confidence scores.



## Monitoring

### Check Last Updated Times
Query the `jurisdiction_freshness` view:
```sql
SELECT * FROM jurisdiction_freshness ORDER BY last_updated DESC;
```

### View Ingestion Logs
```sql
SELECT * FROM ingestion_log 
ORDER BY started_at DESC 
LIMIT 20;
```

### Check Source Health
```sql
SELECT name, last_polled_at, last_success_at, health_status 
FROM source;
```

### Check NLP Analysis Status
```sql
SELECT 
  COUNT(*) as total_instruments,
  COUNT(*) FILTER (WHERE nlp_analyzed = true) as analyzed,
  COUNT(*) FILTER (WHERE nlp_analyzed = false) as pending
FROM instrument;
```

### View Extracted Entities
```sql
SELECT 
  i.title,
  e.entity_type,
  e.entity_value,
  e.confidence_score
FROM instrument i
JOIN extracted_entity e ON i.id = e.instrument_id
WHERE i.id = 'INSTRUMENT_UUID'
ORDER BY e.entity_type, e.confidence_score DESC;
```

## API Keys Required

The following environment variables must be set in Supabase:
- `FEDERAL_REGISTER_API_KEY` (optional, public API)
- `REGULATIONS_GOV_API_KEY` (required)
- `GOVINFO_API_KEY` (optional)
- `OPENAI_API_KEY` (required for NLP analysis)


## Troubleshooting

### No data appearing
1. Check edge function logs in Supabase dashboard
2. Verify API keys are set correctly
3. Test edge functions manually via curl
4. Check ingestion_log for errors

### Stale data
1. Verify polling schedule is running
2. Check source.last_polled_at timestamps
3. Review ingestion_log for failed runs

### Rate limiting

- Federal Register: No rate limit
- Regulations.gov: 1000 requests/hour
- Adjust polling frequency if hitting limits

### RSS feed issues
1. Test feed URL manually in browser
2. Check if feed is valid RSS/Atom format
3. Use Source Management UI to test feed parsing
4. Review edge function logs for parsing errors
5. Verify feed URL is accessible (not behind auth)

### NLP analysis issues
1. Verify OPENAI_API_KEY is set in Supabase environment
2. Check edge function logs for OpenAI API errors
3. Ensure documents have sufficient text content (title + summary)
4. Review confidence scores - low scores may indicate unclear text
5. OpenAI rate limits: 10,000 requests/day on free tier
6. Manual analysis available via "Analyze with AI" button in regulation modal


## State Agency RSS Feeds

The platform includes RSS feed sources for major cannabis regulatory states:
- California DCC
- Washington LCB
- Oregon OLCC
- Colorado MED
- Nevada CCB
- Massachusetts CCC
- Michigan CRA
- Illinois IDFPR
- Arizona DHS
- New Jersey CRC
- New York OCM
- Florida OMMU
- Maryland MCA
- Pennsylvania MMP
- Texas CUP

Additional state feeds can be added via the Source Management UI at `/admin/sources`.
