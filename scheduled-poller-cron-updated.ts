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
