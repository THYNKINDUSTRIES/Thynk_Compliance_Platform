# Additional Data Source Pollers

This guide adds three new edge functions for additional data sources:
1. **cannabis-news-rss-poller** - RSS feed poller for state cannabis news
2. **dea-scheduling-poller** - DEA scheduling updates poller  
3. **fda-hemp-guidance-poller** - FDA hemp/CBD guidance poller

Plus an updated **scheduled-poller-cron** that orchestrates all pollers.

---

## Deployment Checklist

| # | Function Name | Status | Tested | Notes |
|---|---------------|--------|--------|-------|
| 1 | cannabis-news-rss-poller | ☐ | ☐ | RSS feeds from 8+ sources |
| 2 | dea-scheduling-poller | ☐ | ☐ | DEA scheduling updates |
| 3 | fda-hemp-guidance-poller | ☐ | ☐ | FDA hemp/CBD guidance |
| 4 | scheduled-poller-cron (UPDATE) | ☐ | ☐ | Add new pollers to orchestrator |

---

## Function 1: cannabis-news-rss-poller

**Purpose:** Poll RSS feeds from major cannabis news sources for regulatory content
**Sources:** Marijuana Moment, Cannabis Wire, Hemp Industry Daily, MJBizDaily, Leafly, High Times, Cannabis Business Times, Ganjapreneur

### Deploy in Supabase Dashboard:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Cannabis news RSS feed sources
const RSS_FEEDS = [
  {
    name: 'Marijuana Moment',
    url: 'https://www.marijuanamoment.net/feed/',
    category: 'national',
    type: 'news'
  },
  {
    name: 'Cannabis Wire',
    url: 'https://cannabiswire.com/feed/',
    category: 'national',
    type: 'news'
  },
  {
    name: 'Hemp Industry Daily',
    url: 'https://hempindustrydaily.com/feed/',
    category: 'national',
    type: 'industry'
  },
  {
    name: 'MJBizDaily',
    url: 'https://mjbizdaily.com/feed/',
    category: 'national',
    type: 'business'
  },
  {
    name: 'Leafly News',
    url: 'https://www.leafly.com/news/feed',
    category: 'national',
    type: 'news'
  },
  {
    name: 'High Times',
    url: 'https://hightimes.com/feed/',
    category: 'national',
    type: 'news'
  },
  {
    name: 'Cannabis Business Times',
    url: 'https://www.cannabisbusinesstimes.com/rss/',
    category: 'national',
    type: 'business'
  },
  {
    name: 'Ganjapreneur',
    url: 'https://www.ganjapreneur.com/feed/',
    category: 'national',
    type: 'business'
  }
];

// Keywords to filter for regulatory/compliance content
const REGULATORY_KEYWORDS = [
  'regulation', 'regulatory', 'legislation', 'bill', 'law', 'license',
  'licensing', 'compliance', 'rule', 'rulemaking', 'policy', 'governor',
  'senate', 'house', 'committee', 'hearing', 'vote', 'passed', 'signed',
  'legalization', 'decriminalization', 'enforcement', 'dea', 'fda',
  'usda', 'hemp', 'thc', 'delta-8', 'delta-9', 'schedule', 'controlled',
  'substance', 'ban', 'restrict', 'permit', 'application', 'deadline',
  'comment period', 'public comment', 'proposed rule', 'final rule',
  'emergency rule', 'executive order', 'attorney general', 'department'
];

