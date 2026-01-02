// Updated scheduled-poller-cron edge function
// Includes cannabis-hemp-poller running every 6 hours at 0, 6, 12, 18 UTC
// 
// To deploy manually:
// supabase functions deploy scheduled-poller-cron --project-ref kruwbjaszdwzttblxqwr

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
    
    const results = {
      federalRegister: { success: false, message: '', recordsAdded: 0 },
      regulationsGov: { success: false, message: '', recordsAdded: 0 },
      cannabisHempPoller: { success: false, message: '', recordsAdded: 0 },
      commentReminders: { success: false, message: '', remindersSent: 0 }
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

    // Trigger Cannabis/Hemp Poller every 6 hours (0, 6, 12, 18 UTC)
    if (hour === 0 || hour === 6 || hour === 12 || hour === 18) {
      try {
        const chResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/cannabis-hemp-poller`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify({ pollAll: true })
          }
        );
        
        const chData = await chResponse.json();
        results.cannabisHempPoller = {
          success: chResponse.ok,
          message: chData.message || 'Completed',
          recordsAdded: chData.totalRecords || chData.recordsAdded || 0
        };
      } catch (error) {
        results.cannabisHempPoller.message = `Error: ${error.message}`;
      }
    } else {
      results.cannabisHempPoller.message = `Skipped - runs every 6 hours at 0, 6, 12, 18 UTC (current hour: ${hour})`;
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

    const duration = Date.now() - startTime;

    return new Response(JSON.stringify({
      success: true,
      executionTime: duration,
      currentHour: hour,
      timestamp: now.toISOString(),
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
