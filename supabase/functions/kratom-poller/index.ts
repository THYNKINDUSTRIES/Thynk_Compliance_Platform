import { buildCors, corsHeaders } from '../_shared/cors.ts';
export { corsHeaders };

// @ts-ignore - Deno import for Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const STATE_KRATOM_SOURCES: Record<string, {
  agency: string;
  agencyName: string;
  rssFeeds: string[];
  newsPages: string[];
  regulationPages: string[];
}> = {
'FEDERAL': {
  agency: 'https://www.federalregister.gov/',
  agencyName: 'Federal Register',
  rssFeeds: ['https://rss.app/feeds/_GUg9OCqUT4Oo0tvf.xml'],
  newsPages: [
    'https://www.fda.gov/news-events/public-health-focus/fda-and-kratom',
    'https://www.dea.gov/drug-information/drug-scheduling'
  ],
  regulationPages: [
    'https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=kratom',
    'https://www.fda.gov/food/dietary-supplements'
  ]
},

// States with kratom bans - monitor for changes
'AL': {
  agency: 'https://www.alabamapublichealth.gov/',
  agencyName: 'Alabama Department of Public Health',
  rssFeeds: [],
  newsPages: [
    'https://www.alabamapublichealth.gov/news/',
    'https://www.al.gov/governor/news/',
    'https://www.alabamalegislature.gov/news'
  ],
  regulationPages: [
    'https://www.alabamapublichealth.gov/legal/index.html',
    'https://www.alabamalegislature.gov/Bills.aspx'
  ]
},

'AR': {
  agency: 'https://www.healthy.arkansas.gov/',
  agencyName: 'Arkansas Department of Health',
  rssFeeds: [],
  newsPages: [
    'https://www.healthy.arkansas.gov/news',
    'https://arkleg.state.ar.us/assembly/2025',
    'https://governor.arkansas.gov/news-media'
  ],
  regulationPages: [
    'https://www.healthy.arkansas.gov/programs-services/topics/controlled-substances',
    'https://arkleg.state.ar.us/Bills'
  ]
},

'IN': {
  agency: 'https://www.in.gov/health/',
  agencyName: 'Indiana State Department of Health',
  rssFeeds: [],
  newsPages: [
    'https://www.in.gov/health/newsroom/',
    'https://www.in.gov/governor/news/',
    'https://iga.in.gov/legislative/2025'
  ],
  regulationPages: [
    'https://www.in.gov/health/rules-and-regulations/',
    'https://iga.in.gov/laws-statutes'
  ]
},

'RI': {
  agency: 'https://health.ri.gov/',
  agencyName: 'Rhode Island Department of Health',
  rssFeeds: [],
  newsPages: [
    'https://health.ri.gov/news/',
    'https://governor.ri.gov/news',
    'https://www.rilegislature.gov/'
  ],
  regulationPages: [
    'https://health.ri.gov/regulations/',
    'https://www.rilegislature.gov/BillText'
  ]
},

'VT': {
  agency: 'https://www.healthvermont.gov/',
  agencyName: 'Vermont Department of Health',
  rssFeeds: [],
  newsPages: [
    'https://www.healthvermont.gov/news-events',
    'https://governor.vermont.gov/news',
    'https://legislature.vermont.gov/'
  ],
  regulationPages: [
    'https://www.healthvermont.gov/regulations',
    'https://legislature.vermont.gov/bill-tracker'
  ]
},

'WI': {
  agency: 'https://www.dhs.wisconsin.gov/',
  agencyName: 'Wisconsin Department of Health Services',
  rssFeeds: [],
  newsPages: [
    'https://www.dhs.wisconsin.gov/news/index.htm',
    'https://docs.legis.wisconsin.gov/',
    'https://governor.wisconsin.gov/news'
  ],
  regulationPages: [
    'https://docs.legis.wisconsin.gov/code/admin_code',
    'https://docs.legis.wisconsin.gov/statutes'
  ]
},

// States with kratom regulations/age restrictions
'AZ': {
  agency: 'https://www.azdhs.gov/',
  agencyName: 'Arizona Department of Health Services',
  rssFeeds: [],
  newsPages: [
    'https://www.azdhs.gov/news/',
    'https://azgovernor.gov/news',
    'https://www.azleg.gov/'
  ],
  regulationPages: [
    'https://www.azdhs.gov/preparedness/public-health-emergencies/index.php',
    'https://www.azleg.gov/bills/'
  ]
},

'FL': {
  agency: 'https://www.floridahealth.gov/',
  agencyName: 'Florida Department of Health',
  rssFeeds: [],
  newsPages: [
    'https://www.floridahealth.gov/newsroom/',
    'https://www.flgov.com/',
    'https://www.flsenate.gov/'
  ],
  regulationPages: [
    'https://www.floridahealth.gov/licensing-and-regulation/',
    'https://www.flsenate.gov/Laws'
  ]
},

'IL': {
  agency: 'https://dph.illinois.gov/',
  agencyName: 'Illinois Department of Public Health',
  rssFeeds: [],
  newsPages: [
    'https://dph.illinois.gov/news.html',
    'https://www.ilga.gov/',
    'https://www.illinois.gov/governor'
  ],
  regulationPages: [
    'https://dph.illinois.gov/topics-services/prevention-wellness/controlled-substances.html',
    'https://www.ilga.gov/commission/lrb'
  ]
},

'LA': {
  agency: 'https://ldh.la.gov/',
  agencyName: 'Louisiana Department of Health',
  rssFeeds: [],
  newsPages: [
    'https://ldh.la.gov/news',
    'https://gov.louisiana.gov/news',
    'https://www.legis.la.gov/'
  ],
  regulationPages: [
    'https://ldh.la.gov/page/controlled-substances',
    'https://www.legis.la.gov/legis/BillInfo.aspx'
  ]
},

'MS': {
  agency: 'https://www.msdh.ms.gov/',
  agencyName: 'Mississippi State Department of Health',
  rssFeeds: [],
  newsPages: [
    'https://www.msdh.ms.gov/msdhsite/_static/newsroom.html',
    'https://www.ms.gov/news',
    'https://www.legislature.ms.gov/'
  ],
  regulationPages: [
    'https://www.msdh.ms.gov/page/controlled-substances',
    'https://www.legislature.ms.gov/Laws'
  ]
},

'NH': {
  agency: 'https://www.dhhs.nh.gov/',
  agencyName: 'New Hampshire Department of Health and Human Services',
  rssFeeds: [],
  newsPages: [
    'https://www.dhhs.nh.gov/news',
    'https://www.governor.nh.gov/news',
    'https://www.gencourt.state.nh.us/'
  ],
  regulationPages: [
    'https://www.dhhs.nh.gov/programs-services/drugs-devices',
    'https://www.gencourt.state.nh.us/bill-search'
  ]
},

'TN': {
  agency: 'https://www.tn.gov/health.html',
  agencyName: 'Tennessee Department of Health',
  rssFeeds: [],
  newsPages: [
    'https://www.tn.gov/health/news.html',
    'https://www.tn.gov/governor/news',
    'https://www.capitol.tn.gov/'
  ],
  regulationPages: [
    'https://www.tn.gov/health/health-program-areas/health-professional-boards.html',
    'https://www.capitol.tn.gov/Bills/'
  ]
},

'UT': {
  agency: 'https://health.utah.gov/',
  agencyName: 'Utah Department of Health',
  rssFeeds: [],
  newsPages: [
    'https://health.utah.gov/news',
    'https://governor.utah.gov/news',
    'https://le.utah.gov/'
  ],
  regulationPages: [
    'https://health.utah.gov/regulations',
    'https://le.utah.gov/xcode/Title58/Chapter67/58-67.html'
  ]
},

// States without specific kratom regulations - monitor legislature and health departments
'WA': {
  agency: 'https://www.doh.wa.gov/',
  agencyName: 'Washington State Department of Health',
  rssFeeds: [],
  newsPages: [
    'https://www.doh.wa.gov/News',
    'https://www.governor.wa.gov/news',
    'https://app.leg.wa.gov/'
  ],
  regulationPages: [
    'https://www.doh.wa.gov/LicensesPermitsandCertificates',
    'https://app.leg.wa.gov/bills/'
  ]
},

'CA': {
  agency: 'https://www.cdph.ca.gov/',
  agencyName: 'California Department of Public Health',
  rssFeeds: [],
  newsPages: [
    'https://www.cdph.ca.gov/Programs/OPA/Pages/New-Release-List.aspx',
    'https://www.gov.ca.gov/news/',
    'https://leginfo.legislature.ca.gov/'
  ],
  regulationPages: [
    'https://www.cdph.ca.gov/Programs/OPA/Pages/default.aspx',
    'https://leginfo.legislature.ca.gov/faces/billSearchClient.xhtml'
  ]
},

'NY': {
  agency: 'https://www.health.ny.gov/',
  agencyName: 'New York State Department of Health',
  rssFeeds: [],
  newsPages: [
    'https://www.health.ny.gov/press/',
    'https://www.governor.ny.gov/news',
    'https://nyassembly.gov/'
  ],
  regulationPages: [
    'https://www.health.ny.gov/regulations/',
    'https://nyassembly.gov/leg/'
  ]
},

'TX': {
  agency: 'https://www.dshs.texas.gov/',
  agencyName: 'Texas Department of State Health Services',
  rssFeeds: [],
  newsPages: [
    'https://www.dshs.texas.gov/news/',
    'https://gov.texas.gov/news/',
    'https://www.legis.texas.gov/'
  ],
  regulationPages: [
    'https://www.dshs.texas.gov/regulations/',
    'https://www.legis.texas.gov/BillLookup/'
  ]
}
};

