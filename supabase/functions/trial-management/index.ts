import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Authorized domains that bypass all restrictions
const AUTHORIZED_DOMAINS = ['thynk.guru', 'cultivalaw.com', 'discountpharms.com'];

interface TrialSignupRequest {
  email: string;
  fingerprint_visitor_id: string;
  payment_method_id: string;
  selected_jurisdiction: string;
  ip_address?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Extract domain from email
function extractDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() || '';
}

// Check if domain is authorized
function isAuthorizedDomain(domain: string): boolean {
  return AUTHORIZED_DOMAINS.includes(domain.toLowerCase());
}

async function handleTrialSignup(body: TrialSignupRequest): Promise<Response> {
  const { email, fingerprint_visitor_id, payment_method_id, selected_jurisdiction, ip_address } = body;

  // Extract domain
  const domain = extractDomain(email);

  // Check if domain is authorized (bypasses all restrictions)
  if (isAuthorizedDomain(domain)) {
    // For testing: return success without database operations
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 3);

    return new Response(JSON.stringify({
      success: true,
      user_id: crypto.randomUUID(),
      trial_end_date: trialEndDate.toISOString(),
      message: 'Trial activated successfully (authorized domain - test mode)',
      is_authorized_domain: true,
      abuse_score: 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // For testing: return success without database operations
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 3);

  return new Response(JSON.stringify({
    success: true,
    user_id: crypto.randomUUID(),
    trial_end_date: trialEndDate.toISOString(),
    message: 'Trial activated successfully (test mode)',
    abuse_score: 0
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleTrialStatus(req: Request): Promise<Response> {
  // Mock response for testing
  return new Response(JSON.stringify({
    is_trial_active: true,
    trial_end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    selected_jurisdiction: 'CA',
    subscription_status: 'trial',
    is_authorized_domain: false,
    days_remaining: 3
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleTrialExtension(body: { user_id: string; extension_days: number }): Promise<Response> {
  // Mock response for testing
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body.action;

    switch (action) {
      case 'signup':
        return await handleTrialSignup(body);
      case 'status':
        return await handleTrialStatus(req);
      case 'extend':
        return await handleTrialExtension(body);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Trial management error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});