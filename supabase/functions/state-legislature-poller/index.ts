/**
 * State Legislature Poller
 *
 * Polls OpenStates (Plural) API v3 and LegiScan API for state-level bills
 * related to cannabis, hemp, kratom, kava, nicotine, and psychedelics.
 *
 * Environment variables:
 *   - OPENSTATES_API_KEY: OpenStates / Plural API key (500 req/day)
 *   - LEGISCAN_API_KEY: LegiScan API key (30,000 req/month)
 *   - SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY: standard Supabase env vars
 */

const ALLOWED_ORIGINS = [
  'https://thynkflow.io',
  'https://www.thynkflow.io',
  'https://thynk-compliance-platform-77nsei26a.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];
function buildCors(req?: Request) {
  const origin = req?.headers?.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}
export const corsHeaders = buildCors();

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// ── Search queries ───────────────────────────────────────────────────────────
const SEARCH_TERMS = [
  { query: 'cannabis OR marijuana', products: ['cannabis'] },
  { query: 'hemp OR CBD OR cannabidiol', products: ['hemp'] },
  { query: 'kratom', products: ['kratom'] },
  { query: 'kava', products: ['kava'] },
  { query: 'psilocybin OR psychedelic', products: ['psychedelics'] },
  { query: 'nicotine OR vaping OR tobacco', products: ['nicotine'] },
  { query: 'delta-8 OR delta-9 OR THC', products: ['cannabis', 'delta-8'] },
  { query: 'controlled substance scheduling', products: ['cannabis', 'kratom', 'psychedelics'] },
];

// ── State name → abbreviation map ────────────────────────────────────────────
const STATE_ABBREV: Record<string, string> = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA',
  'Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA',
  'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS',
  'Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD','Massachusetts':'MA',
  'Michigan':'MI','Minnesota':'MN','Mississippi':'MS','Missouri':'MO','Montana':'MT',
  'Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ',
  'New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND',
  'Ohio':'OH','Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI',
  'South Carolina':'SC','South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT',
  'Vermont':'VT','Virginia':'VA','Washington':'WA','West Virginia':'WV',
  'Wisconsin':'WI','Wyoming':'WY',
};

// ── Product inference ────────────────────────────────────────────────────────
function inferProducts(text: string, defaults: string[]): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>(defaults);
  const mapping: Record<string, string[]> = {
    cannabis: ['cannabis', 'marijuana', 'marihuana', 'weed'],
    hemp: ['hemp', 'cbd', 'cannabidiol', 'industrial hemp'],
    'delta-8': ['delta-8', 'delta 8', 'delta-8-thc'],
    kratom: ['kratom', 'mitragynine', 'mitragyna'],
    kava: ['kava', 'kavain', 'kavalactone'],
    nicotine: ['nicotine', 'tobacco', 'vaping', 'e-cigarette', 'vape', 'juul'],
    psychedelics: ['psilocybin', 'psychedelic', 'mushroom', 'mdma', 'ketamine', 'lsd', 'ayahuasca', 'ibogaine'],
  };
  for (const [product, keywords] of Object.entries(mapping)) {
    if (keywords.some(k => lower.includes(k))) found.add(product);
  }
  return Array.from(found);
}

// ── Fetch helper ─────────────────────────────────────────────────────────────
async function fetchJSON(url: string, headers: HeadersInit = {}): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const resp = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) {
      if (resp.status === 429) {
        console.warn(`Rate limited on ${url}`);
        return null;
      }
      console.warn(`HTTP ${resp.status} for ${url}`);
      return null;
    }
    return await resp.json();
  } catch (err: any) {
    clearTimeout(timeout);
    console.error(`Fetch error for ${url}: ${err.message}`);
    return null;
  }
}

