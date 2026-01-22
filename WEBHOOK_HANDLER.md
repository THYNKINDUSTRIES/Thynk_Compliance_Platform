# Webhook Handler Edge Function

This edge function receives webhooks from external services (Regulations.gov, Federal Register, state agencies) for real-time regulation updates. It includes signature verification, proper CORS headers, and automatic database updates.

---

## Overview

| Feature | Description |
|---------|-------------|
| **Purpose** | Receive real-time updates from external regulatory data sources |
| **Sources** | Regulations.gov, Federal Register, State Agencies, Custom Webhooks |
| **Security** | HMAC signature verification, API key validation |
| **Database** | Automatic upsert to `instrument` table |
| **Logging** | Full audit trail in `webhook_log` table |

---

## Database Setup

First, create the required tables:

```sql
-- Webhook log table for audit trail
CREATE TABLE IF NOT EXISTS webhook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(100) NOT NULL,
  event_type VARCHAR(100),
  payload JSONB,
  signature_valid BOOLEAN DEFAULT FALSE,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Index for querying by source and date
CREATE INDEX idx_webhook_log_source ON webhook_log(source);
CREATE INDEX idx_webhook_log_created_at ON webhook_log(created_at DESC);

-- Webhook secrets table for storing verification keys
CREATE TABLE IF NOT EXISTS webhook_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(100) UNIQUE NOT NULL,
  secret_key TEXT NOT NULL,
  algorithm VARCHAR(20) DEFAULT 'sha256',
  header_name VARCHAR(100) DEFAULT 'X-Webhook-Signature',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default webhook secrets (replace with actual secrets)
INSERT INTO webhook_secrets (source, secret_key, algorithm, header_name) VALUES
  ('regulations_gov', 'your-regulations-gov-webhook-secret', 'sha256', 'X-Regulations-Signature'),
  ('federal_register', 'your-federal-register-webhook-secret', 'sha256', 'X-FR-Signature'),
  ('state_agency', 'your-state-agency-webhook-secret', 'sha256', 'X-State-Signature'),
  ('custom', 'your-custom-webhook-secret', 'sha256', 'X-Webhook-Signature')
ON CONFLICT (source) DO NOTHING;

-- Enable RLS
ALTER TABLE webhook_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_secrets ENABLE ROW LEVEL SECURITY;

-- RLS policies (service role only)
CREATE POLICY "Service role can manage webhook_log" ON webhook_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage webhook_secrets" ON webhook_secrets
  FOR ALL USING (auth.role() = 'service_role');
```

---

## Edge Function Code

Deploy this in Supabase Dashboard → Edge Functions → New Function → `webhook-handler`:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-regulations-signature, x-fr-signature, x-state-signature',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Supported webhook sources
type WebhookSource = 'regulations_gov' | 'federal_register' | 'state_agency' | 'custom';

interface WebhookPayload {
  source: WebhookSource;
  event_type: string;
  timestamp?: string;
  data: {
    document_id?: string;
    document_number?: string;
    title?: string;
    description?: string;
    abstract?: string;
    publication_date?: string;
    effective_date?: string;
    comment_end_date?: string;
    agency?: string;
    agencies?: string[];
    docket_id?: string;
    document_type?: string;
    url?: string;
    html_url?: string;
    jurisdiction?: string;
    state_code?: string;
    metadata?: Record<string, any>;
  };
}

// HMAC signature verification
async function verifySignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: string = 'sha256'
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: `SHA-${algorithm.replace('sha', '')}` },
      false,
      ['sign', 'verify']
    );

    const signatureBuffer = hexToArrayBuffer(signature.replace(/^sha256=|^sha512=/, ''));
    const dataBuffer = encoder.encode(payload);

    return await crypto.subtle.verify('HMAC', key, signatureBuffer, dataBuffer);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

// Extract signature from headers based on source
function extractSignature(headers: Headers, source: WebhookSource): string | null {
  const headerMap: Record<WebhookSource, string[]> = {
    regulations_gov: ['x-regulations-signature', 'x-webhook-signature'],
    federal_register: ['x-fr-signature', 'x-webhook-signature'],
    state_agency: ['x-state-signature', 'x-webhook-signature'],
    custom: ['x-webhook-signature', 'x-signature']
  };

  const possibleHeaders = headerMap[source] || ['x-webhook-signature'];
  
  for (const header of possibleHeaders) {
    const value = headers.get(header);
    if (value) return value;
  }
  
  return null;
}

