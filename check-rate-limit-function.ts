// Fixed check-rate-limit edge function
// This should replace the existing function in Supabase

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { ipAddress, email, action } = await req.json();

    if (!ipAddress || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const now = new Date();
    const limits = {
      signup: { max: 3, windowMinutes: 60 },
      email_verification: { max: 5, windowMinutes: 60 }
    };

    const limit = limits[action as keyof typeof limits];
    if (!limit) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Check IP-based rate limit
    const ipCheckUrl = `${supabaseUrl}/rest/v1/rate_limits?ip_address=eq.${encodeURIComponent(ipAddress)}&action=eq.${action}&select=*`;
    const ipRes = await fetch(ipCheckUrl, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const ipRecords = await ipRes.json();
    
    let ipRecord = ipRecords[0];
    if (ipRecord) {
      const resetTime = new Date(ipRecord.reset_at);
      if (now < resetTime) {
        if (ipRecord.attempt_count >= limit.max) {
          const minutesLeft = Math.ceil((resetTime.getTime() - now.getTime()) / 60000);
          return new Response(JSON.stringify({
            allowed: false,
            reason: 'ip_limit',
            minutesUntilReset: minutesLeft,
            message: `Too many ${action} attempts from this IP. Try again in ${minutesLeft} min.`
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      } else {
        const resetAt = new Date(now.getTime() + limit.windowMinutes * 60000);
        await fetch(`${supabaseUrl}/rest/v1/rate_limits?id=eq.${ipRecord.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ attempt_count: 1, reset_at: resetAt.toISOString() })
        });
      }
    }

    return new Response(JSON.stringify({
      allowed: true,
      message: 'Rate limit check passed'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Rate limit check error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
