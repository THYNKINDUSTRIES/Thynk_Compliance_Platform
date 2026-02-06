export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.thynkflow.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const FEDERAL_AGENCY_URLS: Record<string, any> = {
  'Drug Enforcement Administration': {
    name: 'DEA',
    general: 'https://www.dea.gov/drug-information',
    cannabis: 'https://www.dea.gov/drug-information/drug-scheduling',
    kratom: 'https://www.dea.gov/drug-information',
  },
  'Food and Drug Administration': {
    name: 'FDA',
    general: 'https://www.fda.gov/news-events/public-health-focus/fda-regulation-cannabis-and-cannabis-derived-products',
    cannabis: 'https://www.fda.gov/news-events/public-health-focus/fda-regulation-cannabis-and-cannabis-derived-products',
    hemp: 'https://www.fda.gov/news-events/public-health-focus/fda-regulation-cannabis-and-cannabis-derived-products',
    tobacco: 'https://www.fda.gov/tobacco-products',
    kratom: 'https://www.fda.gov/food/dietary-supplements',
  },
  'Department of Agriculture': {
    name: 'USDA',
    general: 'https://www.usda.gov/',
    hemp: 'https://www.ams.usda.gov/rules-regulations/hemp',
    cannabis: 'https://www.ams.usda.gov/rules-regulations/hemp',
  },
  'Bureau of Alcohol, Tobacco, Firearms, and Explosives': {
    name: 'ATF',
    general: 'https://www.atf.gov/',
    tobacco: 'https://www.atf.gov/alcohol-tobacco',
  },
  'Department of Health and Human Services': {
    name: 'HHS',
    general: 'https://www.hhs.gov/',
    cannabis: 'https://www.hhs.gov/',
    psilocybin: 'https://www.hhs.gov/',
  },
  'Department of Justice': {
    name: 'DOJ',
    general: 'https://www.justice.gov/',
    cannabis: 'https://www.justice.gov/cannabis',
  },
  'National Institute on Drug Abuse': {
    name: 'NIDA',
    general: 'https://nida.nih.gov/',
    cannabis: 'https://nida.nih.gov/research-topics/cannabis-marijuana',
    kratom: 'https://nida.nih.gov/research-topics/kratom',
    psilocybin: 'https://nida.nih.gov/research-topics/psychedelic-and-dissociative-drugs',
  },
  'Federal Trade Commission': {
    name: 'FTC',
    general: 'https://www.ftc.gov/',
    tobacco: 'https://www.ftc.gov/reports/federal-trade-commission-cigarette-report',
  },
  'Consumer Product Safety Commission': {
    name: 'CPSC',
    general: 'https://www.cpsc.gov/',
  },
  'Environmental Protection Agency': {
    name: 'EPA',
    general: 'https://www.epa.gov/',
    hemp: 'https://www.epa.gov/pesticide-registration/biopesticide-registration',
  },
};

function isRelevantRegulation(title: string, abstract: string): boolean {
  const text = `${title} ${abstract}`.toLowerCase();
  const excludeKeywords = ['wildlife', 'ocean', 'marine', 'fishery', 'fisheries', 'hunting', 'fishing', 'endangered species', 'conservation', 'forestry', 'timber', 'mining', 'coal', 'petroleum', 'natural gas', 'oil and gas', 'endangered', 'migratory bird', 'aviation', 'airplane'];
  if (excludeKeywords.some(k => text.includes(k))) return false;
  const includeKeywords = ['cannabis', 'marijuana', 'hemp', 'cbd', 'thc', 'kratom', 'nicotine', 'tobacco', 'vaping'];
  return includeKeywords.some(k => text.includes(k));
}

function getVerifiedAgencyUrl(doc: any): string {
  const agencies = Array.isArray(doc?.agencies) ? doc.agencies : [];
  const title = String(doc?.title || '').toLowerCase();
  for (const agency of agencies) {
    const agencyName = agency && typeof agency === 'object' && 'name' in agency
      ? String(agency.name)
      : String(agency);
    const lowerAgencyName = agencyName.toLowerCase();
    for (const [key, urlsRaw] of Object.entries(FEDERAL_AGENCY_URLS)) {
      const urls: any = urlsRaw ?? {};
      const lowerKey = String(key).toLowerCase();
      const lowerUrlsName = String(urls.name || '').toLowerCase();
      if (lowerAgencyName.includes(lowerKey) || (lowerUrlsName && lowerAgencyName.includes(lowerUrlsName))) {
        if (title.includes('cannabis') || title.includes('marijuana') || title.includes('hemp')) {
          return urls.cannabis || urls.hemp || urls.general || (doc?.html_url as string) || 'https://www.federalregister.gov/';
        }
        if (title.includes('tobacco') || title.includes('nicotine') || title.includes('vaping')) {
          return urls.tobacco || urls.general || (doc?.html_url as string) || 'https://www.federalregister.gov/';
        }
        if (title.includes('psilocybin') || title.includes('mushrooms') || title.includes('research')) {
          return urls.psilocybin || urls.psylocybin || urls.general || (doc?.html_url as string) || 'https://www.federalregister.gov/';
        }
        if (title.includes('kratom')) {
          return urls.kratom || urls.general || (doc?.html_url as string) || 'https://www.federalregister.gov/';
        }
        return urls.general || (doc?.html_url as string) || 'https://www.federalregister.gov/';
      }
    }
  }
  return (doc?.html_url as string) || 'https://www.federalregister.gov/';
}