// State detection patterns
const STATE_PATTERNS: Record<string, RegExp> = {
  'Alabama': /\balabama\b/i,
  'Alaska': /\balaska\b/i,
  'Arizona': /\barizona\b/i,
  'Arkansas': /\barkansas\b/i,
  'California': /\bcalifornia\b|\bcalif\b/i,
  'Colorado': /\bcolorado\b/i,
  'Connecticut': /\bconnecticut\b/i,
  'Delaware': /\bdelaware\b/i,
  'Florida': /\bflorida\b/i,
  'Georgia': /\bgeorgia\b/i,
  'Hawaii': /\bhawaii\b/i,
  'Idaho': /\bidaho\b/i,
  'Illinois': /\billinois\b/i,
  'Indiana': /\bindiana\b/i,
  'Iowa': /\biowa\b/i,
  'Kansas': /\bkansas\b/i,
  'Kentucky': /\bkentucky\b/i,
  'Louisiana': /\blouisiana\b/i,
  'Maine': /\bmaine\b/i,
  'Maryland': /\bmaryland\b/i,
  'Massachusetts': /\bmassachusetts\b/i,
  'Michigan': /\bmichigan\b/i,
  'Minnesota': /\bminnesota\b/i,
  'Mississippi': /\bmississippi\b/i,
  'Missouri': /\bmissouri\b/i,
  'Montana': /\bmontana\b/i,
  'Nebraska': /\bnebraska\b/i,
  'Nevada': /\bnevada\b/i,
  'New Hampshire': /\bnew hampshire\b/i,
  'New Jersey': /\bnew jersey\b/i,
  'New Mexico': /\bnew mexico\b/i,
  'New York': /\bnew york\b/i,
  'North Carolina': /\bnorth carolina\b/i,
  'North Dakota': /\bnorth dakota\b/i,
  'Ohio': /\bohio\b/i,
  'Oklahoma': /\boklahoma\b/i,
  'Oregon': /\boregon\b/i,
  'Pennsylvania': /\bpennsylvania\b/i,
  'Rhode Island': /\brhode island\b/i,
  'South Carolina': /\bsouth carolina\b/i,
  'South Dakota': /\bsouth dakota\b/i,
  'Tennessee': /\btennessee\b/i,
  'Texas': /\btexas\b/i,
  'Utah': /\butah\b/i,
  'Vermont': /\bvermont\b/i,
  'Virginia': /\bvirginia\b/i,
  'Washington': /\bwashington state\b|\bwashington's\b/i,
  'West Virginia': /\bwest virginia\b/i,
  'Wisconsin': /\bwisconsin\b/i,
  'Wyoming': /\bwyoming\b/i
};

function isRegulatoryContent(title: string, description: string): boolean {
  const combined = `${title} ${description}`.toLowerCase();
  return REGULATORY_KEYWORDS.some(keyword => combined.includes(keyword.toLowerCase()));
}

function extractStateFromContent(title: string, description: string): string | null {
  const combined = `${title} ${description}`;
  for (const [state, pattern] of Object.entries(STATE_PATTERNS)) {
    if (pattern.test(combined)) {
      return state;
    }
  }
  return null;
}

function extractTextContent(element: Element | null): string {
  if (!element) return '';
  return element.textContent?.trim() || '';
}

