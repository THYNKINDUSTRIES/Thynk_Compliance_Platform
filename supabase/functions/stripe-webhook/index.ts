// @ts-ignore - Deno import for Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
// @ts-ignore - Deno import for Supabase Edge Functions
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.thynkflow.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

// @ts-ignore - Deno global for Supabase Edge Functions
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// @ts-ignore - Deno global for Supabase Edge Functions
const supabase = createClient(
  // @ts-ignore - Deno global for Supabase Edge Functions
  Deno.env.get('SUPABASE_URL') ?? '',
  // @ts-ignore - Deno global for Supabase Edge Functions
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// @ts-ignore - Deno global for Supabase Edge Functions
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

// @ts-ignore - Deno global for Supabase Edge Functions
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature || !endpointSecret) {
      return new Response(JSON.stringify({ error: 'Missing signature or secret' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'setup_intent.succeeded':
        await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const status = subscription.status;

  // Find user by customer ID
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    console.error('Profile not found for customer:', customerId);
    return;
  }

  // Update subscription status
  await supabase
    .from('user_profiles')
    .update({
      subscription_status: status === 'active' ? 'paid' : status,
      trial_active: false, // Trial ends when subscription starts
      subscription_id: subscription.id
    })
    .eq('id', profile.id);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const status = subscription.status;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) return;

  await supabase
    .from('user_profiles')
    .update({
      subscription_status: status === 'active' ? 'paid' : status,
      subscription_id: subscription.id
    })
    .eq('id', profile.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) return;

  await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'cancelled',
      subscription_id: null
    })
    .eq('id', profile.id);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Handle successful payments (trial conversion, renewals, etc.)
  const subscriptionId = invoice.subscription as string;

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await handleSubscriptionUpdated(subscription);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed payments
  const subscriptionId = invoice.subscription as string;

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await handleSubscriptionUpdated(subscription);
  }
}

async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  // SetupIntent succeeded - card is verified for trial
  // This is called when the card is successfully verified for $0 hold
  const customerId = setupIntent.customer as string;

  if (customerId) {
    // Update profile with customer ID if not already set
    await supabase
      .from('user_profiles')
      .update({ stripe_customer_id: customerId })
      .eq('stripe_customer_id', customerId); // Only update if not set
  }
}