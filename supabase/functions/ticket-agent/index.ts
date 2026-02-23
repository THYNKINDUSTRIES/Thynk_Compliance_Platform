/**
 * ticket-agent — AI-powered support ticket triage & auto-resolution
 *
 * Triggered by:
 *   1. Database trigger on support_tickets INSERT (via pg_net)
 *   2. Direct invocation from frontend after ticket creation
 *
 * What it does:
 *   - Classifies ticket with AI (GPT-4o-mini)
 *   - Matches against known FAQ / common issues for auto-resolution
 *   - Posts an AI-generated initial response as a ticket comment
 *   - Sends confirmation email to the user (Resend)
 *   - Sends admin notification for high-priority or unresolvable tickets
 *   - Updates ticket metadata with AI triage data
 */

// @ts-ignore - Deno import for Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { buildCors, corsHeaders as _defaultCors } from '../_shared/cors.ts';

export let corsHeaders = _defaultCors;

// @ts-ignore - Deno global
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const ADMIN_EMAIL = 'support@thynk.guru';
const FROM_EMAIL = 'Thynk Support <support@thynkflow.io>';

// ─── Known issues / FAQ knowledge base ───────────────────────────────────────
const KNOWLEDGE_BASE = [
  {
    patterns: ['export', 'download', 'csv', 'pdf', 'excel', 'report'],
    category: 'technical',
    answer:
      'To export data, navigate to the Analytics page and click the "Export" button in the top-right corner. You can choose from PDF, CSV, or Excel formats. If the export button is not visible, try refreshing the page or clearing your browser cache.',
    canAutoResolve: true,
  },
  {
    patterns: ['login', 'sign in', 'password', 'reset', 'can\'t access', 'locked out', 'authentication'],
    category: 'technical',
    answer:
      'If you\'re having trouble signing in, click "Forgot Password" on the login page to reset your credentials. If using a magic link, check your spam folder. If the issue persists, clear your browser cookies for thynkflow.io and try again.',
    canAutoResolve: true,
  },
  {
    patterns: ['alert', 'notification', 'email alert', 'not receiving', 'no alerts'],
    category: 'technical',
    answer:
      'To set up alerts, click the bell icon on any regulation card. For email notifications, ensure your email is verified in Settings > Profile. Check your spam folder for emails from alerts@regwatch.app. You can manage alert preferences in Settings > Notifications.',
    canAutoResolve: true,
  },
  {
    patterns: ['data', 'outdated', 'wrong', 'incorrect', 'missing regulation', 'stale', 'not updated'],
    category: 'data_quality',
    answer:
      'Our system polls federal and state sources every 4 hours. If you believe specific data is incorrect or missing, our data team will investigate. Please include the specific regulation name or state so we can prioritize the review.',
    canAutoResolve: false,
  },
  {
    patterns: ['billing', 'charge', 'subscription', 'cancel', 'refund', 'invoice', 'payment', 'plan'],
    category: 'billing',
    answer:
      'For billing inquiries, go to Settings > Subscription to view your current plan and payment history. To change or cancel your subscription, use the "Manage Plan" button. Refund requests are processed within 5-7 business days.',
    canAutoResolve: false,
  },
  {
    patterns: ['compare', 'comparison', 'multiple states', 'side by side', 'state comparison'],
    category: 'technical',
    answer:
      'Use the State Comparison tool from the Dashboard. Select up to 4 states to compare side-by-side. You can filter by product category, supply chain stage, and regulation type. Results can be exported as PDF or CSV.',
    canAutoResolve: true,
  },
  {
    patterns: ['api', 'endpoint', 'rate limit', 'api key', 'integration', 'webhook'],
    category: 'technical',
    answer:
      'API documentation is available in the API Monitoring section. Your API key can be found in Settings > API Access. Rate limits depend on your subscription tier. If you\'re hitting rate limits, consider caching responses or upgrading your plan.',
    canAutoResolve: true,
  },
  {
    patterns: ['team', 'invite', 'member', 'organization', 'add user', 'role'],
    category: 'technical',
    answer:
      'To manage team members, go to Settings > Team Management. Enter the email addresses of team members to invite. They\'ll receive an invitation with the role you specify. Available roles: Viewer, Editor, and Admin.',
    canAutoResolve: true,
  },
  {
    patterns: ['workflow', 'checklist', 'task', 'assign', 'compliance workflow'],
    category: 'technical',
    answer:
      'Compliance workflows can be created from any regulation detail page using the "Create Workflow" button. The system auto-generates tasks from AI-extracted requirements. Manage workflows from the Workflows page in the navigation menu.',
    canAutoResolve: true,
  },
  {
    patterns: ['slow', 'performance', 'loading', 'lag', 'timeout', 'hang'],
    category: 'technical',
    answer:
      'If the platform feels slow, try: 1) Clear browser cache and cookies, 2) Disable browser extensions, 3) Switch to Chrome or Firefox, 4) Check your internet connection. If the issue persists after these steps, our team will investigate server-side performance.',
    canAutoResolve: true,
  },
];

