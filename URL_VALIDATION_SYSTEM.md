# URL Validation System

## Overview
Automated weekly system to validate all regulation URLs in the database, log broken links, and notify admins.

## Database Setup

### 1. Create URL Validation Log Table

```sql
CREATE TABLE IF NOT EXISTS url_validation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id UUID REFERENCES instrument(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status_code INTEGER,
  is_valid BOOLEAN NOT NULL,
  error_message TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_url_validation_log_instrument ON url_validation_log(instrument_id);
CREATE INDEX idx_url_validation_log_checked_at ON url_validation_log(checked_at);
CREATE INDEX idx_url_validation_log_is_valid ON url_validation_log(is_valid);

-- Enable RLS
ALTER TABLE url_validation_log ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated users to read url validation logs"
  ON url_validation_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role to insert url validation logs"
  ON url_validation_log FOR INSERT
  TO service_role
  WITH CHECK (true);
```

## Edge Functions

### 2. Create validate-regulation-urls Function

**File: supabase/functions/validate-regulation-urls/index.ts**

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Fetch all instruments with URLs
    const instrumentsRes = await fetch(
      `${supabaseUrl}/rest/v1/instrument?select=id,title,source_url,jurisdiction(name)&source_url=not.is.null`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    const instruments = await instrumentsRes.json();
    console.log(`Validating ${instruments.length} regulation URLs...`);

    const results = {
      total: instruments.length,
      valid: 0,
      invalid: 0,
      brokenLinks: []
    };

    // Check each URL
    for (const instrument of instruments) {
      if (!instrument.source_url) continue;

      let isValid = false;
      let statusCode = null;
      let errorMessage = null;

      try {
        const urlCheck = await fetch(instrument.source_url, {
          method: 'HEAD',
          redirect: 'follow',
          signal: AbortSignal.timeout(10000)
        });

        statusCode = urlCheck.status;
        isValid = urlCheck.ok;

        if (!isValid) {
          errorMessage = `HTTP ${statusCode}`;
          results.brokenLinks.push({
            id: instrument.id,
            title: instrument.title,
            url: instrument.source_url,
            jurisdiction: instrument.jurisdiction?.name || 'Unknown',
            statusCode,
            error: errorMessage
          });
        } else {
          results.valid++;
        }
      } catch (error) {
        isValid = false;
        errorMessage = error.message;
        results.brokenLinks.push({
          id: instrument.id,
          title: instrument.title,
          url: instrument.source_url,
          jurisdiction: instrument.jurisdiction?.name || 'Unknown',
          error: errorMessage
        });
      }

      // Log result
      await fetch(`${supabaseUrl}/rest/v1/url_validation_log`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instrument_id: instrument.id,
          url: instrument.source_url,
          status_code: statusCode,
          is_valid: isValid,
          error_message: errorMessage
        })
      });

      if (!isValid) results.invalid++;
    }

    // Send notification if broken links found
    if (results.brokenLinks.length > 0) {
      await fetch(`${supabaseUrl}/functions/v1/send-url-validation-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ brokenLinks: results.brokenLinks })
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('URL validation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
```

### 3. Create send-url-validation-report Function

**File: supabase/functions/send-url-validation-report/index.ts**

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { brokenLinks } = await req.json();
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Group by jurisdiction
    const byJurisdiction = brokenLinks.reduce((acc, link) => {
      if (!acc[link.jurisdiction]) acc[link.jurisdiction] = [];
      acc[link.jurisdiction].push(link);
      return acc;
    }, {});

    let htmlContent = `
      <h2>🔗 Broken Regulation URLs Report</h2>
      <p><strong>Total Broken Links:</strong> ${brokenLinks.length}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <hr>
    `;

    for (const [jurisdiction, links] of Object.entries(byJurisdiction)) {
      htmlContent += `
        <h3>${jurisdiction} (${links.length} broken links)</h3>
        <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Title</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">URL</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Error</th>
            </tr>
          </thead>
          <tbody>
      `;

      for (const link of links) {
        htmlContent += `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${link.title}</td>
            <td style="padding: 8px; border: 1px solid #ddd; word-break: break-all;">
              <a href="${link.url}">${link.url}</a>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd;">${link.error}</td>
          </tr>
        `;
      }

      htmlContent += `
          </tbody>
        </table>
      `;
    }

    htmlContent += `
      <hr>
      <p style="color: #666; font-size: 12px;">
        This is an automated report from the Regulation Tracker URL validation system.
      </p>
    `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'Regulation Tracker <noreply@regulationtracker.com>',
        to: ['admin@regulationtracker.com'],
        subject: `⚠️ ${brokenLinks.length} Broken Regulation URLs Detected`,
        html: htmlContent
      })
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailsSent: 1,
      brokenLinksCount: brokenLinks.length 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error sending URL validation report:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
