import { buildCors, corsHeaders } from '../_shared/cors.ts';
export { corsHeaders };

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// ── Kava-specific sources ──────────────────────────────────────────────
// Kava is legal in most US states but subject to FDA dietary supplement
// oversight and some state-level age/labeling restrictions.
const STATE_KAVA_SOURCES: Record<string, {
  agency: string;
  agencyName: string;
  rssFeeds: string[];
  newsPages: string[];
  regulationPages: string[];
}> = {
  'FEDERAL': {
    agency: 'https://www.federalregister.gov/',
    agencyName: 'Federal Register / FDA',
    rssFeeds: [],
    newsPages: [
      'https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=kava',
      'https://www.fda.gov/food/dietary-supplements',
      'https://www.fda.gov/news-events/public-health-focus/fda-and-dietary-supplements'
    ],
    regulationPages: []
  },
  // States with known kava activity (bars, regulation discussions, age limits)
  'CA': { agency: 'https://www.cdph.ca.gov/', agencyName: 'California Dept of Public Health', rssFeeds: [], newsPages: ['https://www.cdph.ca.gov/Programs/OPA/Pages/New-Release-List.aspx'], regulationPages: [] },
  'FL': { agency: 'https://www.floridahealth.gov/', agencyName: 'Florida Dept of Health', rssFeeds: [], newsPages: ['https://www.floridahealth.gov/newsroom/'], regulationPages: [] },
  'HI': { agency: 'https://health.hawaii.gov/', agencyName: 'Hawaii Dept of Health', rssFeeds: [], newsPages: ['https://health.hawaii.gov/news/'], regulationPages: [] },
  'NY': { agency: 'https://www.health.ny.gov/', agencyName: 'New York Dept of Health', rssFeeds: [], newsPages: ['https://www.health.ny.gov/press/'], regulationPages: [] },
  'TX': { agency: 'https://www.dshs.texas.gov/', agencyName: 'Texas Dept of State Health Services', rssFeeds: [], newsPages: ['https://www.dshs.texas.gov/news/'], regulationPages: [] },
  'UT': { agency: 'https://health.utah.gov/', agencyName: 'Utah Dept of Health', rssFeeds: [], newsPages: ['https://health.utah.gov/news'], regulationPages: [] },
  'CO': { agency: 'https://cdphe.colorado.gov/', agencyName: 'Colorado Dept of Public Health', rssFeeds: [], newsPages: ['https://cdphe.colorado.gov/press-release'], regulationPages: [] },
  'AZ': { agency: 'https://www.azdhs.gov/', agencyName: 'Arizona Dept of Health Services', rssFeeds: [], newsPages: ['https://www.azdhs.gov/news/'], regulationPages: [] },
  'WA': { agency: 'https://www.doh.wa.gov/', agencyName: 'Washington Dept of Health', rssFeeds: [], newsPages: ['https://www.doh.wa.gov/News'], regulationPages: [] },
  'OR': { agency: 'https://www.oregon.gov/oha/', agencyName: 'Oregon Health Authority', rssFeeds: [], newsPages: ['https://www.oregon.gov/oha/ERD/Pages/news.aspx'], regulationPages: [] },
};

// ── Kava keyword detection ─────────────────────────────────────────────
const KAVA_KEYWORDS = /\b(kava|kava.?kava|kavain|kavalactone|kavalactones|piper.?methysticum|kava.?bar|kava.?root|kava.?drink|kava.?supplement|kava.?tea|kava.?extract)\b/i;
const KAVA_CONTEXT_KEYWORDS = /\b(dietary.?supplement|herbal.?supplement|botanical|adaptogen|anxiolytic|gaba|liver.?damage|hepatotoxic|food.?safety)\b/i;

// ── Helpers ────────────────────────────────────────────────────────────
function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&#39;': "'", '&nbsp;': ' ', '&ndash;': '-', '&mdash;': '—',
    '&rsquo;': "'", '&lsquo;': "'", '&rdquo;': '"', '&ldquo;': '"'
  };
  return text.replace(/&[^;]+;/g, (e) => entities[e] || e);
}