// Transform webhook payload to instrument record
function transformToInstrument(payload: WebhookPayload, jurisdictionId: string | null): any {
  const { source, data } = payload;
  
  const externalId = data.document_id || data.document_number || 
    `${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    external_id: `webhook-${source}-${externalId}`,
    title: data.title || 'Untitled Document',
    description: data.description || data.abstract || data.title || '',
    effective_date: data.effective_date || data.publication_date || new Date().toISOString().split('T')[0],
    jurisdiction_id: jurisdictionId,
    source: `webhook_${source}`,
    source_url: data.url || data.html_url || null,
    instrument_type: mapDocumentType(data.document_type),
    status: determineStatus(data),
    metadata: {
      webhook_source: source,
      event_type: payload.event_type,
      document_number: data.document_number,
      document_type: data.document_type,
      agencies: data.agencies || (data.agency ? [data.agency] : []),
      docket_id: data.docket_id,
      comment_end_date: data.comment_end_date,
      state_code: data.state_code,
      received_at: new Date().toISOString(),
      original_metadata: data.metadata,
      lastPolled: new Date().toISOString()
    }
  };
}

function mapDocumentType(docType: string | undefined): string {
  if (!docType) return 'notice';
  
  const typeMap: Record<string, string> = {
    'Rule': 'rule',
    'Proposed Rule': 'proposed_rule',
    'Notice': 'notice',
    'Presidential Document': 'executive_order',
    'Correction': 'correction',
    'Public Notice': 'notice',
    'Guidance': 'guidance',
    'Advisory': 'advisory'
  };
  
  return typeMap[docType] || 'notice';
}

function determineStatus(data: any): string {
  if (data.document_type === 'Proposed Rule') return 'proposed';
  if (data.comment_end_date) {
    const endDate = new Date(data.comment_end_date);
    if (endDate > new Date()) return 'open_comment';
  }
  return 'final';
}

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const startTime = Date.now();
  let logId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request details
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Parse payload
    let rawPayload: string;
    let payload: WebhookPayload;
    
    try {
      rawPayload = await req.text();
      payload = JSON.parse(rawPayload);
    } catch (parseError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Validate required fields
    if (!payload.source || !payload.data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: source, data' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const source = payload.source as WebhookSource;

    // Create initial log entry
    const { data: logEntry, error: logError } = await supabase
      .from('webhook_log')
      .insert({
        source,
        event_type: payload.event_type || 'unknown',
        payload: payload,
        signature_valid: false,
        processed: false,
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select('id')
      .limit(1);

    if (!logError && logEntry?.[0]) {
      logId = logEntry[0].id;
    }

    // Get webhook secret for this source
    const { data: secretData } = await supabase
      .from('webhook_secrets')
      .select('secret_key, algorithm, header_name')
      .eq('source', source)
      .eq('active', true)
      .limit(1);

    let signatureValid = false;

    if (secretData?.[0]) {
      const { secret_key, algorithm } = secretData[0];
      const signature = extractSignature(req.headers, source);

      if (signature) {
        signatureValid = await verifySignature(rawPayload, signature, secret_key, algorithm);
        
        if (!signatureValid) {
          // Update log with signature failure
          if (logId) {
            await supabase
              .from('webhook_log')
              .update({ 
                signature_valid: false, 
                error_message: 'Invalid signature',
                processed_at: new Date().toISOString()
              })
              .eq('id', logId);
          }

          return new Response(
            JSON.stringify({ success: false, error: 'Invalid webhook signature' }),
            { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
      } else {
        // No signature provided - check if signature is required
        const requireSignature = Deno.env.get('WEBHOOK_REQUIRE_SIGNATURE') !== 'false';
        
        if (requireSignature) {
          if (logId) {
            await supabase
              .from('webhook_log')
              .update({ 
                signature_valid: false, 
                error_message: 'Missing signature header',
                processed_at: new Date().toISOString()
              })
              .eq('id', logId);
          }

          return new Response(
            JSON.stringify({ success: false, error: 'Missing webhook signature' }),
            { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
      }
    }

    // Determine jurisdiction
    let jurisdictionId: string | null = null;
    const jurisdictionCode = payload.data.state_code || payload.data.jurisdiction;

    if (jurisdictionCode) {
      const { data: jurisdiction } = await supabase
        .from('jurisdiction')
        .select('id')
        .or(`code.eq.${jurisdictionCode},name.ilike.%${jurisdictionCode}%`)
        .limit(1);

      jurisdictionId = jurisdiction?.[0]?.id || null;
    } else {
      // Default to US for federal sources
      const { data: usJurisdiction } = await supabase
        .from('jurisdiction')
        .select('id')
        .eq('code', 'US')
        .limit(1);

      jurisdictionId = usJurisdiction?.[0]?.id || null;
    }

    // Transform and upsert the instrument
    const instrumentData = transformToInstrument(payload, jurisdictionId);

    const { data: instrument, error: instrumentError } = await supabase
      .from('instrument')
      .upsert(instrumentData, { onConflict: 'external_id' })
      .select('id, title')
      .limit(1);

    if (instrumentError) {
      throw new Error(`Failed to upsert instrument: ${instrumentError.message}`);
    }

    // Update log entry with success
    if (logId) {
      await supabase
        .from('webhook_log')
        .update({
          signature_valid: signatureValid,
          processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('id', logId);
    }

    // Create notification for new regulations (optional)
    if (payload.event_type === 'new' || payload.event_type === 'created') {
      // Could trigger notifications here
      console.log(`New regulation received: ${instrumentData.title}`);
    }

    const executionTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        instrument_id: instrument?.[0]?.id,
        instrument_title: instrument?.[0]?.title,
        source,
        event_type: payload.event_type,
        signature_verified: signatureValid,
        execution_time: executionTime,
        log_id: logId
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Webhook handler error:', error);

    // Update log with error
    if (logId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from('webhook_log')
        .update({
          processed: false,
          error_message: error.message,
          processed_at: new Date().toISOString()
        })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        log_id: logId
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

---

## Test Commands

### Test OPTIONS Preflight

```bash
curl -X OPTIONS 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/webhook-handler' \
  -H 'Origin: https://your-app.com' \
  -H 'Access-Control-Request-Method: POST' \
  -v
```

### Test Regulations.gov Webhook

```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/webhook-handler' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -H 'X-Regulations-Signature: sha256=YOUR_SIGNATURE' \
  -d '{
    "source": "regulations_gov",
    "event_type": "new",
    "timestamp": "2026-01-11T17:26:00Z",
    "data": {
      "document_id": "FDA-2026-N-0001-0001",
      "title": "Hemp-Derived CBD Products; Request for Comments",
      "description": "The FDA is requesting comments on the regulation of hemp-derived CBD products.",
      "publication_date": "2026-01-11",
      "comment_end_date": "2026-03-11",
      "agency": "Food and Drug Administration",
      "docket_id": "FDA-2026-N-0001",
      "document_type": "Notice",
      "url": "https://www.regulations.gov/document/FDA-2026-N-0001-0001"
    }
  }'
```

### Test Federal Register Webhook

```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/webhook-handler' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -H 'X-FR-Signature: sha256=YOUR_SIGNATURE' \
  -d '{
    "source": "federal_register",
    "event_type": "published",
    "timestamp": "2026-01-11T17:26:00Z",
    "data": {
      "document_number": "2026-00123",
      "title": "Cannabis Rescheduling; Final Rule",
      "abstract": "The DEA is issuing a final rule to reschedule cannabis from Schedule I to Schedule III.",
      "publication_date": "2026-01-11",
      "effective_date": "2026-04-11",
      "agencies": ["Drug Enforcement Administration", "Department of Justice"],
      "document_type": "Rule",
      "html_url": "https://www.federalregister.gov/documents/2026/01/11/2026-00123/cannabis-rescheduling"
    }
  }'
```

### Test State Agency Webhook

```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/webhook-handler' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -H 'X-State-Signature: sha256=YOUR_SIGNATURE' \
  -d '{
    "source": "state_agency",
    "event_type": "updated",
    "timestamp": "2026-01-11T17:26:00Z",
    "data": {
      "document_id": "CA-DCC-2026-001",
      "title": "Emergency Cannabis Regulations Update",
      "description": "California DCC emergency regulations regarding testing requirements.",
      "effective_date": "2026-01-15",
      "agency": "Department of Cannabis Control",
      "state_code": "CA",
      "document_type": "Rule",
      "url": "https://cannabis.ca.gov/regulations/emergency-2026-001"
    }
  }'
```

### Test Without Signature (Development Mode)

Set `WEBHOOK_REQUIRE_SIGNATURE=false` in Supabase secrets for development:

```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/webhook-handler' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "source": "custom",
    "event_type": "test",
    "data": {
      "document_id": "TEST-001",
      "title": "Test Webhook Document",
      "description": "This is a test webhook payload."
    }
  }'