```

## Deployment Instructions

### Deploy Edge Functions

```bash
# Deploy validate-regulation-urls
supabase functions deploy validate-regulation-urls

# Deploy send-url-validation-report
supabase functions deploy send-url-validation-report
```

### Update Scheduled Cron Job

Add URL validation to run weekly (every Monday at 10 AM UTC):

```typescript
// In scheduled-poller-cron function, add:

const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.

// Add to results object:
results.urlValidation = { success: false, message: '', brokenLinks: 0 };

// Add after comment reminders section:
if (dayOfWeek === 1 && hour === 10) { // Monday at 10 AM UTC
  try {
    const urlValidationResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/validate-regulation-urls`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        }
      }
    );
    
    const urlData = await urlValidationResponse.json();
    results.urlValidation = {
      success: urlValidationResponse.ok,
      message: urlData.results?.message || 'Completed',
      brokenLinks: urlData.results?.invalid || 0
    };
  } catch (error) {
    results.urlValidation.message = `Error: ${error.message}`;
  }
} else {
  results.urlValidation.message = `Skipped - only runs Mondays at 10 AM UTC`;
}
```

## Testing

### Manual Test
```bash
curl -X POST https://your-project.supabase.co/functions/v1/validate-regulation-urls \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### View Logs
```bash
supabase functions logs validate-regulation-urls
supabase functions logs send-url-validation-report
```

## Monitoring

Query recent validation results:
```sql
SELECT 
  checked_at,
  COUNT(*) as total_checked,
  SUM(CASE WHEN is_valid THEN 1 ELSE 0 END) as valid_count,
  SUM(CASE WHEN NOT is_valid THEN 1 ELSE 0 END) as invalid_count
FROM url_validation_log
WHERE checked_at > NOW() - INTERVAL '30 days'
GROUP BY checked_at
ORDER BY checked_at DESC;
```

View broken links:
```sql
SELECT 
  uvl.*,
  i.title,
  j.name as jurisdiction
FROM url_validation_log uvl
JOIN instrument i ON i.id = uvl.instrument_id
JOIN jurisdiction j ON j.id = i.jurisdiction_id
WHERE uvl.is_valid = false
ORDER BY uvl.checked_at DESC
LIMIT 50;
```


## Frontend Integration

### URLValidationMonitor Component

A React component has been created at `src/components/URLValidationMonitor.tsx` that provides:

- **Manual Trigger**: Button to manually run URL validation
- **Real-time Results**: Display validation results with counts
- **Broken Links List**: View recent broken links with details
- **Auto-refresh**: Automatically loads recent logs on mount

### Add to Admin Dashboard

To add the URL validation monitor to your admin dashboard:

```typescript
import { URLValidationMonitor } from '@/components/URLValidationMonitor';

// In your admin page or settings page:
<URLValidationMonitor />
```

### Integration Example

```typescript
// src/pages/Settings.tsx or src/pages/AdminDashboard.tsx
import { URLValidationMonitor } from '@/components/URLValidationMonitor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Settings() {
  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="url-validation">URL Validation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="url-validation">
          <URLValidationMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Complete Scheduled Cron Update

Here's the complete updated `scheduled-poller-cron` function with URL validation:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const now = new Date();
    const hour = now.getUTCHours();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const results = {
      federalRegister: { success: false, message: '', recordsAdded: 0 },
      regulationsGov: { success: false, message: '', recordsAdded: 0 },
      commentReminders: { success: false, message: '', remindersSent: 0 },
      urlValidation: { success: false, message: '', brokenLinks: 0 }
    };

    // Trigger Federal Register Poller
    try {
      const frResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/federal-register-poller`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          }
        }
      );
      
      const frData = await frResponse.json();
      results.federalRegister = {
        success: frResponse.ok,
        message: frData.message || 'Completed',
        recordsAdded: frData.recordsAdded || 0
      };
    } catch (error) {
      results.federalRegister.message = `Error: ${error.message}`;
    }

    // Trigger Regulations.gov Poller
    try {
      const rgResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/regulations-gov-poller`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          }
        }
      );
      
      const rgData = await rgResponse.json();
      results.regulationsGov = {
        success: rgResponse.ok,
        message: rgData.message || 'Completed',
        recordsAdded: rgData.recordsAdded || 0
      };
    } catch (error) {
      results.regulationsGov.message = `Error: ${error.message}`;
    }

    // Process comment deadline reminders daily at 9 AM UTC
    if (hour === 9) {
      try {
        const reminderResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-comment-deadline-reminders`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            }
          }
        );
        
        const reminderData = await reminderResponse.json();
        results.commentReminders = {
          success: reminderResponse.ok,
          message: reminderData.message || 'Completed',
          remindersSent: reminderData.remindersSent || 0
        };
      } catch (error) {
        results.commentReminders.message = `Error: ${error.message}`;
      }
    } else {
      results.commentReminders.message = `Skipped - only runs at 9 AM UTC (current hour: ${hour})`;
    }

    // Validate URLs weekly on Mondays at 10 AM UTC
    if (dayOfWeek === 1 && hour === 10) {
      try {
        const urlValidationResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/validate-regulation-urls`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            }
          }
        );
        
        const urlData = await urlValidationResponse.json();
        results.urlValidation = {
          success: urlValidationResponse.ok,
          message: urlData.results?.message || 'Completed',
          brokenLinks: urlData.results?.invalid || 0
        };
      } catch (error) {
        results.urlValidation.message = `Error: ${error.message}`;
      }
    } else {
      results.urlValidation.message = `Skipped - only runs Mondays at 10 AM UTC (current: ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]} ${hour}:00)`;
    }

    const duration = Date.now() - startTime;

    return new Response(JSON.stringify({
      success: true,
      executionTime: duration,
      currentHour: hour,
      currentDay: dayOfWeek,
      results
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
```

## Admin Email Configuration

Update the admin email in `send-url-validation-report` function:

```typescript
// Change this line to your actual admin email:
to: ['admin@regulationtracker.com'],
// Or use multiple emails:
to: ['admin1@example.com', 'admin2@example.com'],
```

## Schedule Summary

| Task | Frequency | Time (UTC) | Day |
|------|-----------|------------|-----|
| Federal Register Polling | Hourly | Every hour | All |
| Regulations.gov Polling | Hourly | Every hour | All |
| Comment Deadline Reminders | Daily | 9:00 AM | All |
| URL Validation | Weekly | 10:00 AM | Monday |

## Troubleshooting

### URLs Not Being Validated

1. Check if the `url_validation_log` table exists
2. Verify edge functions are deployed
3. Check function logs for errors
4. Ensure RESEND_API_KEY is configured

### No Email Notifications

1. Verify RESEND_API_KEY environment variable
2. Check admin email address in function
3. Review send-url-validation-report logs
4. Verify Resend domain is verified

### False Positives

Some URLs may fail validation due to:
- Rate limiting from government sites
- Temporary server issues
- Redirect chains
- SSL certificate issues

Consider implementing retry logic or whitelisting known-good domains.
