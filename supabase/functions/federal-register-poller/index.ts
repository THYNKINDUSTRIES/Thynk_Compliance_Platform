export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const FEDERAL_AGENCY_URLS: Record<string, any> = { /* unchanged — your map is excellent */ };

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
/*
  Retries on network errors, 5xx and 429.
  - attempts: total attempts (default 3)
  - baseDelayMs: initial backoff (default 500ms)
  - maxDelayMs: cap (default 5000ms)
  - honors Retry-After header (if present) for 429/503
*/
async function fetchWithRetries(url: string, opts: RequestInit, attempts = 3, baseDelayMs = 500, maxDelayMs = 5000, timeoutMs = 9000): Promise<Response> {
  let lastErr: any = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(timeoutId);

      if (resp.ok) {
        return resp;
      }

      // Handle 429 / 503 / 5xx as transient
      if (resp.status === 429 || (resp.status >= 500 && resp.status < 600)) {
        // Try to parse Retry-After header
        const ra = resp.headers.get('Retry-After');
        export const corsHeaders = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        };
        import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

        const FEDERAL_AGENCY_URLS: Record<string, any> = { /* unchanged — your map is excellent */ };

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
        /*
          Retries on network errors, 5xx and 429.
          - attempts: total attempts (default 3)
          - baseDelayMs: initial backoff (default 500ms)
          - maxDelayMs: cap (default 5000ms)
          - honors Retry-After header (if present) for 429/503
        */
        async function fetchWithRetries(url: string, opts: RequestInit, attempts = 3, baseDelayMs = 500, maxDelayMs = 5000, timeoutMs = 9000): Promise<Response> {
          let lastErr: any = null;
          for (let attempt = 1; attempt <= attempts; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            try {
              const resp = await fetch(url, { ...opts, signal: controller.signal });
              clearTimeout(timeoutId);

              if (resp.ok) {
                return resp;
              }

              // Handle 429 / 503 / 5xx as transient
              if (resp.status === 429 || (resp.status >= 500 && resp.status < 600)) {
                // Try to parse Retry-After header
                const ra = resp.headers.get('Retry-After');
                let waitMs = 0;
                if (ra) {
                  const seconds = Number(ra);
                  if (!Number.isNaN(seconds)) waitMs = seconds * 1000;
                  else {
                    // try parse http-date
                    const retryDate = Date.parse(ra);
                    if (!Number.isNaN(retryDate)) waitMs = Math.max(0, retryDate - Date.now());
                  }
                }
                if (waitMs === 0) {
                  const backoff = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
                  waitMs = backoff + Math.floor(Math.random() * 100); // jitter
                }
                // If this was the last attempt, return response (so the caller can inspect)
                if (attempt === attempts) return resp;
                await new Promise(res => setTimeout(res, waitMs));
                continue;
              }

              // For client errors (4xx except 429) treat as permanent
              return resp;
            } catch (err: any) {
              clearTimeout(timeoutId);
              lastErr = err;
              // On abort or network error, retry until attempts exhausted
              if (attempt === attempts) break;
              const backoff = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
              await new Promise(res => setTimeout(res, backoff + Math.floor(Math.random() * 100)));
            }
          }
          throw lastErr || new Error('fetchWithRetries unknown error');
        }

        //* ---------- Edge Function handler ---------- */
        Deno.serve(async (req: Request) => {
          if (req.method === 'OPTIONS') {
            return new Response('ok', { headers: corsHeaders });
          }

          let sessionId: string | null = null;
          let sourceName: string | null = null;

          try {
            const body = await req.json().catch(() => ({})); // Empty object on parse failure
            sessionId = body.sessionId || null;
            sourceName = body.sourceName || 'federal-default'; // Fallback name for internal calls
            console.log('Parsed body:', body); // Debug log
          } catch (e: any) {
            console.warn('Non-JSON or empty body received (ok for internal calls):', e.message);
            // Continue — no early return
          }

          const supabaseUrl = Deno.env.get('SUPABASE_URL');
          // Prefer service role key when available for server-side operations, fall back to anon key
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');

          if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase env vars (SUPABASE_URL or SUPABASE_ANON_KEY/SERVICE_ROLE_KEY)');
            return new Response(
              JSON.stringify({ error: 'Server configuration error' }),
              { status: 500, headers: corsHeaders }
            );
          }

          const supabase = createClient(supabaseUrl, supabaseKey);

         // small helper to update progress row for this session+source
        const updateProgress = async (updates: Partial<any>) => {
          if (!sessionId || !sourceName) {
            console.warn('No sessionId/sourceName — skipping progress update (internal call?)');
            return;
          }

          try {
            await supabase
              .from('data_population_progress')
              .update({ ...updates, updated_at: new Date().toISOString() })
              .eq('session_id', sessionId)
              .eq('source_name', sourceName);
          } catch (e: any) {
            console.warn('Failed to update/clean progress row:', e);
          }
        };

          // Acquire a simple lock using data_population_progress
          // Strategy:
          // 1) Check for any row with source_name = sourceName AND status = 'running' AND started_at within TTL (e.g., 2 hours)
          // 2) If exists, abort. Otherwise, INSERT a new row with status 'running' for this session.
          // Note: This assumes you do not have multiple concurrent correct runs for the same source.
          const LOCK_TTL_MINUTES = 120; // 2 hours
          try {
            if (!sourceName) {
              return new Response(JSON.stringify({ error: 'missing sourceName' }), { status: 400, headers: corsHeaders });
            }
            // check running rows
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
                const msg = `Another run is already active for ${sourceName} (session ${lockCheck.data.session_id}), started ${ageMin.toFixed(1)} minutes ago. Aborting.`;
                console.warn(msg);
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
                // stale lock — log and continue (we'll insert a new row)
                console.warn('Stale running row detected; continuing to create new run.');
              }
            }

            // insert a new progress row as lock
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

          // main polling logic
        try {
          await updateProgress({ status: 'running', started_at: new Date().toISOString(), records_fetched: 0 });  

            // Determine dynamic startDate (B)
            let startDate = '2019-01-01';
            try {
              const maxRes = await supabase
                .from('instrument')
                .select('max(effective_date)::text as max_date')
                .eq('source', 'federal_register')
                .limit(1)
                .maybeSingle();

              if (!maxRes.error && maxRes.data && maxRes.data.max_date) {
                // Add 1 second to avoid re-fetching the same item if API uses inclusive bounds
                const dt = new Date(maxRes.data.max_date);
                dt.setSeconds(dt.getSeconds() + 1);
                startDate = dt.toISOString().slice(0, 10); // YYYY-MM-DD
                console.info('Using dynamic startDate:', startDate);
              } else {
                console.info('No prior data found; using default startDate:', startDate);
              }
            } catch (e: any) {
              console.warn('Failed to compute dynamic startDate; using default:', e);
            }

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
                  // fetchWithRetries handles timeouts, retries and Retry-After
                  response = await fetchWithRetries(url, { headers }, 3, 500, 5000, 9000);
                } catch (fetchErr: any) {
                  console.error(`Fetch attempts failed for term "${term}" page ${page}:`, fetchErr);
                  // skip this page and continue (do not abort whole run)
                  await updateProgress({ status: 'running', error_message: `fetch_failed_${term}_p${page}` });
                  break;
                }

                if (!response.ok) {
                  console.warn(`API returned ${response.status} for ${term} page ${page}; skipping page.`);
                  // If permanent client error (4xx except 429), skip this page and continue
                  if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                    break;
                  }
                  // Otherwise continue to next term/page (we've already retried in fetchWithRetries)
                  continue;
                }

                let data: any;
                try {
                  data = await response.json();
                } catch (jsonErr: any) {
                  console.error('JSON parse error:', jsonErr);
                  break;
                }

                if (!data.results?.length) {
                  break;
                }

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
                        // on failure, try smaller retry once
                        const retryRes = await supabase.from('instrument').upsert(batch.slice(0, 25), { onConflict: 'external_id' });
                        if (retryRes.error) {
                          console.error('Retry upsert also failed, dropping that batch chunk:', retryRes.error);
                        }
                      }
                    } catch (upsertErr) {
                      console.error('Upsert exception:', upsertErr);
                    } finally {
                      batch.length = 0;
                      await updateProgress({ records_fetched: recordsProcessed });
                    }
                  }
                }

                // Respectful per-page delay — make configurable via env if needed
                const pageDelayMs = Number(Deno.env.get('FEDERAL_POLL_PAGE_DELAY_MS') || '500');
                await new Promise(res => setTimeout(res, pageDelayMs));
              }
            }

            // Final flush
            if (batch.length > 0) {
              try {
                const upsertRes = await supabase.from('instrument').upsert(batch, { onConflict: 'external_id' });
                if (upsertRes.error) {
                  console.error('Final upsert error:', upsertRes.error);
                }
              } catch (upsertErr: any) {
                console.error('Final upsert exception:', upsertErr);
              }
            }

            await updateProgress({
            status: 'completed',
            records_fetched: recordsProcessed,
            completed_at: new Date().toISOString(),
          });

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

          return new Response(
            JSON.stringify({ error: 'Poller failed', details: error.message }),
            { status: 500, headers: corsHeaders }
          );
        }
            // Release lock: mark this session as completed/cleanup if we inserted it
            try {
              if (sessionId && sourceName) {
                // Update any running row for this session to completed/updated
                await supabase
                  .from('data_population_progress')
                  .update({ updated_at: new Date().toISOString() })
                  .eq('session_id', sessionId)
                  .eq('source_name', sourceName);
              }
            } catch (e: any) {
              console.warn('Failed to update/clean progress row:', e);
            }
        });
        const ra = resp.headers.get('Retry-After');
        let waitMs = 0;
        if (ra) {
          const seconds = Number(ra);
          if (!Number.isNaN(seconds)) waitMs = seconds * 1000;
          else {
            // try parse http-date
            const retryDate = Date.parse(ra);
            if (!Number.isNaN(retryDate)) waitMs = Math.max(0, retryDate - Date.now());
          }
        }
        if (waitMs === 0) {
          const backoff = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
          waitMs = backoff + Math.floor(Math.random() * 100); // jitter
        }
        // If this was the last attempt, return response (so the caller can inspect)
        if (attempt === attempts) return resp;
        await new Promise(res => setTimeout(res, waitMs));
        continue;
      }

      // For client errors (4xx except 429) treat as permanent
      return resp;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastErr = err;
      // On abort or network error, retry until attempts exhausted
      if (attempt === attempts) break;
      const backoff = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
      await new Promise(res => setTimeout(res, backoff + Math.floor(Math.random() * 100)));
    }
  }
  throw lastErr || new Error('fetchWithRetries unknown error');
}

