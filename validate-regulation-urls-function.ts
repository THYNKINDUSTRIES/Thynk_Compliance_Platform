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
