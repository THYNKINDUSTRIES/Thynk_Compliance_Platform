// Updated scheduled-poller-cron edge function
// ────────────────────────────────────────────────
// SCHEDULE OVERVIEW:
//   Every trigger   — federal-register-poller, regulations-gov-poller, rss-feed-poller
//   Every 6 hours   — cannabis-hemp-poller (0/6/12/18 UTC)
//                   — state-regulations-poller (2/8/14/20 UTC, offset)
//   Daily 3 AM UTC  — caselaw-poller (CourtListener)
//   Daily 4 AM UTC  — kratom-poller
//   Daily 5 AM UTC  — kava-poller
//   Daily 6 AM UTC  — state-legislature-poller (OpenStates + LegiScan)
//   Daily 7 AM UTC  — congress-poller (Congress.gov)
//   Daily 9 AM UTC  — comment-deadline-reminders
//
// To deploy manually:
//   supabase functions deploy scheduled-poller-cron --project-ref kruwbjaszdwzttblxqwr

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Helper to invoke any Edge Function with standard auth
async function invokeFunction(name: string, body?: object): Promise<any> {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/${name}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = await resp.json();
  return { ok: resp.ok, data };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const now = new Date();
    const hour = now.getUTCHours();

    const results: Record<string, any> = {
      federalRegister: { success: false, message: '', recordsAdded: 0 },
      regulationsGov: { success: false, message: '', recordsAdded: 0 },
      rssFeed: { success: false, message: '', recordsAdded: 0 },
      cannabisHempPoller: { success: false, message: '', recordsAdded: 0 },
      stateRegulations: { success: false, message: '', recordsAdded: 0 },
      caselawPoller: { success: false, message: '', recordsAdded: 0 },
      kratomPoller: { success: false, message: '', recordsAdded: 0 },
      kavaPoller: { success: false, message: '', recordsAdded: 0 },
      stateLegislature: { success: false, message: '', recordsAdded: 0 },
      congressPoller: { success: false, message: '', recordsAdded: 0 },
      commentReminders: { success: false, message: '', remindersSent: 0 },
    };

    // ── ALWAYS RUN: Federal Register Poller ────────────────────────────────
    try {
      const { ok, data } = await invokeFunction('federal-register-poller');
      results.federalRegister = {
        success: ok,
        message: data.message || 'Completed',
        recordsAdded: data.recordsAdded || 0
      };
    } catch (error) {
      results.federalRegister.message = `Error: ${error.message}`;
    }

    // ── ALWAYS RUN: Regulations.gov Poller ─────────────────────────────────
    try {
      const { ok, data } = await invokeFunction('regulations-gov-poller');
      results.regulationsGov = {
        success: ok,
        message: data.message || 'Completed',
        recordsAdded: data.recordsAdded || 0
      };
    } catch (error) {
      results.regulationsGov.message = `Error: ${error.message}`;
    }

    // ── ALWAYS RUN: RSS Feed Poller ────────────────────────────────────────
    try {
      const { ok, data } = await invokeFunction('rss-feed-poller');
      results.rssFeed = {
        success: ok,
        message: data.message || 'Completed',
        recordsAdded: data.recordsAdded || data.totalInserted || 0
      };
    } catch (error) {
      results.rssFeed.message = `Error: ${error.message}`;
    }

    // ── EVERY 6 HRS: Cannabis/Hemp Poller (0, 6, 12, 18 UTC) ──────────────
    if (hour === 0 || hour === 6 || hour === 12 || hour === 18) {
      try {
        const { ok, data } = await invokeFunction('cannabis-hemp-poller', { pollAll: true });
        results.cannabisHempPoller = {
          success: ok,
          message: data.message || 'Completed',
          recordsAdded: data.totalRecords || data.recordsAdded || 0
        };
      } catch (error) {
        results.cannabisHempPoller.message = `Error: ${error.message}`;
      }
    } else {
      results.cannabisHempPoller.message = `Skipped - runs every 6 hours at 0,6,12,18 UTC (current: ${hour})`;
    }

    // ── EVERY 6 HRS: State Regulations Poller (2, 8, 14, 20 UTC) ──────────
    if (hour === 2 || hour === 8 || hour === 14 || hour === 20) {
      try {
        const { ok, data } = await invokeFunction('state-regulations-poller');
        results.stateRegulations = {
          success: ok,
          message: data.message || 'Completed',
          recordsAdded: data.recordsAdded || data.totalInserted || 0
        };
      } catch (error) {
        results.stateRegulations.message = `Error: ${error.message}`;
      }
    } else {
      results.stateRegulations.message = `Skipped - runs every 6 hours at 2,8,14,20 UTC (current: ${hour})`;
    }

    // ── DAILY 3 AM UTC: Caselaw Poller (CourtListener) ─────────────────────
    if (hour === 3) {
      try {
        const { ok, data } = await invokeFunction('caselaw-poller');
        results.caselawPoller = {
          success: ok,
          message: data.message || 'Completed',
          recordsAdded: data.totalInserted || 0
        };
      } catch (error) {
        results.caselawPoller.message = `Error: ${error.message}`;
      }
    } else {
      results.caselawPoller.message = `Skipped - daily at 3 AM UTC (current: ${hour})`;
    }

    // ── DAILY 4 AM UTC: Kratom Poller ──────────────────────────────────────
    if (hour === 4) {
      try {
        const { ok, data } = await invokeFunction('kratom-poller');
        results.kratomPoller = {
          success: ok,
          message: data.message || 'Completed',
          recordsAdded: data.recordsAdded || data.totalInserted || 0
        };
      } catch (error) {
        results.kratomPoller.message = `Error: ${error.message}`;
      }
    } else {
      results.kratomPoller.message = `Skipped - daily at 4 AM UTC (current: ${hour})`;
    }

    // ── DAILY 5 AM UTC: Kava Poller ────────────────────────────────────────
    if (hour === 5) {
      try {
        const { ok, data } = await invokeFunction('kava-poller');
        results.kavaPoller = {
          success: ok,
          message: data.message || 'Completed',
          recordsAdded: data.recordsAdded || data.totalInserted || 0
        };
      } catch (error) {
        results.kavaPoller.message = `Error: ${error.message}`;
      }
    } else {
      results.kavaPoller.message = `Skipped - daily at 5 AM UTC (current: ${hour})`;
    }

    // ── DAILY 6 AM UTC: State Legislature Poller (OpenStates + LegiScan) ───
    if (hour === 6) {
      try {
        const { ok, data } = await invokeFunction('state-legislature-poller');
        results.stateLegislature = {
          success: ok,
          message: data.message || 'Completed',
          recordsAdded: data.totalInserted || 0
        };
      } catch (error) {
        results.stateLegislature.message = `Error: ${error.message}`;
      }
    } else {
      results.stateLegislature.message = `Skipped - daily at 6 AM UTC (current: ${hour})`;
    }

    // ── DAILY 7 AM UTC: Congress Poller (Congress.gov) ─────────────────────
    if (hour === 7) {
      try {
        const { ok, data } = await invokeFunction('congress-poller');
        results.congressPoller = {
          success: ok,
          message: data.message || 'Completed',
          recordsAdded: data.totalInserted || 0
        };
      } catch (error) {
        results.congressPoller.message = `Error: ${error.message}`;
      }
    } else {
      results.congressPoller.message = `Skipped - daily at 7 AM UTC (current: ${hour})`;
    }

    // ── DAILY 9 AM UTC: Comment Deadline Reminders ─────────────────────────
    if (hour === 9) {
      try {
        const { ok, data } = await invokeFunction('process-comment-deadline-reminders');
        results.commentReminders = {
          success: ok,
          message: data.message || 'Completed',
          remindersSent: data.remindersSent || 0
        };
      } catch (error) {
        results.commentReminders.message = `Error: ${error.message}`;
      }
    } else {
      results.commentReminders.message = `Skipped - daily at 9 AM UTC (current: ${hour})`;
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