//* ---------- Edge Function handler ---------- */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let sessionId: string | null = null;
  let sourceName: string | null = null;

  try {
    const body = await req.json().catch(() => ({})); // Empty object on parse failure
    sessionId = body.sessionId || null;
    sourceName = body.sourceName || 'federal-default'; // Fallback name for internal calls
    console.log('Parsed body:', body); // Debug log
  } catch (e: any) {
    console.warn('Non-JSON or empty body received (ok for internal calls):', e.message);
    // Continue — no early return
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env vars (URL or ANON_KEY)');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: corsHeaders }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

 // small helper to update progress row for this session+source
const updateProgress = async (updates: Partial<any>) => {
  if (!sessionId || !sourceName) {
    console.warn('No sessionId/sourceName — skipping progress update (internal call?)');
    return;
  }

  try {
    await supabase
      .from('data_population_progress')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('source_name', sourceName);
  } catch (e) {
    console.warn('Failed to update/clean progress row:', e);
  }
};

  // Acquire a simple lock using data_population_progress
  // Strategy:
  // 1) Check for any row with source_name = sourceName AND status = 'running' AND started_at within TTL (e.g., 2 hours)
  // 2) If exists, abort. Otherwise, INSERT a new row with status 'running' for this session.
  // Note: This assumes you do not have multiple concurrent correct runs for the same source.
  const LOCK_TTL_MINUTES = 120; // 2 hours
  try {
    if (!sourceName) {
      return new Response(JSON.stringify({ error: 'missing sourceName' }), { status: 400, headers: corsHeaders });
    }
    // check running rows
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
        const msg = `Another run is already active for ${sourceName} (session ${lockCheck.data.session_id}), started ${ageMin.toFixed(1)} minutes ago. Aborting.`;
        console.warn(msg);
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
        // stale lock — log and continue (we'll insert a new row)
        console.warn('Stale running row detected; continuing to create new run.');
      }
    }

    // insert a new progress row as lock
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

  // main polling logic