// ─── AI Classification ──────────────────────────────────────────────────────
interface TriageResult {
  suggestedPriority: string;
  suggestedCategory: string;
  sentiment: string;
  summary: string;
  autoResponse: string;
  canAutoResolve: boolean;
  confidence: number;
  tags: string[];
}

async function triageWithAI(
  subject: string,
  description: string,
  category: string,
  priority: string
): Promise<TriageResult> {
  // @ts-ignore - Deno global
  const openaiKey = Deno.env.get('OPENAI_API_KEY');

  // First: check knowledge base for quick matches
  const text = `${subject} ${description}`.toLowerCase();
  const kbMatch = KNOWLEDGE_BASE.find((kb) =>
    kb.patterns.some((p) => text.includes(p))
  );

  if (!openaiKey) {
    // Fallback without AI
    return {
      suggestedPriority: priority,
      suggestedCategory: kbMatch?.category || category,
      sentiment: 'neutral',
      summary: subject,
      autoResponse: kbMatch?.answer || getGenericResponse(category),
      canAutoResolve: kbMatch?.canAutoResolve ?? false,
      confidence: kbMatch ? 0.7 : 0.3,
      tags: [],
    };
  }

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI support agent for Thynk Compliance Platform — a regulatory intelligence tool for cannabis, hemp, kratom, kava, nicotine, and psychedelics industries.

Analyze this support ticket and return a JSON object with:
- suggestedPriority: "low" | "medium" | "high" | "urgent" | "critical"
- suggestedCategory: "technical" | "billing" | "feature_request" | "data_quality" | "other"
- sentiment: "positive" | "neutral" | "frustrated" | "angry" | "confused"
- summary: 1-sentence summary of the issue
- autoResponse: A helpful, empathetic response addressing the user's issue. Include specific steps they can take. If you can fully resolve it, do so. If not, acknowledge the issue and explain next steps.
- canAutoResolve: true if the response fully addresses the issue without needing human intervention
- confidence: 0-1 confidence score in your triage
- tags: array of relevant tags (max 5)

Be professional, empathetic, and solution-oriented. Reference specific platform features when relevant.
Return ONLY valid JSON.`,
          },
          {
            role: 'user',
            content: `Subject: ${subject}\nCategory: ${category}\nPriority: ${priority}\n\nDescription:\n${description}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        suggestedPriority: parsed.suggestedPriority || priority,
        suggestedCategory: parsed.suggestedCategory || category,
        sentiment: parsed.sentiment || 'neutral',
        summary: parsed.summary || subject,
        autoResponse: parsed.autoResponse || kbMatch?.answer || getGenericResponse(category),
        canAutoResolve: parsed.canAutoResolve ?? kbMatch?.canAutoResolve ?? false,
        confidence: parsed.confidence ?? 0.5,
        tags: parsed.tags || [],
      };
    }
  } catch (e) {
    console.error('AI triage error:', e);
  }

  // Fallback
  return {
    suggestedPriority: priority,
    suggestedCategory: kbMatch?.category || category,
    sentiment: 'neutral',
    summary: subject,
    autoResponse: kbMatch?.answer || getGenericResponse(category),
    canAutoResolve: kbMatch?.canAutoResolve ?? false,
    confidence: kbMatch ? 0.7 : 0.3,
    tags: [],
  };
}

function getGenericResponse(category: string): string {
  switch (category) {
    case 'billing':
      return 'Thank you for reaching out about your billing concern. Our billing team has been notified and will review your account. You should receive a response within 1 business day.';
    case 'feature_request':
      return 'Thank you for your feature suggestion! We\'ve logged this with our product team. Feature requests are reviewed monthly and prioritized based on user demand. We\'ll update this ticket if the feature is planned.';
    case 'data_quality':
      return 'Thank you for reporting this data concern. Our data quality team will investigate and verify the information. We typically resolve data issues within 24-48 hours.';
    default:
      return 'Thank you for contacting Thynk Support. We\'ve received your ticket and a team member will review it shortly. For urgent issues, you can also reach us at support@thynk.guru.';
  }
}

// ─── Email helpers ───────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  // @ts-ignore - Deno global
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) {
    console.warn('RESEND_API_KEY not set — skipping email');
    return false;
  }

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error(`Resend error (${resp.status}):`, err);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Email send error:', e);
    return false;
  }
}

