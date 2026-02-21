/**
 * CourtListener Caselaw Poller
 * 
 * Polls the CourtListener Search API (v4) for case law opinions related to
 * cannabis, hemp, kratom, kava, nicotine, and psychedelics regulation.
 * 
 * API docs: https://www.courtlistener.com/help/api/rest/search/
 * 
 * Environment variables:
 *   - COURTLISTENER_API_TOKEN: CourtListener auth token (required for 5,000 req/hr)
 *   - SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY: standard Supabase env vars
 */

import { buildCors, corsHeaders } from '../_shared/cors.ts';
export { corsHeaders };

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// ── Search terms mapped to product categories ────────────────────────────────
const SEARCH_QUERIES: { query: string; products: string[] }[] = [
  { query: 'cannabis regulation', products: ['cannabis'] },
  { query: 'marijuana legalization', products: ['cannabis'] },
  { query: 'hemp regulation', products: ['hemp'] },
  { query: 'CBD cannabidiol', products: ['hemp', 'cannabis'] },
  { query: 'THC delta-8', products: ['cannabis', 'delta-8'] },
  { query: 'kratom ban', products: ['kratom'] },
  { query: 'kratom regulation', products: ['kratom'] },
  { query: 'kava regulation', products: ['kava'] },
  { query: 'psilocybin mushroom', products: ['psychedelics'] },
  { query: 'psychedelic therapy', products: ['psychedelics'] },
  { query: 'nicotine vaping regulation', products: ['nicotine'] },
  { query: 'tobacco regulation', products: ['nicotine'] },
  { query: 'controlled substance scheduling', products: ['cannabis', 'kratom', 'psychedelics'] },
];

// ── Relevance filter ─────────────────────────────────────────────────────────
const INCLUDE_KEYWORDS = [
  'cannabis', 'marijuana', 'hemp', 'cbd', 'thc', 'delta-8', 'delta-9',
  'kratom', 'mitragynine', 'kava', 'nicotine', 'tobacco', 'vaping', 'e-cigarette',
  'psilocybin', 'psychedelic', 'mushroom', 'mdma', 'controlled substance',
  'drug scheduling', 'dea', 'fda', 'usda',
];

const EXCLUDE_KEYWORDS = [
  'murder', 'assault', 'robbery', 'burglary', 'theft', 'kidnapping',
  'child custody', 'divorce', 'immigration', 'deportation',
];

function isRelevantCase(caseName: string, snippet: string): boolean {
  const text = `${caseName} ${snippet}`.toLowerCase();
  if (EXCLUDE_KEYWORDS.some(k => text.includes(k) && !INCLUDE_KEYWORDS.some(ik => text.includes(ik)))) {
    return false;
  }
  return INCLUDE_KEYWORDS.some(k => text.includes(k));
}

// ── Infer products from case text ────────────────────────────────────────────
function inferProducts(text: string, defaults: string[]): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>(defaults);

  const mapping: Record<string, string[]> = {
    cannabis: ['cannabis', 'marijuana', 'weed', 'marihuana'],
    hemp: ['hemp', 'cbd', 'cannabidiol', 'industrial hemp'],
    'delta-8': ['delta-8', 'delta 8', 'delta-8-thc'],
    kratom: ['kratom', 'mitragynine', 'mitragyna'],
    kava: ['kava', 'kavain', 'kavalactone'],
    nicotine: ['nicotine', 'tobacco', 'vaping', 'e-cigarette', 'vape', 'juul'],
    psychedelics: ['psilocybin', 'psychedelic', 'mushroom', 'mdma', 'ketamine', 'lsd', 'ayahuasca', 'ibogaine', 'mescaline'],
  };

  for (const [product, keywords] of Object.entries(mapping)) {
    if (keywords.some(k => lower.includes(k))) {
      found.add(product);
    }
  }

  return Array.from(found);
}