try {
  await updateProgress({ status: 'running', started_at: new Date().toISOString(), records_fetched: 0 });  

    // Determine dynamic startDate (B)
    let startDate = '2019-01-01';
    try {
      const maxRes = await supabase
        .from('instrument')
        .select('max(effective_date)::text as max_date')
        .eq('source', 'federal_register')
        .limit(1)
        .maybeSingle();

      if (!maxRes.error && maxRes.data && maxRes.data.max_date) {
        // Add 1 second to avoid re-fetching the same item if API uses inclusive bounds
        const dt = new Date(maxRes.data.max_date);
        dt.setSeconds(dt.getSeconds() + 1);
        startDate = dt.toISOString().slice(0, 10); // YYYY-MM-DD
        console.info('Using dynamic startDate:', startDate);
      } else {
        console.info('No prior data found; using default startDate:', startDate);
      }
    } catch (e: any) {
      console.warn('Failed to compute dynamic startDate; using default:', e);
    }

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
          // fetchWithRetries handles timeouts, retries and Retry-After
          response = await fetchWithRetries(url, { headers }, 3, 500, 5000, 9000);
        } catch (fetchErr: any) {
          console.error(`Fetch attempts failed for term "${term}" page ${page}:`, fetchErr);
          // skip this page and continue (do not abort whole run)
          await updateProgress({ status: 'running', error_message: `fetch_failed_${term}_p${page}` });
          break;
        }

        if (!response.ok) {
          console.warn(`API returned ${response.status} for ${term} page ${page}; skipping page.`);
          // If permanent client error (4xx except 429), skip this page and continue
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            break;
          }
          // Otherwise continue to next term/page (we've already retried in fetchWithRetries)
          continue;
        }

        let data: any;
        try {
          data = await response.json();
        } catch (jsonErr: any) {
          console.error('JSON parse error:', jsonErr);
          break;
        }

        if (!data.results?.length) {
          break;
        }

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
                // on failure, try smaller retry once
                const retryRes = await supabase.from('instrument').upsert(batch.slice(0, 25), { onConflict: 'external_id' });
                if (retryRes.error) {
                  console.error('Retry upsert also failed, dropping that batch chunk:', retryRes.error);
                }
              }
            } catch (upsertErr) {
              console.error('Upsert exception:', upsertErr);
            } finally {
              batch.length = 0;
              await updateProgress({ records_fetched: recordsProcessed });
            }
          }
        }

        // Respectful per-page delay — make configurable via env if needed
        const pageDelayMs = Number(Deno.env.get('FEDERAL_POLL_PAGE_DELAY_MS') || '500');
        await new Promise(res => setTimeout(res, pageDelayMs));
      }
    }

    // Final flush
    if (batch.length > 0) {
      try {
        const upsertRes = await supabase.from('instrument').upsert(batch, { onConflict: 'external_id' });
        if (upsertRes.error) {
          console.error('Final upsert error:', upsertRes.error);
        }
      } catch (upsertErr: any) {
      console.error('Final upsert exception:', upsertErr);
      }
    }

    await updateProgress({
    status: 'completed',
    records_fetched: recordsProcessed,
    completed_at: new Date().toISOString(),
  });

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

  return new Response(
    JSON.stringify({ error: 'Poller failed', details: error.message }),
    { status: 500, headers: corsHeaders }
  );
}
    // Release lock: mark this session as completed/cleanup if we inserted it
    try {
      if (sessionId && sourceName) {
        // Update any running row for this session to completed/updated
        await supabase
          .from('data_population_progress')
          .update({ updated_at: new Date().toISOString() })
          .eq('session_id', sessionId)
          .eq('source_name', sourceName);
      }
    } catch (e) {
      console.warn('Failed to update/clean progress row:', e);
    }
  }
);