# Thynk Compliance Platform - Maintenance Agent Architecture

## Active Automated Agents (pg_cron)

### 1. Polling Orchestrator (Hourly)
- **Schedule**: Every hour at :00
- **Function**: `scheduled-poller-cron`
- **Behavior**: Rotates through pollers by UTC hour:
  - Hours 0, 6, 12, 18: `federal-register-poller` + `cannabis-hemp-poller`
  - Hours 2, 8, 14, 20: `state-regulations-poller` (all 50 states)
  - Hour 3: `caselaw-poller` (CourtListener)
  - Hour 4: `kratom-poller`
  - Hour 5: `kava-poller`
  - Hour 6: `state-legislature-poller`
  - Hour 7: `congress-poller`

### 2. Site Monitor (Every 6 Hours)
- **Schedule**: Every 6 hours at :30
- **Function**: `site-monitor`
- **Behavior**: Checks site health, tests CORS from production + Vercel preview URLs, auto-heals if issues detected (`{"heal": true}`)

### 3. Health Check Cleanup (Daily)
- **Schedule**: Daily at 3 AM UTC
- **SQL**: `DELETE FROM health_checks WHERE created_at < NOW() - INTERVAL '7 days'`

## Data Quality Controls

### Poller-Level Filtering
All pollers now implement multi-layer quality gates:

1. **Title Filter** — Rejects navigation links, social media, career pages, etc. (100+ patterns)
2. **URL Path Filter** — Rejects non-regulatory URL paths (/divisions/, /services/, /careers/, etc.)
3. **Min-Length Filter** — Skips titles under 10 characters without year references
4. **Relevance Threshold** — Items scoring < 0.55 with category 'other' are skipped before DB insertion
5. **Product Keyword Gates** — Substance-specific pollers (kava, kratom) require matching keywords

### Category Assignment
Records are categorized on ingestion:
- Primary: `cannabis`, `hemp`, `nicotine`, `kratom`, `kava`, `psychedelics`
- Fallback: `other` (low-confidence items that pass the relevance threshold)

## Manual Maintenance Tasks

### Weekly: Data Quality Review
```sql
-- Check for potential junk that slipped through filters
SELECT title, source, category, (metadata->>'relevanceScore')::float as score
FROM instrument 
WHERE (metadata->>'relevanceScore')::float < 0.6 
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY score ASC LIMIT 20;

-- Check category distribution health
SELECT category, COUNT(*) FROM instrument GROUP BY category ORDER BY COUNT(*) DESC;

-- Check for stale pollers (no records in 3+ days)
SELECT source, MAX(created_at) as last_record, COUNT(*) as total
FROM instrument GROUP BY source ORDER BY last_record ASC;
```

### Monthly: Database Cleanup
```sql
-- Remove orphaned records (no jurisdiction link)
DELETE FROM instrument WHERE jurisdiction_id IS NULL AND created_at < NOW() - INTERVAL '30 days';

-- Clean duplicate external_ids (shouldn't happen with UNIQUE constraint)
-- Compact old ingestion logs
DELETE FROM ingestion_log WHERE created_at < NOW() - INTERVAL '90 days';
```

### As-Needed: Poller Health Checks
```bash
# Test a specific poller
curl -X POST "https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/kava-poller" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

# Check all function invocation logs
# Supabase Dashboard → Functions → [function name] → Invocations
```

## Deployment & Rollback

### Safe Deployment
```bash
./scripts/safe-deploy.sh deploy    # Tag + deploy all
./scripts/safe-deploy.sh functions # Deploy edge functions only
./scripts/safe-deploy.sh status    # Check deployment health
```

### Rollback
```bash
./scripts/safe-deploy.sh rollback  # Revert to previous tagged version
```

## Monitoring Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/functions/v1/site-monitor` | POST `{"heal": true}` | Health check + auto-heal |
| `/functions/v1/scheduled-poller-cron` | POST | Manual trigger all pollers |
| `/functions/v1/[poller-name]` | POST | Manual trigger specific poller |

## Key Environment Variables (Supabase Secrets)

| Variable | Required By |
|----------|-------------|
| `SUPABASE_URL` | All functions |
| `SUPABASE_SERVICE_ROLE_KEY` | All pollers (server-to-server) |
| `COURTLISTENER_API_TOKEN` | caselaw-poller |
| `OPENAI_API_KEY` | nlp-analyzer, cannabis-hemp-poller |
| `REGULATIONS_GOV_API_KEY` | regulations-gov-poller |

## Support Ticket System

Users and agents can report issues via the Support page (`/support`):
- **Categories**: Technical, Data Quality, Billing, Feature Request, Other
- **Priority**: Low, Medium, High, Urgent, Critical
- **Table**: `support_tickets` with RLS (users see own, admins see all)
- **Comments**: `ticket_comments` table for threaded responses

## Architecture Diagram

```
┌─────────────┐    ┌──────────────────┐    ┌───────────────┐
│  pg_cron     │───▶│ scheduled-poller │───▶│ federal-reg   │
│  (hourly)    │    │     -cron        │    │ cannabis-hemp │
│              │    │                  │    │ state-regs    │
│  (6-hourly)  │───▶│ site-monitor     │    │ caselaw       │
│              │    │                  │    │ kratom/kava   │
│  (daily)     │───▶│ SQL cleanup      │    │ congress/leg  │
└─────────────┘    └──────────────────┘    └───────┬───────┘
                                                    │
                                                    ▼
                                            ┌───────────────┐
                                            │  instrument    │
                                            │  (DB table)    │
                                            │  Categories:   │
                                            │  cannabis 634  │
                                            │  nicotine 484  │
                                            │  hemp     120  │
                                            │  kratom   113  │
                                            │  psyche    72  │
                                            └───────┬───────┘
                                                    │
                                                    ▼
                                            ┌───────────────┐
                                            │  React SPA     │
                                            │  thynkflow.io  │
                                            │  Vercel deploy │
                                            └───────────────┘
```
