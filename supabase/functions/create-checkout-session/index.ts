// Create Checkout Session Edge Function using only fetch (no npm packages)
// @ts-ignore - Deno import for Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.thynkflow.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

// @ts-ignore - Deno global for Supabase Edge Functions
const supabase = createClient(
  // @ts-ignore
  Deno.env.get('SUPABASE_URL') ?? '',
  // @ts-ignore
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://www.thynkflow.io';
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const STRIPE_PUBLISHABLE_KEY = Deno.env.get('STRIPE_PUBLISHABLE_KEY') || Deno.env.get('VITE_STRIPE_PUBLISHABLE_KEY');

function jsonResponse(body: unknown, options: { status?: number } = {}) {
  return new Response(JSON.stringify(body), {
    status: options.status ?? 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getUserFromToken(token: string) {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Error('Unauthorized');
  }
  return data.user;
}

async function fetchStripe(url: string, params: Record<string, string>) {
  if (!STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }
  const body = new URLSearchParams(params);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${STRIPE_SECRET_KEY}:`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Stripe API error');
  }
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
  }

  if (!STRIPE_SECRET_KEY) {
    return jsonResponse({ error: 'Stripe secret missing' }, { status: 500 });
  }

  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/Bearer\s+/i, '').trim();
  if (!token) {
    return jsonResponse({ error: 'Missing Authorization header' }, { status: 401 });
  }

  let user;
  try {
    user = await getUserFromToken(token);
  } catch (err) {
    console.error('Auth error:', err);
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { success_url?: string; cancel_url?: string; price_id?: string };
  try {
    body = await req.json();
  } catch (err) {
    console.error('Invalid payload:', err);
    return jsonResponse({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const priceId = body.price_id || Deno.env.get('STRIPE_PRO_PRICE_ID');
  if (!priceId) {
    return jsonResponse({ error: 'Missing price ID' }, { status: 500 });
  }

  const successUrl = body.success_url || `${SITE_URL}/app?checkout=success`;
  const cancelUrl = body.cancel_url || `${SITE_URL}/app?checkout=cancel`;

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, email, stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error('Profile lookup failed', profileError);
    return jsonResponse({ error: 'Profile not found' }, { status: 404 });
  }

  let customerId = profile.stripe_customer_id;
  if (!customerId) {
    const customer = await fetchStripe('https://api.stripe.com/v1/customers', {
      email: profile.email,
      'metadata[user_id]': profile.id,
    });
    customerId = customer.id;
    await supabase
      .from('user_profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', profile.id);
  }

  let session;
  try {
    session = await fetchStripe('https://api.stripe.com/v1/checkout/sessions', {
      customer: customerId,
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: 'true',
      client_reference_id: profile.id,
      'metadata[user_id]': profile.id,
    });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return jsonResponse({ error: String(err) }, { status: 500 });
  }

  return jsonResponse({ sessionId: session.id, publishableKey: STRIPE_PUBLISHABLE_KEY || '' });
});