// ── Fetch helper with retry ──────────────────────────────────────────────────
async function fetchWithRetry(
  url: string,
  headers: HeadersInit,
  attempts = 3,
  delayMs = 1000,
): Promise<Response> {
  let lastErr: any;
  for (let i = 1; i <= attempts; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const resp = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeout);

      if (resp.ok) return resp;

      if (resp.status === 429) {
        const retryAfter = parseInt(resp.headers.get('Retry-After') || '10', 10);
        console.warn(`Rate limited (429). Waiting ${retryAfter}s...`);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }
      if (resp.status >= 500) {
        console.warn(`Server error ${resp.status}, attempt ${i}/${attempts}`);
        await new Promise(r => setTimeout(r, delayMs * i));
        continue;
      }

      // 4xx (non-429): don't retry
      lastErr = new Error(`HTTP ${resp.status}: ${await resp.text()}`);
      break;
    } catch (err: any) {
      lastErr = err;
      if (i < attempts) {
        await new Promise(r => setTimeout(r, delayMs * i));
      }
    }
  }
  throw lastErr;
}

// ── Deno.serve handler ───────────────────────────────────────────────────────
// @ts-ignore Deno global
Deno.serve(async (req: Request) => {
  const corsHeaders = buildCors(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // @ts-ignore Deno global
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  // @ts-ignore Deno global
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  // @ts-ignore Deno global
  const courtListenerToken = Deno.env.get('COURTLISTENER_API_TOKEN') || '';
  if (!courtListenerToken) {
    console.warn('⚠️ COURTLISTENER_API_TOKEN not set — running as anonymous with stricter rate limits');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const apiHeaders: HeadersInit = {
    Accept: 'application/json',
    ...(courtListenerToken ? { Authorization: `Token ${courtListenerToken}` } : {}),
  };

  let totalFetched = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  const errors: string[] = [];
  const batch: Map<string, any> = new Map(); // keyed by external_id to avoid duplicates

  // Determine the most recent caselaw date we have
  let sinceDate = '2018-01-01';
  try {
    const { data: latest } = await supabase
      .from('instrument')
      .select('effective_date')
      .eq('source', 'courtlistener')
      .order('effective_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest?.effective_date) {
      // Add 30-day lookback to catch retroactively-indexed cases
      const d = new Date(latest.effective_date);
      d.setDate(d.getDate() - 30);
      sinceDate = d.toISOString().split('T')[0];
      console.log(`📅 Incremental poll from: ${sinceDate} (30-day lookback)`);
    } else {
      console.log(`📅 First run — fetching from: ${sinceDate}`);
    }
  } catch (e) {
    console.warn('Could not determine last poll date, using default:', e);
  }

  // Look up the "Federal" jurisdiction ID for caselaw (or fall back)
  let federalJurisdictionId = '00000000-0000-0000-0000-000000000001';
  try {
    const { data: fedJ } = await supabase
      .from('jurisdiction')
      .select('id')
      .eq('slug', 'federal')
      .maybeSingle();
    if (fedJ?.id) federalJurisdictionId = fedJ.id;
  } catch (_) { /* use default */ }

  // ── Poll each search query ───────────────────────────────────────────────
  for (const { query, products } of SEARCH_QUERIES) {
    console.log(`🔍 Searching CourtListener: "${query}"`);

    // Fetch only 1 page per query (v4 API uses cursor-based pagination,
    // the page=N param is silently ignored, so extra pages would be duplicates)
    {
      const params = new URLSearchParams({
        q: query,
        type: 'o',                           // opinions
        order_by: 'dateFiled desc',
        filed_after: sinceDate,
        highlight: 'on',
      });

      const url = `https://www.courtlistener.com/api/rest/v4/search/?${params}`;

      let data: any;
      try {
        const resp = await fetchWithRetry(url, apiHeaders);
        data = await resp.json();
      } catch (err: any) {
        const msg = `Failed to fetch "${query}" page ${page}: ${err.message}`;
        console.error(msg);
        errors.push(msg);
        break;
      }

      const results = data?.results;
      if (!results || results.length === 0) break;

      for (const result of results) {
        totalFetched++;

        const caseName = result.caseName || result.caseNameFull || 'Untitled';
        const snippet = result.opinions?.[0]?.snippet || '';
        const dateFiled = result.dateFiled || null;
        const court = result.court || '';
        const courtId = result.court_id || '';
        const absoluteUrl = result.absolute_url || '';
        const docketNumber = result.docketNumber || '';
        const clusterId = result.cluster_id ? String(result.cluster_id) : null;
        const status = result.status || '';

        if (!isRelevantCase(caseName, snippet)) {
          totalSkipped++;
          continue;
        }

        // Try to match a jurisdiction by court name → state name
        let jurisdictionId = federalJurisdictionId;
        if (courtId && !courtId.startsWith('scotus') && !courtId.startsWith('ca')) {
          // State courts often have state abbreviations
          try {
            const { data: stateJ } = await supabase
              .from('jurisdiction')
              .select('id')
              .eq('type', 'state')
              .ilike('name', `%${court.split(' ')[0]}%`)
              .maybeSingle();
            if (stateJ?.id) jurisdictionId = stateJ.id;
          } catch (_) { /* keep federal default */ }
        }

        const detectedProducts = inferProducts(`${caseName} ${snippet}`, products);
        const fullUrl = absoluteUrl
          ? `https://www.courtlistener.com${absoluteUrl}`
          : `https://www.courtlistener.com/?q=${encodeURIComponent(query)}&type=o`;

        // Infer category from detected products
        const primaryProduct = detectedProducts[0] || products[0] || 'cannabis';
        const categoryMap: Record<string, string> = {
          'cannabis': 'cannabis', 'hemp': 'hemp', 'delta-8': 'cannabis',
          'kratom': 'kratom', 'kava': 'kava', 'nicotine': 'nicotine',
          'psychedelics': 'psychedelics'
        };
        const category = categoryMap[primaryProduct] || 'cannabis';

        const externalId = `courtlistener-${clusterId || docketNumber || `${caseName}-${dateFiled}`}`;
        batch.set(externalId, {
          external_id: externalId,
          title: caseName.length > 500 ? caseName.slice(0, 497) + '...' : caseName,
          description: snippet.replace(/<[^>]*>/g, '').slice(0, 2000),
          effective_date: dateFiled,
          jurisdiction_id: jurisdictionId,
          source: 'courtlistener',
          url: fullUrl,
          category,
          sub_category: 'caselaw',
          metadata: {
            document_type: 'caselaw',
            court,
            court_id: courtId,
            docket_number: docketNumber,
            cluster_id: clusterId,
            status,
            products: detectedProducts,
            search_query: query,
          },
        });

        // Flush in batches of 15 (smaller batches to commit data before potential timeout)
        if (batch.size >= 15) {
          const batchArray = Array.from(batch.values());
          try {
            const { error: upsertError } = await supabase
              .from('instrument')
              .upsert(batchArray, { onConflict: 'external_id' });
            if (upsertError) {
              console.error('Upsert error:', upsertError);
              errors.push(`Upsert batch error: ${upsertError.message}`);
            } else {
              totalInserted += batchArray.length;
            }
          } catch (err: any) {
            console.error('Upsert exception:', err);
            errors.push(`Upsert exception: ${err.message}`);
          } finally {
            batch.clear();
          }
        }
      }
    }

    // Flush after each query to ensure data is saved incrementally
    if (batch.size > 0) {
      const batchArray = Array.from(batch.values());
      try {
        const { error: upsertError } = await supabase
          .from('instrument')
          .upsert(batchArray, { onConflict: 'external_id' });
        if (upsertError) {
          errors.push(`Query batch error: ${upsertError.message}`);
        } else {
          totalInserted += batchArray.length;
        }
      } catch (err: any) {
        errors.push(`Query batch exception: ${err.message}`);
      } finally {
        batch.clear();
      }
    }

    // Rate-limit courtesy: 1s between search queries (reduced from 2s to stay within timeout)
    await new Promise(r => setTimeout(r, 1000));
  }

  // Final flush
  if (batch.size > 0) {
    const batchArray = Array.from(batch.values());
    try {
      const { error: upsertError } = await supabase
        .from('instrument')
        .upsert(batchArray, { onConflict: 'external_id' });
      if (upsertError) {
        console.error('Final upsert error:', upsertError);
        errors.push(`Final upsert error: ${upsertError.message}`);
      } else {
        totalInserted += batchArray.length;
      }
    } catch (err: any) {
      errors.push(`Final upsert exception: ${err.message}`);
    }
  }

  const summary = {
    success: errors.length === 0,
    totalFetched,
    totalInserted,
    totalSkipped,
    errors: errors.length > 0 ? errors : undefined,
    polledAt: new Date().toISOString(),
  };

  console.log('✅ Caselaw poller complete:', JSON.stringify(summary));

  return new Response(JSON.stringify(summary), {
    status: errors.length > 0 ? 207 : 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