async function fetchWithRetry(url: string, retries = 2): Promise<string | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const resp = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      clearTimeout(timeout);
      if (resp.ok) return await resp.text();
      console.log(`Fetch ${url}: ${resp.status}`);
    } catch (e: any) {
      console.log(`Fetch error ${url}: ${e.message}`);
      if (i === retries) return null;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return null;
}

function parseRSSFeed(xml: string, baseUrl: string) {
  const items: Array<{title: string; link: string; description: string; pubDate: string; guid: string}> = [];
  try {
    for (const m of xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || []) {
      const title = m.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || '';
      const link  = m.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim() || '';
      const desc  = m.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() || '';
      const pub   = m.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || '';
      const guid  = m.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)?.[1]?.trim() || link;
      if (title && link) {
        items.push({ title: decodeHTMLEntities(title), link: link.startsWith('http') ? link : new URL(link, baseUrl).href, description: decodeHTMLEntities(stripHTML(desc).substring(0, 1000)), pubDate: pub, guid });
      }
    }
  } catch (e) { console.error('RSS parse error:', e); }
  return items;
}

function parseNewsPage(html: string, baseUrl: string) {
  const items: Array<{title: string; link: string; description: string; pubDate: string}> = [];
  const patterns = [
    /<article[^>]*>[\s\S]*?<\/article>/gi,
    /<div[^>]*class="[^"]*(?:news|post|article|announcement|bulletin|update|press-release|release|result|search-result)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    /<li[^>]*class="[^"]*(?:news|post|item|update|result)[^"]*"[^>]*>[\s\S]*?<\/li>/gi,
    /<tr[^>]*>[\s\S]*?<\/tr>/gi
  ];
  const seenLinks = new Set<string>();
  for (const pat of patterns) {
    for (const match of html.match(pat) || []) {
      const linkMatch = match.match(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
      if (!linkMatch) continue;
      let link = linkMatch[1];
      if (!link.startsWith('http')) {
        try { link = new URL(link, baseUrl).href; } catch { continue; }
      }
      if (seenLinks.has(link)) continue;
      seenLinks.add(link);
      let title = stripHTML(linkMatch[2]).trim();
      if (!title || title.length < 5) {
        const h = match.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
        title = h ? stripHTML(h[1]).trim() : '';
      }
      if (!title || title.length < 10) continue;
      // Skip junk nav titles
      if (/^(home|about|contact|menu|nav|skip|search|login|sign|careers|employment|privacy|facebook|twitter|instagram|youtube|linkedin|newsletter)/i.test(title)) continue;
      const descMatch = match.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      const description = descMatch ? stripHTML(descMatch[1]).trim().substring(0, 500) : '';
      const dateMatch = match.match(/(?:posted|published|date|updated)[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/i)
        || match.match(/<time[^>]*datetime=["']([^"']+)["']/i);
      items.push({ title: decodeHTMLEntities(title), link, description: decodeHTMLEntities(description), pubDate: dateMatch ? stripHTML(dateMatch[1]).trim() : '' });
    }
    if (items.length >= 25) break;
  }
  return items;
}

function getKavaAnalysis(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();
  const hasKava = KAVA_KEYWORDS.test(text);
  const hasContext = KAVA_CONTEXT_KEYWORDS.test(text);

  let documentType = 'announcement';
  if (/proposed.*rule|rule.*proposed/i.test(text)) documentType = 'proposed_rule';
  else if (/final.*rule/i.test(text)) documentType = 'final_rule';
  else if (/regulation|regulatory/i.test(text)) documentType = 'regulation';
  else if (/guidance|guidelines/i.test(text)) documentType = 'guidance';
  else if (/enforcement|violation|penalty|warning/i.test(text)) documentType = 'enforcement_action';
  else if (/license|permit/i.test(text)) documentType = 'license_update';
  else if (/notice/i.test(text)) documentType = 'public_notice';
  else if (/bill|legislature|act of/i.test(text)) documentType = 'proposed_rule';

  let sub_category = 'general';
  if (/supplement|dietary|herbal|botanical/i.test(text)) sub_category = 'dietary_supplement';
  else if (/import|export|trade/i.test(text)) sub_category = 'import_export';
  else if (/safety|liver|hepato|warning/i.test(text)) sub_category = 'safety';
  else if (/label|packaging/i.test(text)) sub_category = 'labeling';
  else if (/age|minor|restriction|ban/i.test(text)) sub_category = 'age_restriction';
  else if (/test|lab|quality/i.test(text)) sub_category = 'testing';

  const relevanceScore = (hasKava ? 0.7 : 0.3) + (hasContext ? 0.15 : 0) +
    (/regulation|rule|law|bill|act/i.test(text) ? 0.1 : 0) +
    (/enforcement|penalty|warning/i.test(text) ? 0.1 : 0);

  return {
    documentType,
    category: 'kava',
    sub_category,
    summary: description?.substring(0, 200) || title,
    relevanceScore: Math.min(relevanceScore, 1.0),
    topics: [
      ...(hasKava ? ['kava'] : []),
      ...(hasContext ? ['supplement'] : []),
      ...(/fda/i.test(text) ? ['fda'] : []),
      ...(/import|trade/i.test(text) ? ['trade'] : []),
      ...(/test|lab/i.test(text) ? ['testing'] : []),
    ],
    urgency: /emergency|immediate|urgent|recall|warning/i.test(text) ? 'critical'
           : /deadline|required|mandatory/i.test(text) ? 'high' : 'medium',
    isKavaRelated: hasKava,
    hasContext,
  };
}

// ── Main handler ───────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const hdrs = buildCors(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: hdrs });

  try {
    const body = await req.json().catch(() => ({}));
    const { stateCode, fullScan = false } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY')
      || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      || Deno.env.get('Supabase_API_Public');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ success: false, error: 'Missing Supabase credentials (SERVICE_ROLE_KEY)' }), {
        status: 500, headers: { ...hdrs, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build jurisdiction lookup (code → uuid)
    const { data: jurisdictions } = await supabase.from('jurisdiction').select('id, code, name');
    const jMap: Record<string, string> = {};
    for (const j of jurisdictions || []) {
      if (j.code) jMap[j.code] = j.id;
      // Also map "Federal Government" by name
      if (j.name === 'Federal Government') jMap['FEDERAL'] = j.id;
    }

    // Gather existing external_ids so we can skip duplicates
    const { data: existing } = await supabase.from('instrument').select('external_id').eq('source', 'kava_poller');
    const existingIds = new Set((existing || []).map(r => r.external_id));

    // Determine which sources to process
    const sourcesToProcess = stateCode
      ? [[stateCode, STATE_KAVA_SOURCES[stateCode]]].filter(([, v]) => v)
      : Object.entries(STATE_KAVA_SOURCES);

    let recordsProcessed = 0;
    let newItemsFound = 0;
    const errors: string[] = [];
    const recentItems: any[] = [];
    const maxItemsPerSource = 15;

    for (const [code, sources] of sourcesToProcess as [string, typeof STATE_KAVA_SOURCES[string]][]) {
      if (!sources) continue;
      console.log(`[kava] Processing ${code} — ${sources.agencyName}`);
      const jurisdictionId = jMap[code] || jMap['FEDERAL'];
      let sourceItems = 0;

      // --- RSS feeds ---
      for (const feedUrl of sources.rssFeeds) {
        if (sourceItems >= maxItemsPerSource) break;
        try {
          const xml = await fetchWithRetry(feedUrl);
          if (!xml) continue;
          const items = parseRSSFeed(xml, feedUrl);
          for (const item of items) {
            if (sourceItems >= maxItemsPerSource) break;
            const text = `${item.title} ${item.description}`.toLowerCase();
            // KAVA relevance gate — only keep items that mention kava
            if (!KAVA_KEYWORDS.test(text)) continue;

            const externalId = `kava-${code}-rss-${btoa(item.guid || item.link).substring(0, 50)}`;
            if (existingIds.has(externalId) && !fullScan) { recordsProcessed++; continue; }

            const analysis = getKavaAnalysis(item.title, item.description);
            let effectiveDate = new Date().toISOString().split('T')[0];
            if (item.pubDate) { try { const d = new Date(item.pubDate); if (!isNaN(d.getTime())) effectiveDate = d.toISOString().split('T')[0]; } catch {} }

            const { error } = await supabase.from('instrument').upsert({
              external_id: externalId,
              title: item.title.substring(0, 500),
              description: analysis.summary || item.description?.substring(0, 2000),
              effective_date: effectiveDate,
              jurisdiction_id: jurisdictionId,
              source: 'kava_poller',
              url: item.link,
              category: 'kava',
              sub_category: analysis.sub_category,
              metadata: { ...analysis, agencyName: sources.agencyName, sourceType: 'rss', feedUrl, analyzedAt: new Date().toISOString() }
            }, { onConflict: 'external_id' });
            if (error) { errors.push(`${code} rss upsert: ${error.message}`); continue; }
            recordsProcessed++;
            if (!existingIds.has(externalId)) { newItemsFound++; existingIds.add(externalId); recentItems.push({ state: code, title: item.title, type: analysis.documentType, isNew: true }); }
            sourceItems++;
            await new Promise(r => setTimeout(r, 500));
          }
        } catch (e: any) { errors.push(`${code} RSS: ${e.message}`); }
      }

      // --- News pages (HTML scraping) ---
      for (const newsUrl of sources.newsPages) {
        if (sourceItems >= maxItemsPerSource) break;
        try {
          const html = await fetchWithRetry(newsUrl);
          if (!html) continue;

          // First check if the whole page contains kava-related content
          const pageText = stripHTML(html).toLowerCase();
          if (!KAVA_KEYWORDS.test(pageText) && !KAVA_CONTEXT_KEYWORDS.test(pageText)) {
            console.log(`[kava] No kava content on ${newsUrl}`);
            continue;
          }

          const items = parseNewsPage(html, sources.agency);
          for (const item of items) {
            if (sourceItems >= maxItemsPerSource) break;
            const text = `${item.title} ${item.description}`.toLowerCase();
            // Must mention kava or kava-relevant context on a kava-focused page
            if (!KAVA_KEYWORDS.test(text) && !KAVA_CONTEXT_KEYWORDS.test(text)) continue;

            const externalId = `kava-${code}-news-${btoa(item.link).substring(0, 50)}`;
            if (existingIds.has(externalId) && !fullScan) { recordsProcessed++; continue; }

            const analysis = getKavaAnalysis(item.title, item.description);
            // Skip low-relevance items
            if (analysis.relevanceScore < 0.5) continue;

            let effectiveDate = new Date().toISOString().split('T')[0];
            if (item.pubDate) { try { const d = new Date(item.pubDate); if (!isNaN(d.getTime())) effectiveDate = d.toISOString().split('T')[0]; } catch {} }

            const { error } = await supabase.from('instrument').upsert({
              external_id: externalId,
              title: item.title.substring(0, 500),
              description: analysis.summary || item.description?.substring(0, 2000),
              effective_date: effectiveDate,
              jurisdiction_id: jurisdictionId,
              source: 'kava_poller',
              url: item.link,
              category: 'kava',
              sub_category: analysis.sub_category,
              metadata: { ...analysis, agencyName: sources.agencyName, sourceType: 'news', newsPageUrl: newsUrl, analyzedAt: new Date().toISOString() }
            }, { onConflict: 'external_id' });
            if (error) { errors.push(`${code} news upsert: ${error.message}`); continue; }
            recordsProcessed++;
            if (!existingIds.has(externalId)) { newItemsFound++; existingIds.add(externalId); recentItems.push({ state: code, title: item.title, type: analysis.documentType, isNew: true }); }
            sourceItems++;
            await new Promise(r => setTimeout(r, 500));
          }
        } catch (e: any) { errors.push(`${code} news: ${e.message}`); }
      }

      console.log(`[kava] ${code}: ${sourceItems} items processed`);
    }

    // Log ingestion
    try {
      await supabase.from('ingestion_log').insert({
        source: 'kava_poller',
        status: errors.length === 0 ? 'success' : 'partial',
        records_fetched: recordsProcessed,
        metadata: { newItemsFound, errors: errors.slice(0, 10), recentItems: recentItems.slice(0, 20), fullScan }
      });
    } catch (e) { console.error('ingestion_log error:', e); }

    return new Response(JSON.stringify({
      success: true,
      recordsProcessed,
      newItemsFound,
      errors: errors.slice(0, 10),
      recentItems: recentItems.slice(0, 20)
    }), { status: 200, headers: { ...hdrs, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Kava poller error:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 500, headers: { ...hdrs, 'Content-Type': 'application/json' }
    });
  }
});

