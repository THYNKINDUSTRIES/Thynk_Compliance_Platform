/**
 * Congress.gov Poller
 *
 * Polls the Congress.gov API (api.data.gov) for federal bills related to
 * cannabis, hemp, kratom, kava, nicotine, and psychedelics.
 *
 * API docs: https://api.congress.gov/
 * Key signup: https://api.congress.gov/sign-up/
 *
 * Environment variables:
 *   - CONGRESS_API_KEY: api.data.gov API key
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

// ── Search subjects for bill lookup ──────────────────────────────────────────
// Congress.gov doesn't have free-text bill search via REST, so we use the
// subject-based filtering on the summaries endpoint and bill listing.
const BILL_SUBJECTS = [
  { keyword: 'cannabis', products: ['cannabis'] },
  { keyword: 'marijuana', products: ['cannabis'] },
  { keyword: 'hemp', products: ['hemp'] },
  { keyword: 'kratom', products: ['kratom'] },
  { keyword: 'tobacco', products: ['nicotine'] },
  { keyword: 'nicotine', products: ['nicotine'] },
  { keyword: 'vaping', products: ['nicotine'] },
  { keyword: 'psilocybin', products: ['psychedelics'] },
  { keyword: 'psychedelic', products: ['psychedelics'] },
  { keyword: 'controlled substance', products: ['cannabis', 'kratom', 'psychedelics'] },
  { keyword: 'drug scheduling', products: ['cannabis', 'kratom', 'psychedelics'] },
];

// Current congress number (119th Congress: 2025-2027)
const CURRENT_CONGRESS = 119;

// ── Product inference ────────────────────────────────────────────────────────
function inferProducts(text: string, defaults: string[]): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>(defaults);
  const mapping: Record<string, string[]> = {
    cannabis: ['cannabis', 'marijuana', 'marihuana', 'weed'],
    hemp: ['hemp', 'cbd', 'cannabidiol'],
    'delta-8': ['delta-8', 'delta 8'],
    kratom: ['kratom', 'mitragynine'],
    kava: ['kava', 'kavain'],
    nicotine: ['nicotine', 'tobacco', 'vaping', 'e-cigarette', 'vape'],
    psychedelics: ['psilocybin', 'psychedelic', 'mushroom', 'mdma', 'ketamine'],
  };
  for (const [product, keywords] of Object.entries(mapping)) {
    if (keywords.some(k => lower.includes(k))) found.add(product);
  }
  return Array.from(found);
}

// ── Fetch helper ─────────────────────────────────────────────────────────────
async function fetchJSON(url: string): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) {
      if (resp.status === 429) {
        console.warn(`Rate limited on ${url}`);
        await new Promise(r => setTimeout(r, 5000));
        return null;
      }
      console.warn(`HTTP ${resp.status} for ${url}`);
      return null;
    }
    return await resp.json();
  } catch (err: any) {
    clearTimeout(timeout);
    console.error(`Fetch error: ${err.message}`);
    return null;
  }
}

// ── Relevance filter ─────────────────────────────────────────────────────────
const INCLUDE_KEYWORDS = [
  'cannabis', 'marijuana', 'hemp', 'cbd', 'thc', 'delta-8',
  'kratom', 'kava', 'nicotine', 'tobacco', 'vaping', 'e-cigarette',
  'psilocybin', 'psychedelic', 'controlled substance', 'drug scheduling',
  'schedule i', 'schedule ii', 'dea', 'fda',
];

function isRelevantBill(title: string): boolean {
  const lower = title.toLowerCase();
  return INCLUDE_KEYWORDS.some(k => lower.includes(k));
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
  const congressApiKey = Deno.env.get('CONGRESS_API_KEY') || '';

  if (!congressApiKey) {
    return new Response(JSON.stringify({
      success: false,
      error: 'No CONGRESS_API_KEY configured. Sign up at https://api.congress.gov/sign-up/',
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const baseUrl = 'https://api.congress.gov/v3';

  let totalFetched = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  const errors: string[] = [];
  const batch: Map<string, any> = new Map();

  // Get federal jurisdiction ID
  let federalJurisdictionId = '00000000-0000-0000-0000-000000000001';
  try {
    const { data: fedJ } = await supabase
      .from('jurisdiction')
      .select('id')
      .eq('slug', 'federal')
      .maybeSingle();
    if (fedJ?.id) federalJurisdictionId = fedJ.id;
  } catch (_) { /* use default */ }

  // ── Poll recent bills for each bill type ─────────────────────────────────
  const billTypes = ['hr', 's', 'hjres', 'sjres'];

  for (const billType of billTypes) {
    console.log(`🏛️ Fetching ${billType.toUpperCase()} bills from ${CURRENT_CONGRESS}th Congress...`);

    // Fetch first 2 pages (250 per page by default, we use limit=100)
    for (let offset = 0; offset < 200; offset += 100) {
      const url = `${baseUrl}/bill/${CURRENT_CONGRESS}/${billType}?api_key=${congressApiKey}&format=json&limit=100&offset=${offset}&sort=updateDate+desc`;
      const data = await fetchJSON(url);
      if (!data?.bills || data.bills.length === 0) break;

      for (const bill of data.bills) {
        totalFetched++;
        const title = bill.title || '';
        const billNumber = bill.number ? `${billType.toUpperCase()} ${bill.number}` : '';
        const latestActionDate = bill.latestAction?.actionDate || null;
        const latestActionText = bill.latestAction?.text || '';
        const updateDate = bill.updateDate || latestActionDate;
        const congressUrl = bill.url
          ? bill.url.replace('api.congress.gov/v3', 'congress.gov')
          : `https://www.congress.gov/bill/${CURRENT_CONGRESS}th-congress/${billType === 'hr' ? 'house-bill' : billType === 's' ? 'senate-bill' : billType}/${bill.number}`;

        if (!isRelevantBill(title)) {
          totalSkipped++;
          continue;
        }

        const detectedProducts = inferProducts(title, []);
        const externalId = `congress-${CURRENT_CONGRESS}-${billType}-${bill.number}`;

        batch.set(externalId, {
          external_id: externalId,
          title: `${billNumber}: ${title}`.slice(0, 500),
          description: `${latestActionText} (Congress ${CURRENT_CONGRESS}, ${billType.toUpperCase()})`.slice(0, 2000),
          effective_date: latestActionDate || updateDate,
          jurisdiction_id: federalJurisdictionId,
          source: 'congress_gov',
          url: congressUrl,
          metadata: {
            document_type: 'legislation',
            bill_type: billType,
            bill_number: bill.number,
            congress: CURRENT_CONGRESS,
            latest_action: latestActionText,
            latest_action_date: latestActionDate,
            update_date: updateDate,
            products: detectedProducts,
            origin_chamber: bill.originChamber || null,
            policy_area: bill.policyArea?.name || null,
          },
        });
      }

      // Rate courtesy: 1s between pages
      await new Promise(r => setTimeout(r, 1000));
    }

    // Rate courtesy: 1.5s between bill types
    await new Promise(r => setTimeout(r, 1500));
  }

  // ── Also check the summaries endpoint for recent summaries ────────────────
  console.log('📋 Checking recent bill summaries...');
  const summariesUrl = `${baseUrl}/summaries/${CURRENT_CONGRESS}?api_key=${congressApiKey}&format=json&limit=50&sort=updateDate+desc`;
  const summariesData = await fetchJSON(summariesUrl);
  if (summariesData?.summaries) {
    for (const summary of summariesData.summaries) {
      totalFetched++;
      const title = summary.bill?.title || summary.text || '';
      const billType = summary.bill?.type?.toLowerCase() || '';
      const billNumber = summary.bill?.number || '';

      if (!isRelevantBill(title) && !isRelevantBill(summary.text || '')) {
        totalSkipped++;
        continue;
      }

      const externalId = `congress-${summary.bill?.congress || CURRENT_CONGRESS}-${billType}-${billNumber}`;
      if (batch.has(externalId)) continue; // Already have from bills endpoint

      const detectedProducts = inferProducts(`${title} ${summary.text || ''}`, []);
      const congressUrl = `https://www.congress.gov/bill/${summary.bill?.congress || CURRENT_CONGRESS}th-congress/${billType === 'hr' ? 'house-bill' : billType === 's' ? 'senate-bill' : billType}/${billNumber}`;

      batch.set(externalId, {
        external_id: externalId,
        title: `${billType.toUpperCase()} ${billNumber}: ${title}`.slice(0, 500),
        description: (summary.text || '').replace(/<[^>]*>/g, '').slice(0, 2000),
        effective_date: summary.updateDate || summary.actionDate || null,
        jurisdiction_id: federalJurisdictionId,
        source: 'congress_gov',
        url: congressUrl,
        metadata: {
          document_type: 'legislation',
          bill_type: billType,
          bill_number: billNumber,
          congress: summary.bill?.congress || CURRENT_CONGRESS,
          products: detectedProducts,
          summary_version: summary.versionCode || null,
          action_date: summary.actionDate || null,
        },
      });
    }
  }

  // ── Flush all records ──────────────────────────────────────────────────────
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

  const summary = {
    success: errors.length === 0,
    totalFetched,
    totalInserted,
    totalSkipped,
    uniqueRecords: allRecords.length,
    congress: CURRENT_CONGRESS,
    errors: errors.length > 0 ? errors : undefined,
    polledAt: new Date().toISOString(),
  };

  console.log('✅ Congress poller complete:', JSON.stringify(summary));

  return new Response(JSON.stringify(summary), {
    status: errors.length > 0 ? 207 : 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