const DOCUMENT_TYPES = [
  'regulation', 'proposed_rule', 'final_rule', 'guidance', 'bulletin',
  'memo', 'press_release', 'announcement', 'enforcement_action',
  'license_update', 'policy_change', 'public_notice', 'emergency_rule', 'advisory'
];

function parseRSSFeed(xml: string, baseUrl: string): Array<{title: string; link: string; description: string; pubDate: string; guid: string}> {
  const items: Array<any> = [];
  try {
    const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
    for (const itemXml of itemMatches) {
      const title = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || '';
      const link = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim() || '';
      const description = itemXml.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() || '';
      const pubDate = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || '';
      const guid = itemXml.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)?.[1]?.trim() || link;
      if (title && link) {
        items.push({
          title: decodeHTMLEntities(title),
          link: link.startsWith('http') ? link : new URL(link, baseUrl).href,
          description: decodeHTMLEntities(stripHTML(description).substring(0, 1000)),
          pubDate,
          guid
        });
      }
    }
  } catch (e) {
    console.error('Error parsing RSS feed:', e);
  }
  return items;
}

function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '='
  };
  return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => entities[entity] || entity);
}

function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

async function fetchWithRetry(url: string, retries = 3): Promise<string | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Thynk Compliance Platform/1.0)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      });
      if (response.ok) {
        return await response.text();
      }
      console.log(`Fetch failed for ${url}: ${response.status}`);
    } catch (e: any) {
      console.log(`Fetch error for ${url}: ${e.message}`);
      if (i === retries) return null;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return null;
}