/* ---------- Helper: fetchWithRetries ---------- */
async function fetchWithRetries(url: string, opts: RequestInit, attempts = 3, baseDelayMs = 500, maxDelayMs = 5000, timeoutMs = 9000): Promise<Response> {
  let lastErr: any = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(timeoutId);
      if (resp.ok) return resp;
      if (resp.status === 429 || (resp.status >= 500 && resp.status < 600)) {
        const ra = resp.headers.get('Retry-After');
        let waitMs = 0;
        if (ra) {
          const seconds = Number(ra);
          if (!Number.isNaN(seconds)) waitMs = seconds * 1000;
          else {
            const retryDate = Date.parse(ra);
            if (!Number.isNaN(retryDate)) waitMs = Math.max(0, retryDate - Date.now());
          }
        }
        if (waitMs === 0) {
          const backoff = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
          waitMs = backoff + Math.floor(Math.random() * 100);
        }
        if (attempt === attempts) return resp;
        await new Promise(res => setTimeout(res, waitMs));
        continue;
      }
      return resp;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastErr = err;
      if (attempt === attempts) break;
      const backoff = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
      await new Promise(res => setTimeout(res, backoff + Math.floor(Math.random() * 100)));
    }
  }
  throw lastErr || new Error('fetchWithRetries unknown error');
}