async function fetchAndParseFeed(feed: typeof RSS_FEEDS[0]): Promise<any[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'ComplianceTracker/1.0 (Cannabis Regulatory Monitor)',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Failed to fetch ${feed.name}: ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');

    // Check for parse errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      console.error(`XML parse error for ${feed.name}`);
      return [];
    }

    // Detect feed type (RSS vs Atom)
    const isAtom = doc.querySelector('feed') !== null;
    const entries = isAtom
      ? Array.from(doc.querySelectorAll('entry'))
      : Array.from(doc.querySelectorAll('item'));

    const articles = [];

    for (const entry of entries.slice(0, 15)) {
      let title: string, link: string, pubDate: string, description: string;

      if (isAtom) {
        title = extractTextContent(entry.querySelector('title'));
        link = entry.querySelector('link')?.getAttribute('href') || '';
        pubDate = extractTextContent(entry.querySelector('published') || entry.querySelector('updated'));
        description = extractTextContent(entry.querySelector('summary') || entry.querySelector('content'));
      } else {
        title = extractTextContent(entry.querySelector('title'));
        link = extractTextContent(entry.querySelector('link'));
        pubDate = extractTextContent(entry.querySelector('pubDate'));
        description = extractTextContent(entry.querySelector('description'));
      }

      // Strip HTML tags from description
      description = description.replace(/<[^>]*>/g, '').substring(0, 1000);

      // Only include regulatory content
      if (isRegulatoryContent(title, description)) {
        const state = extractStateFromContent(title, description);
        
        articles.push({
          title,
          url: link,
          published_date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          summary: description,
          source_name: feed.name,
          source_category: feed.category,
          source_type: feed.type,
          detected_state: state,
          is_regulatory: true
        });
      }
    }

    return articles;
  } catch (error) {
    console.error(`Error processing ${feed.name}:`, error);
    return [];
  }
}

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const startTime = Date.now();
    const allArticles: any[] = [];
    const feedResults: Record<string, { success: boolean; count: number; error?: string }> = {};

    // Fetch all feeds in parallel with timeout
    const feedPromises = RSS_FEEDS.map(async (feed) => {
      try {
        const articles = await fetchAndParseFeed(feed);
        feedResults[feed.name] = {
          success: articles.length >= 0,
          count: articles.length
        };
        return articles;
      } catch (error: any) {
        feedResults[feed.name] = {
          success: false,
          count: 0,
          error: error.message
        };
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    results.forEach(articles => allArticles.push(...articles));

    // Deduplicate by URL
    const uniqueArticles = Array.from(
      new Map(allArticles.map(a => [a.url, a])).values()
    );

    // Store in database
    let recordsAdded = 0;
    let recordsSkipped = 0;

    for (const article of uniqueArticles) {
      // Check if already exists
      const { data: existing } = await supabase
        .from('instrument')
        .select('id')
        .eq('source_url', article.url)
        .limit(1);

      if (!existing || existing.length === 0) {
        const jurisdiction = article.detected_state || 'Federal';
        
        // Get or create jurisdiction
        let { data: jurisdictionData } = await supabase
          .from('jurisdiction')
          .select('id')
          .eq('name', jurisdiction)
          .limit(1);

        if (!jurisdictionData || jurisdictionData.length === 0) {
          const { data: newJurisdiction } = await supabase
            .from('jurisdiction')
            .insert({ 
              name: jurisdiction, 
              type: article.detected_state ? 'state' : 'federal',
              code: article.detected_state ? jurisdiction.substring(0, 2).toUpperCase() : 'US'
            })
            .select('id')
            .limit(1);
          jurisdictionData = newJurisdiction;
        }

        // Insert the instrument
        const { error: insertError } = await supabase
          .from('instrument')
          .insert({
            title: article.title,
            source_url: article.url,
            description: article.summary,
            effective_date: article.published_date.split('T')[0],
            jurisdiction_id: jurisdictionData?.[0]?.id,
            instrument_type: 'news',
            status: 'published',
            source: 'cannabis_news_rss',
            metadata: {
              source_name: article.source_name,
              source_category: article.source_category,
              source_type: article.source_type,
              detected_state: article.detected_state,
              is_regulatory: article.is_regulatory,
              lastPolled: new Date().toISOString()
            }
          });

        if (!insertError) {
          recordsAdded++;
        }
      } else {
        recordsSkipped++;
      }
    }

    // Log the ingestion
    await supabase
      .from('ingestion_log')
      .insert({
        source_id: 'cannabis-news-rss-poller',
        source: 'cannabis_news_rss',
        status: 'success',
        records_fetched: uniqueArticles.length,
        records_created: recordsAdded,
        started_at: new Date().toISOString(),
        metadata: { 
          feedResults,
          recordsSkipped,
          executionTime: Date.now() - startTime
        }
      });

    return new Response(JSON.stringify({
      success: true,
      message: `Cannabis news RSS polling completed`,
      totalArticles: uniqueArticles.length,
      recordsAdded,
      recordsSkipped,
      feedResults,
      executionTime: Date.now() - startTime
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('Cannabis RSS Poller Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
```

### Test Command:
```bash
# Test OPTIONS preflight
curl -X OPTIONS 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/cannabis-news-rss-poller' \
  -H 'Origin: https://your-app.com' \
  -H 'Access-Control-Request-Method: POST' \
  -v

# Test POST
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/cannabis-news-rss-poller' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

---

## Function 2: dea-scheduling-poller

**Purpose:** Poll DEA for controlled substance scheduling updates, including cannabis rescheduling news
**Sources:** DEA Diversion Control, Federal Register DEA entries, DEA press releases

### Deploy in Supabase Dashboard:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// DEA-related search terms for Federal Register
const DEA_SEARCH_TERMS = [
  'DEA cannabis',
  'DEA marijuana',
  'DEA scheduling',
  'DEA rescheduling',
  'controlled substances cannabis',
  'schedule I cannabis',
  'schedule II cannabis',
  'schedule III cannabis',
  'DEA hemp',
  'DEA THC',
  'DEA kratom',
  'DEA psilocybin',
  'DEA psychedelics',
  'drug scheduling',
  'controlled substance act cannabis'
];

// DEA source URLs to check
const DEA_SOURCES = [
  {
    name: 'DEA Diversion Control',
    url: 'https://www.deadiversion.usdoj.gov/schedules/',
    type: 'scheduling'
  },
  {
    name: 'DEA Press Releases',
    url: 'https://www.dea.gov/press-releases',
    type: 'press'
  },
  {
    name: 'DEA Rulemaking',
    url: 'https://www.deadiversion.usdoj.gov/fed_regs/rules/index.html',
    type: 'rulemaking'
  }
];

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any = {};
    try {
      const text = await req.text();
      if (text && text.trim()) body = JSON.parse(text);
    } catch (e) {}

    const { daysBack = 90 } = body;
    
    const startTime = Date.now();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const dateStr = startDate.toISOString().split('T')[0];

    let totalRecords = 0;
    let newRecords = 0;
    const errors: string[] = [];
    const results: any[] = [];

    // Get US jurisdiction ID
    let { data: usJurisdiction } = await supabase
      .from('jurisdiction')
      .select('id')
      .eq('code', 'US')
      .limit(1);

    if (!usJurisdiction || usJurisdiction.length === 0) {
      // Create US jurisdiction if it doesn't exist
      const { data: newJurisdiction } = await supabase
        .from('jurisdiction')
        .insert({ name: 'United States', code: 'US', type: 'federal' })
        .select('id')
        .limit(1);
      usJurisdiction = newJurisdiction;
    }

    const jurisdictionId = usJurisdiction?.[0]?.id;

    // 1. Search Federal Register for DEA-related documents
    for (const term of DEA_SEARCH_TERMS) {
      try {
        const url = `https://www.federalregister.gov/api/v1/documents.json?conditions[term]=${encodeURIComponent(term)}&conditions[agencies][]=drug-enforcement-administration&conditions[publication_date][gte]=${dateStr}&per_page=25&order=newest`;
        
        const response = await fetch(url, {
          headers: { 'User-Agent': 'ComplianceTracker/1.0' }
        });

        if (!response.ok) {
          errors.push(`Federal Register search failed for: ${term}`);
          continue;
        }

        const data = await response.json();
        const documents = data.results || [];
        totalRecords += documents.length;

        for (const doc of documents) {
          // Check if document is cannabis/scheduling related
          const isRelevant = doc.title?.toLowerCase().includes('cannabis') ||
                            doc.title?.toLowerCase().includes('marijuana') ||
                            doc.title?.toLowerCase().includes('schedule') ||
                            doc.title?.toLowerCase().includes('controlled substance') ||
                            doc.abstract?.toLowerCase().includes('cannabis') ||
                            doc.abstract?.toLowerCase().includes('marijuana');

          if (!isRelevant) continue;

          const { error } = await supabase.from('instrument').upsert({
            external_id: `dea-fr-${doc.document_number}`,
            title: doc.title,
            description: doc.abstract || doc.title,
            effective_date: doc.publication_date,
            jurisdiction_id: jurisdictionId,
            source: 'dea_scheduling',
            source_url: doc.html_url,
            instrument_type: doc.type === 'Rule' ? 'rule' : 'notice',
            status: doc.type === 'Proposed Rule' ? 'proposed' : 'final',
            metadata: {
              document_number: doc.document_number,
              document_type: doc.type,
              agencies: doc.agencies?.map((a: any) => a.name) || ['DEA'],
              docket_ids: doc.docket_ids || [],
              comment_end_date: doc.comments_close_on,
              search_term: term,
              category: 'DEA Scheduling',
              subcategory: 'Controlled Substances',
              lastPolled: new Date().toISOString()
            }
          }, { onConflict: 'external_id' });

          if (!error) {
            newRecords++;
            results.push({
              title: doc.title,
              type: doc.type,
              date: doc.publication_date
            });
          }
        }

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (termError: any) {
        errors.push(`Error for term ${term}: ${termError.message}`);
      }
    }

    // 2. Add static DEA source references
    for (const source of DEA_SOURCES) {
      const { error } = await supabase.from('instrument').upsert({
        external_id: `dea-source-${source.type}`,
        title: source.name,
        description: `Official DEA ${source.type} information source. Check regularly for updates on controlled substance scheduling.`,
        effective_date: new Date().toISOString().split('T')[0],
        jurisdiction_id: jurisdictionId,
        source: 'dea_scheduling',
        source_url: source.url,
        instrument_type: 'reference',
        status: 'active',
        metadata: {
          source_type: source.type,
          category: 'DEA Reference',
          is_reference_source: true,
          lastPolled: new Date().toISOString()
        }
      }, { onConflict: 'external_id' });

      if (!error) newRecords++;
    }

    // Log the ingestion
    await supabase.from('ingestion_log').insert({
      source_id: 'dea-scheduling-poller',
      source: 'dea_scheduling',
      status: errors.length === 0 ? 'success' : 'partial',
      records_fetched: totalRecords,
      records_created: newRecords,
      started_at: new Date().toISOString(),
      metadata: { 
        searchTerms: DEA_SEARCH_TERMS.length,
        daysBack,
        errors: errors.length > 0 ? errors : undefined,
        executionTime: Date.now() - startTime
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: `DEA scheduling poller completed`,
      totalRecords,
      newRecords,
      recentDocuments: results.slice(0, 10),
      errors: errors.length > 0 ? errors : undefined,
      executionTime: Date.now() - startTime
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('DEA Scheduling Poller Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
```

### Test Command:
```bash
# Test OPTIONS preflight
curl -X OPTIONS 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/dea-scheduling-poller' \
  -H 'Origin: https://your-app.com' \
  -H 'Access-Control-Request-Method: POST' \
  -v

# Test POST
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/dea-scheduling-poller' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"daysBack": 30}'
```

---

## Function 3: fda-hemp-guidance-poller

**Purpose:** Poll FDA for hemp, CBD, and cannabinoid guidance documents
**Sources:** FDA Federal Register entries, FDA guidance documents, FDA warning letters

### Deploy in Supabase Dashboard:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// FDA-related search terms
const FDA_SEARCH_TERMS = [
  'FDA hemp',
  'FDA CBD',
  'FDA cannabidiol',
  'FDA cannabis',
  'FDA marijuana',
  'FDA THC',
  'FDA delta-8',
  'FDA delta-9',
  'dietary supplement CBD',
  'food additive CBD',
  'hemp extract',
  'cannabinoid',
  'FDA kratom',
  'FDA nicotine',
  'FDA tobacco',
  'FDA vaping',
  'FDA e-cigarette'
];

// FDA guidance document categories
const FDA_GUIDANCE_CATEGORIES = [
  'dietary_supplements',
  'food_additives',
  'cosmetics',
  'drugs',
  'tobacco'
];

// FDA source URLs
const FDA_SOURCES = [
  {
    name: 'FDA Hemp/CBD Information',
    url: 'https://www.fda.gov/news-events/public-health-focus/fda-regulation-cannabis-and-cannabis-derived-products-including-cannabidiol-cbd',
    type: 'guidance'
  },
  {
    name: 'FDA Warning Letters - CBD',
    url: 'https://www.fda.gov/news-events/public-health-focus/warning-letters-and-test-results-cannabidiol-related-products',
    type: 'enforcement'
  },
  {
    name: 'FDA Dietary Supplements',
    url: 'https://www.fda.gov/food/dietary-supplements',
    type: 'reference'
  },
  {
    name: 'FDA Tobacco Products',
    url: 'https://www.fda.gov/tobacco-products',
    type: 'reference'
  },
  {
    name: 'FDA GRAS Notices',
    url: 'https://www.fda.gov/food/generally-recognized-safe-gras/gras-notice-inventory',
    type: 'reference'
  }
];

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any = {};
    try {
      const text = await req.text();
      if (text && text.trim()) body = JSON.parse(text);
    } catch (e) {}

    const { daysBack = 90, categories = FDA_GUIDANCE_CATEGORIES } = body;
    
    const startTime = Date.now();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const dateStr = startDate.toISOString().split('T')[0];

    let totalRecords = 0;
    let newRecords = 0;
    const errors: string[] = [];
    const results: any[] = [];

    // Get US jurisdiction ID
    let { data: usJurisdiction } = await supabase
      .from('jurisdiction')
      .select('id')
      .eq('code', 'US')
      .limit(1);

    if (!usJurisdiction || usJurisdiction.length === 0) {
      const { data: newJurisdiction } = await supabase
        .from('jurisdiction')
        .insert({ name: 'United States', code: 'US', type: 'federal' })
        .select('id')
        .limit(1);
      usJurisdiction = newJurisdiction;
    }

    const jurisdictionId = usJurisdiction?.[0]?.id;

    // 1. Search Federal Register for FDA-related documents
    for (const term of FDA_SEARCH_TERMS) {
      try {
        const url = `https://www.federalregister.gov/api/v1/documents.json?conditions[term]=${encodeURIComponent(term)}&conditions[agencies][]=food-and-drug-administration&conditions[publication_date][gte]=${dateStr}&per_page=25&order=newest`;
        
        const response = await fetch(url, {
          headers: { 'User-Agent': 'ComplianceTracker/1.0' }
        });

        if (!response.ok) {
          errors.push(`Federal Register search failed for: ${term}`);
          continue;
        }

        const data = await response.json();
        const documents = data.results || [];
        totalRecords += documents.length;

        for (const doc of documents) {
          // Determine category based on content
          let category = 'general';
          const titleLower = doc.title?.toLowerCase() || '';
          const abstractLower = doc.abstract?.toLowerCase() || '';
          
          if (titleLower.includes('dietary supplement') || abstractLower.includes('dietary supplement')) {
            category = 'dietary_supplements';
          } else if (titleLower.includes('food') || abstractLower.includes('food additive')) {
            category = 'food_additives';
          } else if (titleLower.includes('cosmetic')) {
            category = 'cosmetics';
          } else if (titleLower.includes('drug') || titleLower.includes('pharmaceutical')) {
            category = 'drugs';
          } else if (titleLower.includes('tobacco') || titleLower.includes('nicotine') || titleLower.includes('vaping')) {
            category = 'tobacco';
          }

          const { error } = await supabase.from('instrument').upsert({
            external_id: `fda-fr-${doc.document_number}`,
            title: doc.title,
            description: doc.abstract || doc.title,
            effective_date: doc.publication_date,
            jurisdiction_id: jurisdictionId,
            source: 'fda_hemp_guidance',
            source_url: doc.html_url,
            instrument_type: doc.type === 'Rule' ? 'rule' : (doc.type === 'Notice' ? 'notice' : 'guidance'),
            status: doc.type === 'Proposed Rule' ? 'proposed' : 'final',
            metadata: {
              document_number: doc.document_number,
              document_type: doc.type,
              agencies: doc.agencies?.map((a: any) => a.name) || ['FDA'],
              docket_ids: doc.docket_ids || [],
              comment_end_date: doc.comments_close_on,
              search_term: term,
              category: 'FDA Guidance',
              subcategory: category,
              product_categories: [category],
              lastPolled: new Date().toISOString()
            }
          }, { onConflict: 'external_id' });

          if (!error) {
            newRecords++;
            results.push({
              title: doc.title,
              type: doc.type,
              category,
              date: doc.publication_date
            });
          }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (termError: any) {
        errors.push(`Error for term ${term}: ${termError.message}`);
      }
    }

    // 2. Add FDA source references
    for (const source of FDA_SOURCES) {
      const { error } = await supabase.from('instrument').upsert({
        external_id: `fda-source-${source.type}-${source.name.replace(/\s+/g, '-').toLowerCase()}`,
        title: source.name,
        description: `Official FDA ${source.type} resource. Check regularly for updates on hemp, CBD, and cannabinoid regulations.`,
        effective_date: new Date().toISOString().split('T')[0],
        jurisdiction_id: jurisdictionId,
        source: 'fda_hemp_guidance',
        source_url: source.url,
        instrument_type: 'reference',
        status: 'active',
        metadata: {
          source_type: source.type,
          category: 'FDA Reference',
          is_reference_source: true,
          lastPolled: new Date().toISOString()
        }
      }, { onConflict: 'external_id' });

      if (!error) newRecords++;
    }

    // 3. Check for FDA warning letters (simplified - would need web scraping for full implementation)
    const warningLetterRef = {
      external_id: 'fda-cbd-warning-letters',
      title: 'FDA CBD Warning Letters Database',
      description: 'FDA maintains a database of warning letters sent to companies making illegal claims about CBD products. This is updated regularly and should be monitored for enforcement trends.',
      effective_date: new Date().toISOString().split('T')[0],
      jurisdiction_id: jurisdictionId,
      source: 'fda_hemp_guidance',
      source_url: 'https://www.fda.gov/news-events/public-health-focus/warning-letters-and-test-results-cannabidiol-related-products',
      instrument_type: 'enforcement',
      status: 'active',
      metadata: {
        category: 'FDA Enforcement',
        subcategory: 'Warning Letters',
        is_reference_source: true,
        lastPolled: new Date().toISOString()
      }
    };

    await supabase.from('instrument').upsert(warningLetterRef, { onConflict: 'external_id' });

    // Log the ingestion
    await supabase.from('ingestion_log').insert({
      source_id: 'fda-hemp-guidance-poller',
      source: 'fda_hemp_guidance',
      status: errors.length === 0 ? 'success' : 'partial',
      records_fetched: totalRecords,
      records_created: newRecords,
      started_at: new Date().toISOString(),
      metadata: { 
        searchTerms: FDA_SEARCH_TERMS.length,
        categories,
        daysBack,
        errors: errors.length > 0 ? errors : undefined,
        executionTime: Date.now() - startTime
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: `FDA hemp guidance poller completed`,
      totalRecords,
      newRecords,
      recentDocuments: results.slice(0, 10),
      categoryCounts: results.reduce((acc: any, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
      }, {}),
      errors: errors.length > 0 ? errors : undefined,
      executionTime: Date.now() - startTime
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('FDA Hemp Guidance Poller Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
```

### Test Command:
```bash
# Test OPTIONS preflight
curl -X OPTIONS 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/fda-hemp-guidance-poller' \
  -H 'Origin: https://your-app.com' \
  -H 'Access-Control-Request-Method: POST' \
  -v

# Test POST
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/fda-hemp-guidance-poller' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"daysBack": 60}'
```

---

## Updated scheduled-poller-cron (Orchestrator)

**Purpose:** Orchestrate ALL polling functions including the new data sources
**Schedule:** Runs hourly, with different pollers running at different intervals

### Deploy in Supabase Dashboard (REPLACE existing scheduled-poller-cron):

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface PollerResult {
  success: boolean;
  message: string;
  recordsAdded?: number;
  executionTime?: number;
  error?: string;
}

interface PollerConfig {
  name: string;
  functionName: string;
  schedule: 'hourly' | 'every_6_hours' | 'every_12_hours' | 'daily' | 'weekly';
  hoursToRun?: number[]; // Specific hours to run (0-23 UTC)
  daysToRun?: number[]; // Specific days to run (0=Sunday, 6=Saturday)
  enabled: boolean;
  timeout: number; // milliseconds
}

// Poller configuration
const POLLERS: PollerConfig[] = [
  {
    name: 'Federal Register',
    functionName: 'federal-register-poller',
    schedule: 'hourly',
    enabled: true,
    timeout: 30000
  },
  {
    name: 'Regulations.gov',
    functionName: 'regulations-gov-poller',
    schedule: 'hourly',
    enabled: true,
    timeout: 30000
  },
  {
    name: 'State Regulations',
    functionName: 'state-regulations-poller',
    schedule: 'every_6_hours',
    hoursToRun: [0, 6, 12, 18],
    enabled: true,
    timeout: 60000
  },
  {
    name: 'Cannabis News RSS',
    functionName: 'cannabis-news-rss-poller',
    schedule: 'every_6_hours',
    hoursToRun: [2, 8, 14, 20],
    enabled: true,
    timeout: 45000
  },
  {
    name: 'DEA Scheduling',
    functionName: 'dea-scheduling-poller',
    schedule: 'every_12_hours',
    hoursToRun: [3, 15],
    enabled: true,
    timeout: 30000
  },
  {
    name: 'FDA Hemp Guidance',
    functionName: 'fda-hemp-guidance-poller',
    schedule: 'every_12_hours',
    hoursToRun: [4, 16],
    enabled: true,
    timeout: 30000
  },
  {
    name: 'Comment Deadline Reminders',
    functionName: 'process-comment-deadline-reminders',
    schedule: 'daily',
    hoursToRun: [9], // 9 AM UTC
    enabled: true,
    timeout: 30000
  }
];

function shouldRunPoller(poller: PollerConfig, currentHour: number, currentDay: number): boolean {
  if (!poller.enabled) return false;

  switch (poller.schedule) {
    case 'hourly':
      return true;
    case 'every_6_hours':
    case 'every_12_hours':
    case 'daily':
      return poller.hoursToRun?.includes(currentHour) ?? false;
    case 'weekly':
      return (poller.daysToRun?.includes(currentDay) ?? false) && 
             (poller.hoursToRun?.includes(currentHour) ?? false);
    default:
      return false;
  }
}

async function callPoller(
  supabaseUrl: string, 
  supabaseKey: string, 
  functionName: string, 
  timeout: number
): Promise<PollerResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const startTime = Date.now();
    
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({}),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `HTTP ${response.status}`,
        error: errorText,
        executionTime: Date.now() - startTime
      };
    }

    const data = await response.json();
    
    return {
      success: data.success ?? true,
      message: data.message || 'Completed',
      recordsAdded: data.newRecords || data.recordsAdded || data.recordsProcessed || 0,
      executionTime: Date.now() - startTime
    };

  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'Timeout',
        error: `Function timed out after ${timeout}ms`
      };
    }

    return {
      success: false,
      message: 'Error',
      error: error.message
    };
  }
}

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentDay = now.getUTCDay();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any = {};
    try {
      const text = await req.text();
      if (text && text.trim()) body = JSON.parse(text);
    } catch (e) {}

    const { forceAll = false, onlyPollers = [] } = body;

    const results: Record<string, PollerResult> = {};
    const pollersToRun: PollerConfig[] = [];

    // Determine which pollers to run
    for (const poller of POLLERS) {
      const shouldRun = forceAll || 
                        onlyPollers.includes(poller.functionName) ||
                        shouldRunPoller(poller, currentHour, currentDay);
      
      if (shouldRun) {
        pollersToRun.push(poller);
      } else {
        results[poller.name] = {
          success: true,
          message: `Skipped - scheduled for hours: ${poller.hoursToRun?.join(', ') || 'N/A'}`
        };
      }
    }

    // Run pollers sequentially to avoid overwhelming the system
    for (const poller of pollersToRun) {
      console.log(`Running poller: ${poller.name}`);
      results[poller.name] = await callPoller(
        supabaseUrl, 
        supabaseKey, 
        poller.functionName, 
        poller.timeout
      );
      
      // Small delay between pollers
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Calculate summary
    const summary = {
      totalPollers: POLLERS.length,
      pollersRun: pollersToRun.length,
      successful: Object.values(results).filter(r => r.success).length,
      failed: Object.values(results).filter(r => !r.success && r.message !== 'Skipped').length,
      totalRecordsAdded: Object.values(results).reduce((sum, r) => sum + (r.recordsAdded || 0), 0)
    };

    // Log execution
    await supabase.from('job_execution_log').insert({
      job_name: 'scheduled-poller-cron',
      status: summary.failed === 0 ? 'success' : 'partial',
      started_at: now.toISOString(),
      completed_at: new Date().toISOString(),
      metadata: {
        currentHour,
        currentDay,
        forceAll,
        summary,
        results
      }
    });

    const totalDuration = Date.now() - startTime;

    return new Response(JSON.stringify({
      success: true,
      timestamp: now.toISOString(),
      currentHour,
      currentDay,
      executionTime: totalDuration,
      summary,
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('Scheduled poller cron error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
```

### Test Commands:

```bash
# Test normal run (respects schedule)
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/scheduled-poller-cron' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'

# Force run all pollers
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/scheduled-poller-cron' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"forceAll": true}'

# Run specific pollers only
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/scheduled-poller-cron' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"onlyPollers": ["cannabis-news-rss-poller", "dea-scheduling-poller"]}'
```

---

## Polling Schedule Summary

| Poller | Schedule | Hours (UTC) | Description |
|--------|----------|-------------|-------------|
| Federal Register | Hourly | All | Core federal regulations |
| Regulations.gov | Hourly | All | Federal comment periods |
| State Regulations | Every 6 hours | 0, 6, 12, 18 | State cannabis agencies |
| Cannabis News RSS | Every 6 hours | 2, 8, 14, 20 | Industry news sources |
| DEA Scheduling | Every 12 hours | 3, 15 | DEA scheduling updates |
| FDA Hemp Guidance | Every 12 hours | 4, 16 | FDA hemp/CBD guidance |
| Comment Reminders | Daily | 9 | User deadline reminders |

---

## Quick Deployment Steps

### For Each New Function:

1. **Go to Supabase Dashboard** → Edge Functions
2. **Click "New Function"**
3. **Enter the function name** (e.g., `cannabis-news-rss-poller`)
4. **Paste the complete code** from this guide
5. **Click Deploy**
6. **Test with curl** using the provided test command
7. **Check the checkbox** in the deployment checklist

### For the Updated Orchestrator:

1. **Go to Supabase Dashboard** → Edge Functions
2. **Find `scheduled-poller-cron`**
3. **Click to edit**
4. **Replace ALL code** with the updated version
5. **Click Deploy**
6. **Test with forceAll** to verify all pollers work

---

## Verification Script

```bash
#!/bin/bash

SUPABASE_URL="https://kruwbjaszdwzttblxqwr.supabase.co"
SERVICE_KEY="YOUR_SERVICE_ROLE_KEY"

echo "Testing new data source pollers..."

NEW_FUNCTIONS=(
  "cannabis-news-rss-poller"
  "dea-scheduling-poller"
  "fda-hemp-guidance-poller"
)

for func in "${NEW_FUNCTIONS[@]}"; do
  echo ""
  echo "Testing: $func"
  
  # Test OPTIONS
  response=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
    "$SUPABASE_URL/functions/v1/$func" \
    -H "Origin: https://your-app.com" \
    -H "Access-Control-Request-Method: POST")
  
  if [ "$response" == "204" ] || [ "$response" == "200" ]; then
    echo "  ✅ OPTIONS: $response"
  else
    echo "  ❌ OPTIONS: $response (expected 204)"
  fi
  
  # Test POST
  result=$(curl -s -X POST \
    "$SUPABASE_URL/functions/v1/$func" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d '{}')
  
  if echo "$result" | grep -q '"success":true'; then
    echo "  ✅ POST: Success"
    echo "     Records: $(echo $result | grep -o '"recordsAdded":[0-9]*' | cut -d: -f2)"
  else
    echo "  ❌ POST: Failed"
    echo "     Error: $(echo $result | grep -o '"error":"[^"]*"')"
  fi
done

echo ""
echo "Testing orchestrator with forceAll..."
result=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/scheduled-poller-cron" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"forceAll": true}')

echo "Orchestrator result:"
echo "$result" | python3 -m json.tool 2>/dev/null || echo "$result"

echo ""
echo "Done!"
```

---

## Troubleshooting

### RSS Feed Not Returning Data

1. Some feeds may have rate limiting - the poller handles this gracefully
2. Check if the feed URL is still valid
3. Some feeds require specific User-Agent headers (already configured)

### DEA/FDA Poller Returns Few Results

1. These sources update less frequently than news sources
2. Try increasing `daysBack` parameter to search further back
3. Federal Register API may have rate limits

### Orchestrator Timeout

1. Individual pollers have timeout limits (30-60 seconds)
2. If a poller times out, the orchestrator continues with others
3. Check Supabase logs for specific poller errors

### CORS Errors

1. Verify the function deployed successfully
2. Check that OPTIONS handler is first in the function
3. Ensure all responses include `corsHeaders`
