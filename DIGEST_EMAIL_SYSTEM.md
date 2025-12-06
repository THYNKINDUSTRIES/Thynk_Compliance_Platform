# Automated Email Digest System

## Overview
This system sends daily/weekly email summaries of new regulations to users based on their alert preferences.

## Database Setup

### 1. Create Digest Log Table
```sql
CREATE TABLE IF NOT EXISTS digest_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES alert_profiles(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly')),
  regulations_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_digest_log_profile ON digest_log(profile_id);
CREATE INDEX idx_digest_log_sent_at ON digest_log(sent_at DESC);
```

## Edge Function: send-digest-emails

Create in Supabase Dashboard: Database > Edge Functions

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const { frequency } = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    const { data: profiles } = await supabase
      .from('alert_profiles')
      .select('*, users(*)')
      .eq('frequency', frequency)
      .eq('is_active', true)

    const results = { sent: 0, failed: 0 }
    const cutoffDate = frequency === 'daily' 
      ? new Date(Date.now() - 24 * 60 * 60 * 1000)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    for (const profile of profiles || []) {
      try {
        let query = supabase.from('instruments').select('*')
          .gte('created_at', cutoffDate.toISOString())
          .order('created_at', { ascending: false })

        if (profile.keywords?.length > 0) {
          const keywordFilter = profile.keywords.map((kw: string) => 
            `title.ilike.%${kw}%,summary.ilike.%${kw}%`).join(',')
          query = query.or(keywordFilter)
        }

        const { data: regulations } = await query.limit(20)
        if (!regulations?.length) continue

        const emailHtml = generateEmailHTML(profile.users.name, regulations, frequency)

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Thynk.guru <noreply@thynk.guru>',
            to: profile.users.email,
            subject: `Thynk.guru Digest - ${regulations.length} New Regulations`,
            html: emailHtml
          })
        })

        await supabase.from('digest_log').insert({
          profile_id: profile.id,
          frequency,
          regulations_count: regulations.length,
          status: 'sent'
        })

        results.sent++
      } catch (err) {
        results.failed++
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})

function generateEmailHTML(name: string, regs: any[], freq: string): string {
  return `<!DOCTYPE html><html><body style="font-family:Arial;background:#FAF8F5;padding:20px;"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;"><div style="background:#794108;padding:30px;text-align:center;"><h1 style="color:#fff;margin:0;">Thynk.guru</h1><p style="color:#F5DFC6;margin:10px 0 0;">${freq === 'daily' ? 'Daily' : 'Weekly'} Digest</p></div><div style="padding:30px;"><p>Hi ${name},</p><p>Here are ${regs.length} new regulations:</p>${regs.map(r => `<div style="border-left:4px solid #794108;padding:15px;margin:20px 0;background:#F9FAFB;"><h3 style="margin:0 0 10px;"><a href="https://thynk.guru/regulation/${r.id}" style="color:#794108;text-decoration:none;">${r.title}</a></h3><p style="margin:0;font-size:12px;color:#666;"><strong>${r.jurisdiction}</strong> • ${r.effective_date || 'TBD'}</p><p style="margin:10px 0 0;">${(r.summary || '').substring(0, 200)}...</p></div>`).join('')}</div></div></body></html>`
}
```

## Cron Scheduling

```sql
-- Daily digest at 8 AM
SELECT cron.schedule(
  'send-daily-digest',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/send-digest-emails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"frequency": "daily"}'::jsonb
  );
  $$
);

-- Weekly digest on Monday at 8 AM
SELECT cron.schedule(
  'send-weekly-digest',
  '0 8 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/send-digest-emails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"frequency": "weekly"}'::jsonb
  );
  $$
);
```

## Environment Variables
Set in Supabase Dashboard > Project Settings > Edge Functions:
- `RESEND_API_KEY`: Your Resend API key for sending emails

## Testing
Use the DigestTestButton component in the UI to manually trigger digest sends.