function buildUserConfirmationEmail(
  ticketNumber: string,
  subject: string,
  autoResponse: string,
  canAutoResolve: boolean
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Thynk Support</h1>
    <p style="color: #a0aec0; margin: 8px 0 0;">We've received your ticket</p>
  </div>
  <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <div style="background: #f7fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 14px; color: #718096;">Ticket Number</p>
      <p style="margin: 4px 0 0; font-size: 20px; font-weight: 700; color: #1a202c;">${ticketNumber}</p>
    </div>
    <p style="margin: 0 0 8px; font-weight: 600;">Re: ${subject}</p>
    <div style="background: #f0fff4; border-left: 4px solid #48bb78; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0;">
      <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #48bb78; text-transform: uppercase;">
        ${canAutoResolve ? '✅ Auto-Resolution' : '💬 Initial Response'}
      </p>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #2d3748;">${autoResponse}</p>
    </div>
    ${canAutoResolve ? `
    <p style="font-size: 13px; color: #718096; margin-top: 16px;">
      We believe this resolves your issue. If you still need help, simply reply to this ticket on the 
      <a href="https://thynkflow.io/support" style="color: #4299e1;">Support page</a> and a team member will follow up.
    </p>` : `
    <p style="font-size: 13px; color: #718096; margin-top: 16px;">
      A team member will review your ticket and follow up within 24 hours. Track your ticket at 
      <a href="https://thynkflow.io/support" style="color: #4299e1;">thynkflow.io/support</a>.
    </p>`}
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
    <p style="font-size: 12px; color: #a0aec0; text-align: center;">
      Thynk Industries &bull; <a href="https://thynkflow.io" style="color: #a0aec0;">thynkflow.io</a>
    </p>
  </div>
</body>
</html>`;
}

function buildAdminNotificationEmail(
  ticketNumber: string,
  subject: string,
  description: string,
  userEmail: string,
  priority: string,
  category: string,
  triage: TriageResult
): string {
  const priorityColors: Record<string, string> = {
    low: '#48bb78',
    medium: '#4299e1',
    high: '#ed8936',
    urgent: '#e53e3e',
    critical: '#9b2c2c',
  };
  const color = priorityColors[triage.suggestedPriority] || '#4299e1';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 20px;">🎫 New Support Ticket</h1>
  </div>
  <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr>
        <td style="padding: 8px 12px; color: #718096; width: 120px;">Ticket</td>
        <td style="padding: 8px 12px; font-weight: 600;">${ticketNumber}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; color: #718096;">From</td>
        <td style="padding: 8px 12px;">${userEmail}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; color: #718096;">Priority</td>
        <td style="padding: 8px 12px;">
          <span style="background: ${color}; color: white; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
            ${triage.suggestedPriority.toUpperCase()}
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; color: #718096;">Category</td>
        <td style="padding: 8px 12px;">${triage.suggestedCategory}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; color: #718096;">Sentiment</td>
        <td style="padding: 8px 12px;">${triage.sentiment}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; color: #718096;">Auto-resolved?</td>
        <td style="padding: 8px 12px;">${triage.canAutoResolve ? '✅ Yes' : '❌ No — needs human review'}</td>
      </tr>
    </table>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
    <p style="font-weight: 600; margin-bottom: 8px;">Subject: ${subject}</p>
    <p style="font-size: 14px; color: #4a5568; line-height: 1.6; white-space: pre-wrap;">${description.substring(0, 500)}${description.length > 500 ? '...' : ''}</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
    <p style="font-size: 13px; color: #718096;"><strong>AI Summary:</strong> ${triage.summary}</p>
    ${triage.tags.length > 0 ? `<p style="font-size: 13px; color: #718096;"><strong>Tags:</strong> ${triage.tags.join(', ')}</p>` : ''}
    <div style="text-align: center; margin-top: 20px;">
      <a href="https://thynkflow.io/admin/tickets" style="display: inline-block; background: #1a202c; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        View in Admin Panel
      </a>
    </div>
  </div>
</body>
</html>`;
}