// @ts-ignore Deno global
Deno.serve(async (req: Request) => {
  const corsHeaders = buildCors(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // @ts-ignore
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  // @ts-ignore
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  // @ts-ignore
  const openStatesKey = Deno.env.get('OPENSTATES_API_KEY') || '';
  // @ts-ignore
  const legiScanKey = Deno.env.get('LEGISCAN_API_KEY') || '';

  const supabase = createClient(supabaseUrl, supabaseKey);

  let totalFetched = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  const errors: string[] = [];
  const batch: Map<string, any> = new Map();
  const billsBatch: Map<string, any> = new Map();

  // ── Build jurisdiction lookup ────────────────────────────────────────────
  const jurisdictionMap: Record<string, string> = {};
  let federalId = '00000000-0000-0000-0000-000000000001';
  try {
    const { data: jurisdictions } = await supabase
      .from('jurisdiction')
      .select('id, name, slug');
    for (const j of jurisdictions || []) {
      jurisdictionMap[j.name.toLowerCase()] = j.id;
      jurisdictionMap[j.slug] = j.id;
      if (j.slug === 'federal') federalId = j.id;
    }
  } catch (_) { /* use defaults */ }

  function resolveJurisdiction(stateName: string): string {
    const lower = stateName.toLowerCase();
    if (jurisdictionMap[lower]) return jurisdictionMap[lower];
    const abbrev = STATE_ABBREV[stateName] || stateName;
    if (jurisdictionMap[abbrev.toLowerCase()]) return jurisdictionMap[abbrev.toLowerCase()];
    return federalId;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 1: OpenStates API v3
  // ═══════════════════════════════════════════════════════════════════════════
  if (openStatesKey) {
    console.log('📜 Polling OpenStates API...');
    const osHeaders = { 'X-API-Key': openStatesKey, Accept: 'application/json' };

    for (const { query, products } of SEARCH_TERMS) {
      const url = `https://v3.openstates.org/bills?q=${encodeURIComponent(query)}&sort=updated_desc&per_page=20&include=abstracts,actions`;
      const data = await fetchJSON(url, osHeaders);
      if (!data?.results) continue;

      for (const bill of data.results) {
        totalFetched++;
        const title = bill.title || '';
        const identifier = bill.identifier || '';
        const session = bill.session || '';
        const jurisdictionName = bill.jurisdiction?.name || '';
        const updatedAt = bill.updated_at || bill.latest_action_date || null;
        const abstract = bill.abstracts?.[0]?.abstract || '';
        const openstatesUrl = bill.openstates_url || `https://openstates.org/${bill.jurisdiction?.classification === 'state' ? bill.jurisdiction?.name?.toLowerCase().replace(/\s+/g, '-') : 'us'}/bills/${session}/${identifier}/`;

        const detectedProducts = inferProducts(`${title} ${abstract}`, products);
        const externalId = `openstates-${bill.id || `${jurisdictionName}-${identifier}-${session}`}`;
        const jurisdictionId = resolveJurisdiction(jurisdictionName);

        batch.set(externalId, {
          external_id: externalId,
          title: `${identifier}: ${title}`.slice(0, 500),
          description: (abstract || `${jurisdictionName} bill ${identifier} — ${title}`).slice(0, 2000),
          effective_date: updatedAt,
          jurisdiction_id: jurisdictionId,
          source: 'openstates',
          url: openstatesUrl,
          metadata: {
            document_type: 'legislation',
            bill_id: identifier,
            session,
            jurisdiction: jurisdictionName,
            status: bill.latest_action_description || '',
            products: detectedProducts,
            latest_action_date: bill.latest_action_date,
          },
        });

        // Also build legislature_bills record with richer schema
        const stateCode = STATE_ABBREV[jurisdictionName] || jurisdictionName.slice(0, 2).toUpperCase();
        const actions = (bill.actions || []) as any[];
        const latestAction = actions.length > 0 ? actions[actions.length - 1] : null;
        const chamberVal = bill.from_organization?.classification || bill.chamber || '';

        billsBatch.set(externalId, {
          external_id: externalId,
          bill_number: identifier,
          title: title.slice(0, 500),
          description: (abstract || '').slice(0, 2000) || null,
          state_code: stateCode,
          session: session,
          session_year: parseInt(session) || new Date().getFullYear(),
          status: bill.latest_action_description?.toLowerCase().includes('pass') ? 'passed'
            : bill.latest_action_description?.toLowerCase().includes('fail') ? 'failed'
            : bill.latest_action_description?.toLowerCase().includes('engross') ? 'engrossed'
            : bill.latest_action_description?.toLowerCase().includes('enroll') ? 'enrolled'
            : bill.latest_action_description?.toLowerCase().includes('veto') ? 'vetoed'
            : bill.latest_action_description?.toLowerCase().includes('refer') ? 'refer'
            : 'introduced',
          status_date: bill.latest_action_date || updatedAt,
          last_action: bill.latest_action_description || null,
          last_action_date: bill.latest_action_date || null,
          chamber: chamberVal.toLowerCase() || null,
          bill_type: bill.classification?.[0] || 'bill',
          sponsors: (bill.sponsorships || []).filter((s: any) => s.primary).map((s: any) => ({
            name: s.name, party: s.party || null, role: s.classification || 'sponsor',
          })),
          cosponsors: (bill.sponsorships || []).filter((s: any) => !s.primary).map((s: any) => ({
            name: s.name, party: s.party || null, role: 'cosponsor',
          })),
          subjects: bill.subject || [],
          votes: [],
          history: actions.map((a: any) => ({
            date: a.date, action: a.description, chamber: a.organization?.classification || null,
            importance: a.classification?.includes('passage') ? 3 : a.classification?.includes('committee') ? 2 : 1,
          })),
          amendments: [],
          source: 'openstates',
          source_url: openstatesUrl,
          full_text_url: bill.sources?.[0]?.url || null,
          is_cannabis_related: true,
          cannabis_keywords: detectedProducts,
          metadata: { openstates_id: bill.id, products: detectedProducts },
        });
      }

      // Rate-limit: ~500/day = be gentle
      await new Promise(r => setTimeout(r, 1500));
    }
  } else {
    console.log('⚠️ No OPENSTATES_API_KEY — skipping OpenStates');
    errors.push('No OPENSTATES_API_KEY configured');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 2: LegiScan API
  // ═══════════════════════════════════════════════════════════════════════════
  if (legiScanKey) {
    console.log('📜 Polling LegiScan API...');
    const searchTerms = [
      'cannabis', 'marijuana', 'hemp', 'kratom',
      'psilocybin', 'nicotine vaping', 'controlled substance',
    ];

    for (const term of searchTerms) {
      for (let page = 1; page <= 2; page++) {
        const url = `https://api.legiscan.com/?key=${legiScanKey}&op=getSearch&query=${encodeURIComponent(term)}&state=ALL&page=${page}`;
        const data = await fetchJSON(url);
        if (!data || data.status !== 'OK' || !data.searchresult) break;

        const results = Object.values(data.searchresult).filter(
          (item: any) => typeof item === 'object' && item.bill_id
        ) as any[];

        if (results.length === 0) break;

        for (const bill of results) {
          totalFetched++;
          const title = bill.title || '';
          const billNumber = bill.bill_number || '';
          const state = bill.state || '';
          const lastAction = bill.last_action || '';
          const lastActionDate = bill.last_action_date || null;
          const legiScanUrl = bill.url || `https://legiscan.com/bill/${bill.bill_id}`;

          const stateName = Object.entries(STATE_ABBREV).find(([, v]) => v === state)?.[0] || state;
          const detectedProducts = inferProducts(`${title} ${lastAction}`, []);
          if (detectedProducts.length === 0) {
            totalSkipped++;
            continue;
          }

          const externalId = `legiscan-${bill.bill_id || `${state}-${billNumber}`}`;
          const jurisdictionId = resolveJurisdiction(stateName);

          batch.set(externalId, {
            external_id: externalId,
            title: `[${state}] ${billNumber}: ${title}`.slice(0, 500),
            description: `${lastAction} (${lastActionDate || 'Date unknown'})`.slice(0, 2000),
            effective_date: lastActionDate,
            jurisdiction_id: jurisdictionId,
            source: 'legiscan',
            url: legiScanUrl,
            metadata: {
              document_type: 'legislation',
              bill_id: bill.bill_id,
              bill_number: billNumber,
              state,
              status: bill.status_desc || lastAction,
              products: detectedProducts,
              last_action: lastAction,
              last_action_date: lastActionDate,
              relevance: bill.relevance,
            },
          });

          // Also build legislature_bills record with richer schema
          const sessionYear = bill.session?.session_id
            ? parseInt(bill.session?.session_name) || new Date().getFullYear()
            : new Date().getFullYear();

          billsBatch.set(externalId, {
            external_id: externalId,
            bill_number: billNumber,
            title: title.slice(0, 500),
            description: (bill.description || lastAction || '').slice(0, 2000) || null,
            state_code: state,
            session: bill.session?.session_name || `${sessionYear}`,
            session_year: sessionYear,
            status: bill.status_desc?.toLowerCase().includes('pass') ? 'passed'
              : bill.status_desc?.toLowerCase().includes('fail') ? 'failed'
              : bill.status_desc?.toLowerCase().includes('engross') ? 'engrossed'
              : bill.status_desc?.toLowerCase().includes('enroll') ? 'enrolled'
              : bill.status_desc?.toLowerCase().includes('veto') ? 'vetoed'
              : bill.status_desc?.toLowerCase().includes('refer') ? 'refer'
              : 'introduced',
            status_date: lastActionDate,
            last_action: lastAction || null,
            last_action_date: lastActionDate,
            chamber: bill.bill_type?.toLowerCase().includes('s') ? 'senate' : 'house',
            bill_type: bill.bill_type_id === 1 ? 'bill' : bill.bill_type_id === 2 ? 'resolution' : 'bill',
            sponsors: [],
            cosponsors: [],
            subjects: [],
            votes: [],
            history: [],
            amendments: [],
            source: 'legiscan',
            source_url: legiScanUrl,
            full_text_url: bill.text_url || null,
            is_cannabis_related: true,
            cannabis_keywords: detectedProducts,
            metadata: {
              legiscan_bill_id: bill.bill_id,
              relevance: bill.relevance,
              products: detectedProducts,
              status_desc: bill.status_desc,
            },
          });
        }

        await new Promise(r => setTimeout(r, 500));
      }

      await new Promise(r => setTimeout(r, 1000));
    }
  } else {
    console.log('⚠️ No LEGISCAN_API_KEY — skipping LegiScan');
    errors.push('No LEGISCAN_API_KEY configured');
  }

  // ── Flush instrument batches ────────────────────────────────────────────────
  const allRecords = Array.from(batch.values());
  for (let i = 0; i < allRecords.length; i += 50) {
    const chunk = allRecords.slice(i, i + 50);
    try {
      const { error: upsertError } = await supabase
        .from('instrument')
        .upsert(chunk, { onConflict: 'external_id' });
      if (upsertError) {
        console.error('Upsert error:', upsertError);
        errors.push(`Upsert error: ${upsertError.message}`);
      } else {
        totalInserted += chunk.length;
      }
    } catch (err: any) {
      errors.push(`Upsert exception: ${err.message}`);
    }
  }

  // ── Flush legislature_bills batches ────────────────────────────────────────
  let billsInserted = 0;
  const allBills = Array.from(billsBatch.values());
  for (let i = 0; i < allBills.length; i += 50) {
    const chunk = allBills.slice(i, i + 50);
    try {
      const { error: billError } = await supabase
        .from('legislature_bills')
        .upsert(chunk, { onConflict: 'external_id' });
      if (billError) {
        console.error('Legislature bills upsert error:', billError);
        errors.push(`Legislature bills upsert: ${billError.message}`);
      } else {
        billsInserted += chunk.length;
      }
    } catch (err: any) {
      errors.push(`Legislature bills exception: ${err.message}`);
    }
  }

  const summary = {
    success: errors.filter(e => !e.includes('No ')).length === 0,
    totalFetched,
    totalInserted,
    billsInserted,
    totalSkipped,
    uniqueRecords: allRecords.length,
    uniqueBills: allBills.length,
    sources: {
      openstates: openStatesKey ? 'polled' : 'skipped (no key)',
      legiscan: legiScanKey ? 'polled' : 'skipped (no key)',
    },
    errors: errors.length > 0 ? errors : undefined,
    polledAt: new Date().toISOString(),
  };

  console.log('✅ State legislature poller complete:', JSON.stringify(summary));

  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