```

---

## Generating Webhook Signatures

### Node.js Example

```javascript
const crypto = require('crypto');

function generateSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return 'sha256=' + hmac.digest('hex');
}

const payload = {
  source: 'regulations_gov',
  event_type: 'new',
  data: {
    document_id: 'FDA-2026-N-0001',
    title: 'Test Document'
  }
};

const secret = 'your-webhook-secret';
const signature = generateSignature(payload, secret);
console.log('Signature:', signature);
```

### Python Example

```python
import hmac
import hashlib
import json

def generate_signature(payload, secret):
    payload_bytes = json.dumps(payload).encode('utf-8')
    signature = hmac.new(
        secret.encode('utf-8'),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()
    return f'sha256={signature}'

payload = {
    'source': 'regulations_gov',
    'event_type': 'new',
    'data': {
        'document_id': 'FDA-2026-N-0001',
        'title': 'Test Document'
    }
}

secret = 'your-webhook-secret'
signature = generate_signature(payload, secret)
print(f'Signature: {signature}')
```

---

## Setting Up Webhook Secrets

### In Supabase Dashboard

1. Go to **Edge Functions** → **Secrets**
2. Add the following secrets:

| Secret Name | Description |
|-------------|-------------|
| `WEBHOOK_REQUIRE_SIGNATURE` | Set to `false` for development, `true` for production |

### In Database

Update the `webhook_secrets` table with your actual secrets:

```sql
UPDATE webhook_secrets 
SET secret_key = 'your-actual-regulations-gov-secret'
WHERE source = 'regulations_gov';

UPDATE webhook_secrets 
SET secret_key = 'your-actual-federal-register-secret'
WHERE source = 'federal_register';

UPDATE webhook_secrets 
SET secret_key = 'your-actual-state-agency-secret'
WHERE source = 'state_agency';
```

---

## Configuring External Services

### Regulations.gov Webhook Setup

1. Contact Regulations.gov API support to request webhook access
2. Provide your webhook URL: `https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/webhook-handler`
3. Configure the shared secret in both systems
4. Set up filters for cannabis/hemp-related dockets

### Federal Register Webhook Setup

1. The Federal Register doesn't have native webhooks, but you can:
   - Use their email notification service and parse emails
   - Set up a polling function that checks for updates
   - Use a third-party service like Zapier to convert RSS to webhooks

### State Agency Integration

1. Contact individual state cannabis agencies about API/webhook access
2. Many states use different systems - adapt the payload format as needed
3. Consider setting up state-specific webhook endpoints if needed

---

## Monitoring Webhooks

### Query Recent Webhooks

```sql
-- View recent webhook activity
SELECT 
  id,
  source,
  event_type,
  signature_valid,
  processed,
  error_message,
  created_at,
  processed_at
FROM webhook_log
ORDER BY created_at DESC
LIMIT 50;

-- View failed webhooks
SELECT *
FROM webhook_log
WHERE processed = false OR error_message IS NOT NULL
ORDER BY created_at DESC;

-- Webhook statistics by source
SELECT 
  source,
  COUNT(*) as total,
  SUM(CASE WHEN processed THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN signature_valid THEN 1 ELSE 0 END) as valid_signatures,
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_seconds
FROM webhook_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY source;
```

---

## Integration with Scheduled Poller

Add the webhook handler to the orchestrator by updating `scheduled-poller-cron`:

```typescript
// In the POLLERS array, add webhook health check
{
  name: 'Webhook Health Check',
  functionName: 'webhook-handler',
  schedule: 'daily',
  hoursToRun: [0],
  enabled: true,
  timeout: 10000,
  // This just verifies the webhook endpoint is responsive
  healthCheckOnly: true
}
```

---

## Troubleshooting

### Signature Verification Failing

1. Ensure the payload is sent as raw JSON (not form-encoded)
2. Check that the secret matches exactly in both systems
3. Verify the signature header name matches the expected format
4. Check for whitespace or encoding issues in the payload

### Webhook Not Processing

1. Check Supabase Edge Function logs for errors
2. Verify the payload structure matches expected format
3. Ensure the `instrument` table has the required columns
4. Check RLS policies allow service role access

### Duplicate Records

1. The function uses `upsert` with `external_id` conflict resolution
2. Ensure external IDs are unique and consistent
3. Check the `external_id` format matches for updates

---

## Security Best Practices

1. **Always verify signatures in production** - Set `WEBHOOK_REQUIRE_SIGNATURE=true`
2. **Rotate secrets regularly** - Update webhook secrets every 90 days
3. **Monitor for anomalies** - Set up alerts for failed signature verifications
4. **Rate limit webhooks** - Consider adding rate limiting for each source
5. **Validate payload structure** - Reject malformed payloads early
6. **Log everything** - Keep audit trail for compliance and debugging