async function analyzeContentWithAI(title: string, description: string, link: string): Promise<{
  product: string;
  jurisdiction: string;
  requirements: string[];
  documentType: string;
  confidence: number;
}> {
  // @ts-ignore - Deno global for Supabase Edge Functions
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    console.error('Missing OPENAI_API_KEY');
    return {
      product: 'kratom',
      jurisdiction: 'FEDERAL',
      requirements: [],
      documentType: 'announcement',
      confidence: 0.5
    };
  }

  const prompt = `Analyze this regulatory content about kratom and extract structured information. This could be from various sources including RSS feeds, state legislature bills, health department announcements, court opinions, or federal regulations.

Title: ${title}
Description: ${description}
URL: ${link}

Please respond with a JSON object containing:
- product: Always "kratom" for this poller
- jurisdiction: The jurisdiction this applies to (FEDERAL, or specific state code like AL, CA, NY, etc.)
- requirements: Array of specific regulatory requirements, restrictions, or changes mentioned (be specific about what is required, prohibited, or allowed)
- documentType: One of [${DOCUMENT_TYPES.join(', ')}] - choose the most appropriate type. For legislative bills, use "proposed_rule" or "regulation". For court decisions, use "enforcement_action" or "policy_change". For health department announcements, use "announcement" or "public_notice".
- confidence: Number between 0-1 indicating confidence in the analysis

Consider these kratom-specific contexts:
- Bans or prohibitions on sale/possession
- Age restrictions (e.g., 18+, 21+)
- Labeling requirements
- Testing/quality standards
- Medical use allowances
- Legislative bills proposing new regulations
- Court rulings on kratom legality
- FDA warnings or actions
- State health department policies

Only respond with valid JSON, no other text.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      return {
        product: 'kratom',
        jurisdiction: 'FEDERAL',
        requirements: [],
        documentType: 'announcement',
        confidence: 0.3
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Clean up the response - remove any markdown formatting
    const cleanContent = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    const analysis = JSON.parse(cleanContent);

    // Validate the response
    if (!analysis.product || !analysis.jurisdiction || !Array.isArray(analysis.requirements) || !analysis.documentType) {
      throw new Error('Invalid analysis structure');
    }

    return {
      product: analysis.product,
      jurisdiction: analysis.jurisdiction,
      requirements: analysis.requirements,
      documentType: analysis.documentType,
      confidence: analysis.confidence || 0.5
    };
  } catch (e) {
    console.error('AI analysis failed:', e);
    return {
      product: 'kratom',
      jurisdiction: 'FEDERAL',
      requirements: [],
      documentType: 'announcement',
      confidence: 0.3
    };
  }
}

// Kratom relevance keywords
const KRATOM_KEYWORDS = /kratom|mitragyn|speciosa|7-hydroxymitragynine/i;

// ── Main handler ───────────────────────────────────────────────────────
// @ts-ignore - Deno global for Supabase Edge Functions
Deno.serve(async (req: Request) => {
  const hdrs = buildCors(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: hdrs });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { stateCode, fullScan = false } = body;

    // @ts-ignore - Deno global for Supabase Edge Functions
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // @ts-ignore - Deno global for Supabase Edge Functions
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY')
      // @ts-ignore - Deno global for Supabase Edge Functions
      || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      // @ts-ignore - Deno global for Supabase Edge Functions
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
      if (j.name === 'Federal Government') jMap['FEDERAL'] = j.id;
    }

    // Gather existing external_ids so we can skip duplicates
    const { data: existingData } = await supabase.from('instrument').select('external_id').eq('source', 'kratom_poller');
    const existingIds = new Set((existingData || []).map((r: any) => r.external_id));

    // Determine which sources to process
    const sourcesToProcess = stateCode
      ? [[stateCode, STATE_KRATOM_SOURCES[stateCode]]].filter(([, v]) => v)
      : Object.entries(STATE_KRATOM_SOURCES);

    let recordsProcessed = 0;
    let newItemsFound = 0;
    const errors: string[] = [];
    const recentItems: any[] = [];
    const maxItemsPerSource = 10;

    for (const [code, sources] of sourcesToProcess as [string, typeof STATE_KRATOM_SOURCES[string]][]) {
      if (!sources) continue;
      console.log(`[kratom] Processing ${code} — ${sources.agencyName}`);
      const jurisdictionId = jMap[code] || jMap['FEDERAL'];
      let sourceItems = 0;

      // --- RSS feeds ---
      for (const rssUrl of sources.rssFeeds) {
        if (sourceItems >= maxItemsPerSource) break;
        try {
          const xml = await fetchWithRetry(rssUrl);
          if (!xml) continue;
          const items = parseRSSFeed(xml, rssUrl);
          console.log(`[kratom] Parsed ${items.length} items from ${rssUrl}`);

          for (const item of items) {
            if (sourceItems >= maxItemsPerSource) break;
            const text = `${item.title} ${item.description}`.toLowerCase();
            // Kratom relevance gate — only keep items that mention kratom
            if (!KRATOM_KEYWORDS.test(text)) continue;

            const externalId = `kratom-${code}-rss-${btoa(item.guid || item.link).substring(0, 50)}`;
            if (existingIds.has(externalId) && !fullScan) { recordsProcessed++; continue; }

            // AI analysis — results stored in metadata
            const analysis = await analyzeContentWithAI(item.title, item.description, item.link);

            let effectiveDate = new Date().toISOString().split('T')[0];
            if (item.pubDate) {
              try { const d = new Date(item.pubDate); if (!isNaN(d.getTime())) effectiveDate = d.toISOString().split('T')[0]; } catch {}
            }

            const { error } = await supabase.from('instrument').upsert({
              external_id: externalId,
              title: item.title.substring(0, 500),
              description: item.description?.substring(0, 2000),
              effective_date: effectiveDate,
              jurisdiction_id: jurisdictionId,
              source: 'kratom_poller',
              url: item.link,
              category: 'kratom',
              sub_category: analysis.documentType || 'regulation',
              document_type: analysis.documentType || 'regulation',
              metadata: {
                product: analysis.product,
                jurisdiction_code: analysis.jurisdiction,
                requirements: analysis.requirements,
                confidence: analysis.confidence,
                agencyName: sources.agencyName,
                sourceType: 'rss',
                feedUrl: rssUrl,
                analyzedAt: new Date().toISOString()
              }
            }, { onConflict: 'external_id' });

            if (error) { errors.push(`${code} rss upsert: ${error.message}`); continue; }
            recordsProcessed++;
            if (!existingIds.has(externalId)) {
              newItemsFound++;
              existingIds.add(externalId);
              recentItems.push({ state: code, title: item.title, type: analysis.documentType, isNew: true });
            }
            sourceItems++;
            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 500));
          }
        } catch (e: any) { errors.push(`${code} RSS: ${e.message}`); }
      }

      // --- News pages (basic content check) ---
      for (const newsUrl of sources.newsPages) {
        if (sourceItems >= maxItemsPerSource) break;
        try {
          const content = await fetchWithRetry(newsUrl);
          if (content && KRATOM_KEYWORDS.test(content)) {
            console.log(`[kratom] Found kratom-related content on: ${newsUrl}`);
          }
        } catch (e: any) {
          errors.push(`${code} news: ${e.message}`);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${recordsProcessed} kratom regulatory items (${newItemsFound} new)`,
      processedItems: recordsProcessed,
      newItems: newItemsFound,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      recentItems: recentItems.slice(0, 20)
    }), {
      status: 200,
      headers: { ...hdrs, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in kratom poller:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...hdrs, 'Content-Type': 'application/json' }
    });
  }
});