// ─── Main handler ────────────────────────────────────────────────────────────
// @ts-ignore - Deno global
Deno.serve(async (req: Request) => {
  corsHeaders = buildCors(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Support two invocation modes:
    // 1. From DB trigger: { record: { id, subject, ... } }
    // 2. From frontend:   { ticketId: "uuid" }
    let ticket: any;

    if (body.record) {
      // DB trigger payload
      ticket = body.record;
    } else if (body.ticketId) {
      // Frontend payload — fetch ticket from DB
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', body.ticketId)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ success: false, error: 'Ticket not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      ticket = data;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Must provide record (trigger) or ticketId (frontend)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { id: ticketId, subject, description, category, priority, user_id, ticket_number } = ticket;

    console.log(`🎫 Processing ticket ${ticket_number} | ${subject}`);

    // ── Step 1: AI Triage ──
    const triage = await triageWithAI(subject, description, category, priority);
    console.log(`   Triage: priority=${triage.suggestedPriority}, category=${triage.suggestedCategory}, autoResolve=${triage.canAutoResolve}, confidence=${triage.confidence}`);

    // ── Step 2: Update ticket metadata ──
    const updates: Record<string, any> = {
      metadata: {
        ai_triage: {
          suggestedPriority: triage.suggestedPriority,
          suggestedCategory: triage.suggestedCategory,
          sentiment: triage.sentiment,
          summary: triage.summary,
          canAutoResolve: triage.canAutoResolve,
          confidence: triage.confidence,
          tags: triage.tags,
          triaged_at: new Date().toISOString(),
        },
      },
    };

    // If AI suggests different priority/category and is confident, update
    if (triage.confidence >= 0.7) {
      if (triage.suggestedPriority !== priority) {
        updates.priority = triage.suggestedPriority;
      }
      if (triage.suggestedCategory !== category) {
        updates.category = triage.suggestedCategory;
      }
    }

    // If auto-resolvable with high confidence, update status
    if (triage.canAutoResolve && triage.confidence >= 0.6) {
      updates.status = 'in_progress';
      updates.resolution = triage.autoResponse;
    }

    await supabase.from('support_tickets').update(updates).eq('id', ticketId);

    // ── Step 3: Post AI comment on ticket ──
    const commentPrefix = triage.canAutoResolve
      ? '🤖 **Auto-Resolution** (AI Agent)'
      : '🤖 **Initial Triage** (AI Agent)';

    await supabase.from('ticket_comments').insert({
      ticket_id: ticketId,
      user_id: null, // System comment (no user)
      comment: `${commentPrefix}\n\n${triage.autoResponse}`,
      is_internal: false,
    });

    // Also add an internal note for admins
    if (!triage.canAutoResolve) {
      await supabase.from('ticket_comments').insert({
        ticket_id: ticketId,
        user_id: null,
        comment: `🔒 **Internal Triage Note**\n\nSentiment: ${triage.sentiment}\nConfidence: ${(triage.confidence * 100).toFixed(0)}%\nSuggested Priority: ${triage.suggestedPriority}\nTags: ${triage.tags.join(', ') || 'none'}\n\nThis ticket requires human review.`,
        is_internal: true,
      });
    }

    // ── Step 4: Send user confirmation email ──
    let userEmailSent = false;
    if (user_id) {
      const { data: profile } = await supabase.auth.admin.getUserById(user_id);
      const userEmail = profile?.user?.email;

      if (userEmail) {
        userEmailSent = await sendEmail(
          userEmail,
          `[${ticket_number}] ${triage.canAutoResolve ? 'Resolved' : 'Received'}: ${subject}`,
          buildUserConfirmationEmail(ticket_number, subject, triage.autoResponse, triage.canAutoResolve)
        );
      }
    }

    // ── Step 5: Admin notification for non-auto-resolved or high-priority ──
    let adminEmailSent = false;
    const needsAdmin =
      !triage.canAutoResolve ||
      ['high', 'urgent', 'critical'].includes(triage.suggestedPriority) ||
      triage.sentiment === 'angry' ||
      triage.sentiment === 'frustrated';

    if (needsAdmin) {
      const { data: profile } = user_id
        ? await supabase.auth.admin.getUserById(user_id)
        : { data: null };
      const userEmail = profile?.user?.email || 'unknown';

      adminEmailSent = await sendEmail(
        ADMIN_EMAIL,
        `🎫 [${triage.suggestedPriority.toUpperCase()}] ${ticket_number}: ${subject}`,
        buildAdminNotificationEmail(
          ticket_number, subject, description, userEmail,
          priority, category, triage
        )
      );
    }

    console.log(`   ✅ Done: comment posted, userEmail=${userEmailSent}, adminEmail=${adminEmailSent}`);

    return new Response(
      JSON.stringify({
        success: true,
        ticketNumber: ticket_number,
        triage: {
          priority: triage.suggestedPriority,
          category: triage.suggestedCategory,
          canAutoResolve: triage.canAutoResolve,
          confidence: triage.confidence,
          sentiment: triage.sentiment,
        },
        emails: { user: userEmailSent, admin: adminEmailSent },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('ticket-agent error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