/* ---------- Edge Function handler ---------- */
// @ts-ignore - Deno global for Supabase Edge Functions
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let sessionId: string | null = null;
  let sourceName: string | null = null;

  try {
    const body = await req.json().catch(() => ({}));
    sessionId = body.sessionId || null;
    sourceName = body.sourceName || 'federal-default';
  } catch (e: any) {
    console.warn('Non-JSON or empty body received (ok for internal calls):', e.message);
  }

  // @ts-ignore - Deno global for Supabase Edge Functions
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  // @ts-ignore - Deno global for Supabase Edge Functions
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: corsHeaders }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const updateProgress = async (updates: Partial<any>) => {
    if (!sessionId || !sourceName) return;
    try {
      await supabase
        .from('data_population_progress')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('session_id', sessionId)
        .eq('source_name', sourceName);
    } catch (e: any) {
      console.warn('Failed to update progress row:', e);
    }
  };

  const releaseLock = async () => {
    try {
      if (sessionId && sourceName) {
        await supabase
          .from('data_population_progress')
          .update({ updated_at: new Date().toISOString() })
          .eq('session_id', sessionId)
          .eq('source_name', sourceName);
      }
    } catch (e: any) {
      console.warn('Failed to release lock:', e);
    }
  };

  // Acquire lock
  const LOCK_TTL_MINUTES = 120;
  try {
    if (!sourceName) {
      return new Response(JSON.stringify({ error: 'missing sourceName' }), { status: 400, headers: corsHeaders });
    }

    const lockCheck = await supabase
      .from('data_population_progress')
      .select('session_id,started_at,status')
      .eq('source_name', sourceName)
      .eq('status', 'running')
      .limit(1)
      .maybeSingle();

    if (lockCheck.error) {
      console.warn('Lock check query error (continuing):', lockCheck.error.message);
    } else if (lockCheck.data) {
      const startedAt = new Date(lockCheck.data.started_at);
      const ageMin = (Date.now() - startedAt.getTime()) / 1000 / 60;
      if (ageMin < LOCK_TTL_MINUTES) {
        if (sessionId) {
          await supabase.from('data_population_progress').insert([{
            session_id: sessionId,
            source_name: sourceName,
            status: 'aborted',
            error_message: 'Lock: another run active',
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
        }
        return new Response(JSON.stringify({ error: 'Another run is active for this source' }), { status: 409, headers: corsHeaders });
      } else {
        console.warn('Stale running row detected; continuing to create new run.');
      }
    }

    if (sessionId) {
      const insertRes = await supabase.from('data_population_progress').insert([{
        session_id: sessionId,
        source_name: sourceName,
        status: 'running',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        records_fetched: 0
      }]);
      if (insertRes.error) {
        console.warn('Could not insert progress row lock:', insertRes.error.message);
      }
    }
  } catch (lockErr) {
    console.error('Lock acquisition failed:', lockErr);
    return new Response(JSON.stringify({ error: 'Lock acquisition failed' }), { status: 500, headers: corsHeaders });
  }

  // Main polling logic
  try {
    await updateProgress({ status: 'running', started_at: new Date().toISOString(), records_fetched: 0 });

    let startDate = '2019-01-01';
    try {
      const maxRes = await supabase
        .from('instrument')
        .select('max(effective_date)::text as max_date')
        .eq('source', 'federal_register')
        .limit(1)
        .maybeSingle();
      if (!maxRes.error && maxRes.data && maxRes.data.max_date) {
        const dt = new Date(maxRes.data.max_date);
        dt.setSeconds(dt.getSeconds() + 1);
        startDate = dt.toISOString().slice(0, 10);
        console.info('Using dynamic startDate:', startDate);
      } else {
        console.info('No prior data found; using default startDate:', startDate);
      }
    } catch (e: any) {
      console.warn('Failed to compute dynamic startDate; using default:', e);
    }

    // @ts-ignore - Deno global for Supabase Edge Functions
    const apiKey = Deno.env.get('FEDERAL_REGISTER_API_KEY');
    const headers: HeadersInit = apiKey ? { 'X-Api-Key': apiKey } : {};
    const searchTerms = ['cannabis', 'marijuana', 'hemp', 'CBD', 'THC', 'kratom', 'nicotine', 'tobacco', 'vaping'];
    let recordsProcessed = 0;
    const batch: any[] = [];

    for (const term of searchTerms) {
      for (let page = 1; page <= 5; page++) {
        const url = `https://www.federalregister.gov/api/v1/documents.json?per_page=100&page=${page}&order=newest&publication_date[gte]=${startDate}&conditions[term]=${encodeURIComponent(term)}&fields[]=title&fields[]=publication_date&fields[]=document_number&fields[]=html_url&fields[]=agencies&fields[]=abstract`;

        let response: Response;
        try {
          response = await fetchWithRetries(url, { headers }, 3, 500, 5000, 9000);
        } catch (fetchErr: any) {
          console.error(`Fetch attempts failed for term "${term}" page ${page}:`, fetchErr);
          await updateProgress({ status: 'running', error_message: `fetch_failed_${term}_p${page}` });
          break;
        }

        if (!response.ok) {
          console.warn(`API returned ${response.status} for ${term} page ${page}; skipping page.`);
          if (response.status >= 400 && response.status < 500 && response.status !== 429) break;
          continue;
        }

        let data: any;
        try {
          data = await response.json();
        } catch (jsonErr: any) {
          console.error('JSON parse error:', jsonErr);
          break;
        }

        if (!data.results?.length) break;

        for (const doc of data.results) {
          if (!isRelevantRegulation(doc.title || '', doc.abstract || '')) continue;
          const verifiedUrl = getVerifiedAgencyUrl(doc);
          batch.push({
            external_id: doc.document_number,
            title: doc.title || 'Untitled',
            description: doc.abstract || '',
            effective_date: doc.publication_date,
            jurisdiction_id: '00000000-0000-0000-0000-000000000001',
            source: 'federal_register',
            url: verifiedUrl,
            metadata: { agencies: doc.agencies || null, original_url: doc.html_url, verified_url: verifiedUrl }
          });
          recordsProcessed++;

          if (batch.length >= 50) {
            try {
              const upsertRes = await supabase.from('instrument').upsert(batch, { onConflict: 'external_id' });
              if (upsertRes.error) {
                console.error('Upsert error for batch:', upsertRes.error);
                const retryRes = await supabase.from('instrument').upsert(batch.slice(0, 25), { onConflict: 'external_id' });
                if (retryRes.error) console.error('Retry upsert also failed:', retryRes.error);
              }
            } catch (upsertErr) {
              console.error('Upsert exception:', upsertErr);
            } finally {
              batch.length = 0;
              await updateProgress({ records_fetched: recordsProcessed });
            }
          }
        }

        // @ts-ignore - Deno global for Supabase Edge Functions
        const pageDelayMs = Number(Deno.env.get('FEDERAL_POLL_PAGE_DELAY_MS') || '500');
        await new Promise(res => setTimeout(res, pageDelayMs));
      }
    }

    // Final flush
    if (batch.length > 0) {
      try {
        const upsertRes = await supabase.from('instrument').upsert(batch, { onConflict: 'external_id' });
        if (upsertRes.error) console.error('Final upsert error:', upsertRes.error);
      } catch (upsertErr: any) {
        console.error('Final upsert exception:', upsertErr);
      }
    }

    await updateProgress({
      status: 'completed',
      records_fetched: recordsProcessed,
      completed_at: new Date().toISOString(),
    });
    await releaseLock();

    return new Response(
      JSON.stringify({ success: true, recordsProcessed }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Poller fatal error:', error);
    await updateProgress({
      status: 'failed',
      error_message: error.message?.slice(0, 500) || 'Unknown error',
      completed_at: new Date().toISOString(),
    });
    await releaseLock();

    return new Response(
      JSON.stringify({ error: 'Poller failed', details: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
