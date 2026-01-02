# Manual Deployment: Enhanced Cannabis Hemp Poller

## Overview

This document contains the complete edge function code for the enhanced cannabis-hemp-poller with:
- **50 states** now covered (all US states with cannabis/hemp programs)
- RSS feed scraping
- News page HTML parsing
- OpenAI GPT-4o-mini content categorization

## States Covered

The poller now tracks all 50 US states including:
- Adult-use cannabis states (CA, CO, WA, OR, NV, MA, MI, IL, AZ, NY, NJ, etc.)
- Medical-only states (FL, PA, OH, MD, MO, etc.)
- Hemp/CBD-only states (TX, GA, NC, SC, TN, etc.)

## Deployment Instructions

### Option 1: Supabase Dashboard (Recommended)

1. Go to your **Supabase Dashboard**
2. Navigate to **Edge Functions**
3. Find `cannabis-hemp-poller` and click **Edit**
4. Replace ALL the code with the content in the **Complete Edge Function Code** section below
5. Click **Deploy**

### Option 2: Supabase CLI

```bash
# Save the code to a file
supabase functions deploy cannabis-hemp-poller
```

---

## Complete Edge Function Code

Copy everything below this line and paste into the Supabase Edge Function editor:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Enhanced state cannabis regulatory sources with RSS feeds, news pages, and regulation pages
// Now covering all 50 states including FL, TX, GA, NC, SC, TN, KY, WV, DE, RI, and more
const STATE_CANNABIS_SOURCES: Record<string, {
  agency: string;
  agencyName: string;
  rssFeeds: string[];
  newsPages: string[];
  regulationPages: string[];
}> = {
  // === ADULT-USE + MEDICAL STATES ===
  'CA': {
    agency: 'https://cannabis.ca.gov',
    agencyName: 'California Department of Cannabis Control',
    rssFeeds: ['https://cannabis.ca.gov/feed/', 'https://cannabis.ca.gov/category/announcements/feed/'],
    newsPages: ['https://cannabis.ca.gov/about-us/announcements/', 'https://cannabis.ca.gov/resources/rulemaking/'],
    regulationPages: ['https://cannabis.ca.gov/cannabis-laws/dcc-regulations/']
  },
  'CO': {
    agency: 'https://sbg.colorado.gov/med',
    agencyName: 'Colorado Marijuana Enforcement Division',
    rssFeeds: [],
    newsPages: ['https://sbg.colorado.gov/med/news', 'https://sbg.colorado.gov/med/licensee-resources'],
    regulationPages: ['https://sbg.colorado.gov/med/rules']
  },
  'WA': {
    agency: 'https://lcb.wa.gov',
    agencyName: 'Washington Liquor and Cannabis Board',
    rssFeeds: [],
    newsPages: ['https://lcb.wa.gov/pressreleases/press-releases', 'https://lcb.wa.gov/marijuana/marijuana-news'],
    regulationPages: ['https://lcb.wa.gov/laws/current-laws-and-rules']
  },
  'OR': {
    agency: 'https://www.oregon.gov/olcc',
    agencyName: 'Oregon Liquor and Cannabis Commission',
    rssFeeds: [],
    newsPages: ['https://www.oregon.gov/olcc/Pages/news.aspx'],
    regulationPages: ['https://www.oregon.gov/olcc/marijuana/Pages/Recreational-Marijuana-Laws-and-Rules.aspx']
  },
  'NV': {
    agency: 'https://ccb.nv.gov',
    agencyName: 'Nevada Cannabis Compliance Board',
    rssFeeds: [],
    newsPages: ['https://ccb.nv.gov/news-events/', 'https://ccb.nv.gov/public-notices/'],
    regulationPages: ['https://ccb.nv.gov/laws-regulations/']
  },
  'MA': {
    agency: 'https://masscannabiscontrol.com',
    agencyName: 'Massachusetts Cannabis Control Commission',
    rssFeeds: ['https://masscannabiscontrol.com/feed/'],
    newsPages: ['https://masscannabiscontrol.com/news/', 'https://masscannabiscontrol.com/public-meetings/'],
    regulationPages: ['https://masscannabiscontrol.com/public-documents/regulations/']
  },
  'MI': {
    agency: 'https://www.michigan.gov/cra',
    agencyName: 'Michigan Cannabis Regulatory Agency',
    rssFeeds: [],
    newsPages: ['https://www.michigan.gov/cra/news', 'https://www.michigan.gov/cra/about/bulletins'],
    regulationPages: ['https://www.michigan.gov/cra/about/rules']
  },
  'IL': {
    agency: 'https://idfpr.illinois.gov',
    agencyName: 'Illinois Department of Financial and Professional Regulation',
    rssFeeds: [],
    newsPages: ['https://idfpr.illinois.gov/News.html'],
    regulationPages: ['https://idfpr.illinois.gov/profs/adultusecan.html']
  },
  'AZ': {
    agency: 'https://azdhs.gov/licensing/marijuana',
    agencyName: 'Arizona Department of Health Services',
    rssFeeds: [],
    newsPages: ['https://azdhs.gov/news/'],
    regulationPages: ['https://azdhs.gov/licensing/marijuana/adult-use-marijuana/']
  },
  'NY': {
    agency: 'https://cannabis.ny.gov',
    agencyName: 'New York Office of Cannabis Management',
    rssFeeds: [],
    newsPages: ['https://cannabis.ny.gov/news', 'https://cannabis.ny.gov/guidance-documents'],
    regulationPages: ['https://cannabis.ny.gov/regulations']
  },
  'NJ': {
    agency: 'https://www.nj.gov/cannabis',
    agencyName: 'New Jersey Cannabis Regulatory Commission',
    rssFeeds: [],
    newsPages: ['https://www.nj.gov/cannabis/news/'],
    regulationPages: ['https://www.nj.gov/cannabis/resources/cannabis-laws/']
  },
  'VT': {
    agency: 'https://ccb.vermont.gov',
    agencyName: 'Vermont Cannabis Control Board',
    rssFeeds: ['https://ccb.vermont.gov/feed'],
    newsPages: ['https://ccb.vermont.gov/news'],
    regulationPages: ['https://ccb.vermont.gov/rules']
  },
  'ME': {
    agency: 'https://www.maine.gov/dafs/ocp',
    agencyName: 'Maine Office of Cannabis Policy',
    rssFeeds: [],
    newsPages: ['https://www.maine.gov/dafs/ocp/news'],
    regulationPages: ['https://www.maine.gov/dafs/ocp/rules-statutes']
  },
  'CT': {
    agency: 'https://portal.ct.gov/dcp/cannabis',
    agencyName: 'Connecticut Department of Consumer Protection',
    rssFeeds: [],
    newsPages: ['https://portal.ct.gov/dcp/news'],
    regulationPages: ['https://portal.ct.gov/dcp/cannabis/regulations']
  },
  'RI': {
    agency: 'https://ccc.ri.gov',
    agencyName: 'Rhode Island Cannabis Control Commission',
    rssFeeds: [],
    newsPages: ['https://ccc.ri.gov/news', 'https://governor.ri.gov/press-releases'],
    regulationPages: ['https://ccc.ri.gov/regulations']
  },
  'DE': {
    agency: 'https://omc.delaware.gov',
    agencyName: 'Delaware Office of the Marijuana Commissioner',
    rssFeeds: [],
    newsPages: ['https://news.delaware.gov/category/office-of-the-marijuana-commissioner/', 'https://omc.delaware.gov/news/'],
    regulationPages: ['https://omc.delaware.gov/adult/', 'https://omc.delaware.gov/regulations/']
  },
  'MN': {
    agency: 'https://mn.gov/ocm',
    agencyName: 'Minnesota Office of Cannabis Management',
    rssFeeds: [],
    newsPages: ['https://mn.gov/ocm/news/'],
    regulationPages: ['https://mn.gov/ocm/rules/']
  },
  'MT': {
    agency: 'https://mtrevenue.gov/cannabis',
    agencyName: 'Montana Department of Revenue - Cannabis Control Division',
    rssFeeds: [],
    newsPages: ['https://mtrevenue.gov/cannabis/news/'],
    regulationPages: ['https://mtrevenue.gov/cannabis/rules/']
  },
  'AK': {
    agency: 'https://www.commerce.alaska.gov/web/amco',
    agencyName: 'Alaska Alcohol and Marijuana Control Office',
    rssFeeds: [],
    newsPages: ['https://www.commerce.alaska.gov/web/amco/News.aspx'],
    regulationPages: ['https://www.commerce.alaska.gov/web/amco/MarijuanaRegulations.aspx']
  },

  // === MEDICAL-ONLY STATES ===
  'FL': {
    agency: 'https://knowthefactsmmj.com',
    agencyName: 'Florida Office of Medical Marijuana Use (OMMU)',
    rssFeeds: [],
    newsPages: ['https://knowthefactsmmj.com/about/weekly-updates/', 'https://www.floridahealth.gov/newsroom/'],
    regulationPages: ['https://knowthefactsmmj.com/about/', 'https://knowthefactsmmj.com/mmtc/']
  },
  'PA': {
    agency: 'https://www.pa.gov/agencies/health/programs/medical-marijuana',
    agencyName: 'Pennsylvania Department of Health',
    rssFeeds: [],
    newsPages: ['https://www.pa.gov/agencies/health/newsroom/'],
    regulationPages: ['https://www.pa.gov/agencies/health/programs/medical-marijuana/medical-marijuana-regulations/']
  },
  'OH': {
    agency: 'https://cannabis.ohio.gov',
    agencyName: 'Ohio Division of Cannabis Control',
    rssFeeds: [],
    newsPages: ['https://cannabis.ohio.gov/news'],
    regulationPages: ['https://cannabis.ohio.gov/rules']
  },
  'MD': {
    agency: 'https://cannabis.maryland.gov',
    agencyName: 'Maryland Cannabis Administration',
    rssFeeds: [],
    newsPages: ['https://cannabis.maryland.gov/news/'],
    regulationPages: ['https://cannabis.maryland.gov/regulations/']
  },
  'MO': {
    agency: 'https://cannabis.mo.gov',
    agencyName: 'Missouri Division of Cannabis Regulation',
    rssFeeds: [],
    newsPages: ['https://cannabis.mo.gov/news'],
    regulationPages: ['https://cannabis.mo.gov/rules-regulations']
  },
  'VA': {
    agency: 'https://www.cca.virginia.gov',
    agencyName: 'Virginia Cannabis Control Authority',
    rssFeeds: [],
    newsPages: ['https://www.cca.virginia.gov/news'],
    regulationPages: ['https://www.cca.virginia.gov/regulations']
  },
  'NM': {
    agency: 'https://www.rld.nm.gov/cannabis',
    agencyName: 'New Mexico Cannabis Control Division',
    rssFeeds: [],
    newsPages: ['https://www.rld.nm.gov/cannabis/news/'],
    regulationPages: ['https://www.rld.nm.gov/cannabis/rules-and-regulations/']
  },
  'KY': {
    agency: 'https://kymedcan.ky.gov',
    agencyName: 'Kentucky Office of Medical Cannabis',
    rssFeeds: [],
    newsPages: ['https://kymedcan.ky.gov/news', 'https://governor.ky.gov/news'],
    regulationPages: ['https://kymedcan.ky.gov/laws-and-regulations/Pages/Regulations.aspx']
  },
  'WV': {
    agency: 'https://omc.wv.gov',
    agencyName: 'West Virginia Office of Medical Cannabis',
    rssFeeds: [],
    newsPages: ['https://omc.wv.gov/news', 'https://governor.wv.gov/News/press-releases'],
    regulationPages: ['https://omc.wv.gov/rules/Pages/default.aspx']
  },
  'OK': {
    agency: 'https://oklahoma.gov/omma',
    agencyName: 'Oklahoma Medical Marijuana Authority',
    rssFeeds: [],
    newsPages: ['https://oklahoma.gov/omma/news.html'],
    regulationPages: ['https://oklahoma.gov/omma/rules.html']
  },
  'AR': {
    agency: 'https://www.dfa.arkansas.gov/abc',
    agencyName: 'Arkansas Alcoholic Beverage Control - Medical Marijuana',
    rssFeeds: [],
    newsPages: ['https://www.dfa.arkansas.gov/abc/news/'],
    regulationPages: ['https://www.dfa.arkansas.gov/abc/medical-marijuana/']
  },
  'LA': {
    agency: 'https://ldh.la.gov/page/medical-marijuana',
    agencyName: 'Louisiana Department of Health',
    rssFeeds: [],
    newsPages: ['https://ldh.la.gov/news'],
    regulationPages: ['https://ldh.la.gov/page/medical-marijuana']
  },
  'UT': {
    agency: 'https://medicalcannabis.utah.gov',
    agencyName: 'Utah Center for Medical Cannabis',
    rssFeeds: [],
    newsPages: ['https://medicalcannabis.utah.gov/news/'],
    regulationPages: ['https://medicalcannabis.utah.gov/rules/']
  },
  'MS': {
    agency: 'https://msdh.ms.gov/page/30,0,420.html',
    agencyName: 'Mississippi State Department of Health',
    rssFeeds: [],
    newsPages: ['https://msdh.ms.gov/page/23,0,news.html'],
    regulationPages: ['https://msdh.ms.gov/page/30,0,420.html']
  },
  'AL': {
    agency: 'https://amcc.alabama.gov',
    agencyName: 'Alabama Medical Cannabis Commission',
    rssFeeds: [],
    newsPages: ['https://amcc.alabama.gov/news/'],
    regulationPages: ['https://amcc.alabama.gov/rules/']
  },
  'HI': {
    agency: 'https://health.hawaii.gov/medicalcannabis',
    agencyName: 'Hawaii Department of Health',
    rssFeeds: [],
    newsPages: ['https://health.hawaii.gov/news/'],
    regulationPages: ['https://health.hawaii.gov/medicalcannabis/']
  },
  'NH': {
    agency: 'https://www.dhhs.nh.gov/programs-services/medicinal-therapeutic-cannabis',
    agencyName: 'New Hampshire Therapeutic Cannabis Program',
    rssFeeds: [],
    newsPages: ['https://www.dhhs.nh.gov/news'],
    regulationPages: ['https://www.dhhs.nh.gov/programs-services/medicinal-therapeutic-cannabis']
  },
  'ND': {
    agency: 'https://www.ndhealth.gov/mm',
    agencyName: 'North Dakota Department of Health',
    rssFeeds: [],
    newsPages: ['https://www.ndhealth.gov/news/'],
    regulationPages: ['https://www.ndhealth.gov/mm/']
  },
  'SD': {
    agency: 'https://doh.sd.gov/cannabis',
    agencyName: 'South Dakota Department of Health',
    rssFeeds: [],
    newsPages: ['https://doh.sd.gov/news/'],
    regulationPages: ['https://doh.sd.gov/cannabis/']
  },

  // === HEMP/CBD-ONLY STATES ===
  'TX': {
    agency: 'https://www.dshs.texas.gov/consumable-hemp-program',
    agencyName: 'Texas Department of State Health Services - Consumable Hemp Program',
    rssFeeds: [],
    newsPages: ['https://www.dshs.texas.gov/news-alerts/', 'https://texasagriculture.gov/News-Events/News-Releases'],
    regulationPages: ['https://www.dshs.texas.gov/consumable-hemp-program', 'https://texasagriculture.gov/Regulatory-Programs/Hemp']
  },
  'GA': {
    agency: 'https://www.gmcc.ga.gov',
    agencyName: 'Georgia Access to Medical Cannabis Commission',
    rssFeeds: [],
    newsPages: ['https://www.gmcc.ga.gov/news', 'https://agr.georgia.gov/news'],
    regulationPages: ['https://www.gmcc.ga.gov/regulations', 'https://agr.georgia.gov/hemp-program']
  },
  'NC': {
    agency: 'https://www.ncagr.gov/divisions/plant-industry/hemp-nc',
    agencyName: 'North Carolina Department of Agriculture - Plant Industry Division',
    rssFeeds: [],
    newsPages: ['https://www.ncagr.gov/news', 'https://governor.nc.gov/news/press-releases'],
    regulationPages: ['https://www.ncagr.gov/divisions/plant-industry/hemp-nc']
  },
  'SC': {
    agency: 'https://agriculture.sc.gov/divisions/consumer-protection/hemp/',
    agencyName: 'South Carolina Department of Agriculture - Hemp Farming Program',
    rssFeeds: [],
    newsPages: ['https://agriculture.sc.gov/news/'],
    regulationPages: ['https://agriculture.sc.gov/divisions/consumer-protection/hemp/']
  },
  'TN': {
    agency: 'https://www.tn.gov/agriculture/businesses/hemp.html',
    agencyName: 'Tennessee Department of Agriculture - Hemp Program',
    rssFeeds: [],
    newsPages: ['https://www.tn.gov/agriculture/news.html'],
    regulationPages: ['https://www.tn.gov/agriculture/businesses/hemp.html']
  },
  'KS': {
    agency: 'https://agriculture.ks.gov/divisions-programs/plant-protect-weed-control/industrial-hemp',
    agencyName: 'Kansas Department of Agriculture',
    rssFeeds: [],
    newsPages: ['https://agriculture.ks.gov/news-events/news-releases'],
    regulationPages: ['https://agriculture.ks.gov/divisions-programs/plant-protect-weed-control/industrial-hemp']
  },
  'NE': {
    agency: 'https://nda.nebraska.gov/hemp',
    agencyName: 'Nebraska Department of Agriculture',
    rssFeeds: [],
    newsPages: ['https://nda.nebraska.gov/news/'],
    regulationPages: ['https://nda.nebraska.gov/hemp/']
  },
  'WI': {
    agency: 'https://datcp.wi.gov/Pages/Programs_Services/Hemp.aspx',
    agencyName: 'Wisconsin Department of Agriculture',
    rssFeeds: [],
    newsPages: ['https://datcp.wi.gov/Pages/News_Media/NewsReleases.aspx'],
    regulationPages: ['https://datcp.wi.gov/Pages/Programs_Services/Hemp.aspx']
  },
  'IA': {
    agency: 'https://idph.iowa.gov/cbd',
    agencyName: 'Iowa Department of Public Health',
    rssFeeds: [],
    newsPages: ['https://idph.iowa.gov/News'],
    regulationPages: ['https://idph.iowa.gov/cbd']
  },
  'IN': {
    agency: 'https://www.in.gov/isdh/28278.htm',
    agencyName: 'Indiana State Department of Health',
    rssFeeds: [],
    newsPages: ['https://www.in.gov/isdh/news.htm'],
    regulationPages: ['https://www.in.gov/isdh/28278.htm']
  },
  'ID': {
    agency: 'https://agri.idaho.gov/main/plants/hemp/',
    agencyName: 'Idaho Department of Agriculture',
    rssFeeds: [],
    newsPages: ['https://agri.idaho.gov/main/news/'],
    regulationPages: ['https://agri.idaho.gov/main/plants/hemp/']
  },
  'WY': {
    agency: 'https://wyagric.state.wy.us/divisions/technical-services/hemp',
    agencyName: 'Wyoming Department of Agriculture',
    rssFeeds: [],
    newsPages: ['https://wyagric.state.wy.us/news'],
    regulationPages: ['https://wyagric.state.wy.us/divisions/technical-services/hemp']
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
          guid: guid || link
        });
      }
    }
    if (items.length === 0) {
      const entryMatches = xml.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi) || [];
      for (const entryXml of entryMatches) {
        const title = entryXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
        const link = entryXml.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1] || '';
        const summary = entryXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1]?.trim() || '';
        const published = entryXml.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1]?.trim() || '';
        const id = entryXml.match(/<id[^>]*>([\s\S]*?)<\/id>/i)?.[1]?.trim() || link;
        if (title && link) {
          items.push({
            title: decodeHTMLEntities(title),
            link: link.startsWith('http') ? link : new URL(link, baseUrl).href,
            description: decodeHTMLEntities(stripHTML(summary).substring(0, 1000)),
            pubDate: published,
            guid: id || link
          });
        }
      }
    }
  } catch (e) { console.error('RSS parsing error:', e); }
  return items;
}

function parseNewsPage(html: string, baseUrl: string): Array<{title: string; link: string; description: string; pubDate: string}> {
  const items: Array<any> = [];
  try {
    const patterns = [
      /<article[^>]*>[\s\S]*?<\/article>/gi,
      /<div[^>]*class="[^"]*(?:news|post|article|announcement|bulletin|update|press-release|release)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
      /<li[^>]*class="[^"]*(?:news|post|item|update)[^"]*"[^>]*>[\s\S]*?<\/li>/gi,
      /<tr[^>]*>[\s\S]*?<\/tr>/gi
    ];
    const seenLinks = new Set<string>();
    for (const pattern of patterns) {
      const matches = html.match(pattern) || [];
      for (const match of matches) {
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
          const headingMatch = match.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
          title = headingMatch ? stripHTML(headingMatch[1]).trim() : '';
        }
        if (!title || title.length < 5) continue;
        if (/^(home|about|contact|menu|nav|skip|search|login|sign)/i.test(title)) continue;
        const descMatch = match.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
        const description = descMatch ? stripHTML(descMatch[1]).trim().substring(0, 500) : '';
        const dateMatch = match.match(/(?:posted|published|date|updated)[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/i)
          || match.match(/<time[^>]*datetime=["']([^"']+)["']/i)
          || match.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
        const pubDate = dateMatch ? stripHTML(dateMatch[1]).trim() : '';
        items.push({ title: decodeHTMLEntities(title), link, description: decodeHTMLEntities(description), pubDate });
      }
      if (items.length >= 20) break;
    }
  } catch (e) { console.error('HTML parsing error:', e); }
  return items;
}

function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', 
    '&#39;': "'", '&nbsp;': ' ', '&ndash;': '-', '&mdash;': '—',
    '&rsquo;': "'", '&lsquo;': "'", '&rdquo;': '"', '&ldquo;': '"'
  };
  return text.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
}

async function analyzeWithOpenAI(title: string, description: string, agencyName: string, stateCode: string): Promise<{
  documentType: string; category: string; summary: string; relevanceScore: number; topics: string[];
  isDispensaryRelated: boolean; isLicensingRelated: boolean; isComplianceRelated: boolean; urgency: string;
}> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) return getDefaultAnalysis(title, description);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are a cannabis/hemp regulatory analyst. Analyze news items from state cannabis and hemp agencies for dispensary operators and hemp businesses. Return JSON with: documentType (one of: regulation, proposed_rule, final_rule, guidance, bulletin, memo, press_release, announcement, enforcement_action, license_update, policy_change, public_notice, emergency_rule, advisory), category, summary (1-2 sentences), relevanceScore (0-1), topics (array, max 5), isDispensaryRelated (bool), isLicensingRelated (bool), isComplianceRelated (bool), urgency (low/medium/high/critical).` 
          },
          { 
            role: 'user', 
            content: `Analyze this ${stateCode} cannabis/hemp item from ${agencyName}:\n\nTitle: ${title}\n\nDescription: ${description || 'No description'}\n\nReturn only valid JSON.` 
          }
        ],
        temperature: 0.3,
        max_tokens: 400
      })
    });
    if (!response.ok) return getDefaultAnalysis(title, description);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        documentType: DOCUMENT_TYPES.includes(parsed.documentType) ? parsed.documentType : 'announcement',
        category: parsed.category || 'Cannabis Regulations',
        summary: parsed.summary || description?.substring(0, 200) || title,
        relevanceScore: Math.min(1, Math.max(0, parsed.relevanceScore || 0.5)),
        topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 5) : [],
        isDispensaryRelated: Boolean(parsed.isDispensaryRelated),
        isLicensingRelated: Boolean(parsed.isLicensingRelated),
        isComplianceRelated: Boolean(parsed.isComplianceRelated),
        urgency: ['low', 'medium', 'high', 'critical'].includes(parsed.urgency) ? parsed.urgency : 'medium'
      };
    }
  } catch (e) { console.error('OpenAI error:', e); }
  return getDefaultAnalysis(title, description);
}

function getDefaultAnalysis(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();
  let documentType = 'announcement';
  if (text.includes('proposed') && text.includes('rule')) documentType = 'proposed_rule';
  else if (text.includes('final') && text.includes('rule')) documentType = 'final_rule';
  else if (text.includes('regulation')) documentType = 'regulation';
  else if (text.includes('guidance')) documentType = 'guidance';
  else if (text.includes('bulletin')) documentType = 'bulletin';
  else if (text.includes('memo')) documentType = 'memo';
  else if (text.includes('enforcement')) documentType = 'enforcement_action';
  else if (text.includes('license')) documentType = 'license_update';
  else if (text.includes('policy')) documentType = 'policy_change';
  else if (text.includes('notice')) documentType = 'public_notice';
  else if (text.includes('emergency')) documentType = 'emergency_rule';
  else if (text.includes('press release') || text.includes('press-release')) documentType = 'press_release';
  else if (text.includes('advisory')) documentType = 'advisory';
  
  const isDispensaryRelated = /dispensary|dispensaries|retail|storefront|mmtc|treatment center/.test(text);
  const isLicensingRelated = /license|licensing|application|permit|renewal|lottery/.test(text);
  const isComplianceRelated = /compliance|requirement|regulation|rule|violation|inspection/.test(text);
  
  let urgency = 'medium';
  if (text.includes('emergency') || text.includes('immediate') || text.includes('urgent')) urgency = 'critical';
  else if (text.includes('deadline') || text.includes('required') || text.includes('mandatory')) urgency = 'high';
  else if (text.includes('update') || text.includes('reminder')) urgency = 'low';
  
  const topics: string[] = [];
  if (isDispensaryRelated) topics.push('dispensary');
  if (isLicensingRelated) topics.push('licensing');
  if (isComplianceRelated) topics.push('compliance');
  if (text.includes('hemp')) topics.push('hemp');
  if (text.includes('medical')) topics.push('medical cannabis');
  if (text.includes('adult') || text.includes('recreational')) topics.push('adult-use');
  
  return {
    documentType, 
    category: 'Cannabis Regulations', 
    summary: description?.substring(0, 200) || title,
    relevanceScore: 0.5 + (isDispensaryRelated ? 0.2 : 0) + (isLicensingRelated ? 0.15 : 0) + (isComplianceRelated ? 0.15 : 0),
    topics, 
    isDispensaryRelated, 
    isLicensingRelated, 
    isComplianceRelated, 
    urgency
  };
}

async function fetchWithRetry(url: string, retries = 2): Promise<string | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });
      clearTimeout(timeoutId);
      if (response.ok) return await response.text();
      console.log(`Fetch failed for ${url}: ${response.status}`);
    } catch (e: any) {
      console.log(`Fetch error for ${url}: ${e.message}`);
      if (i === retries) return null;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { stateCode, fullScan = false, sessionId, sourceName } = body;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const updateProgress = async (updates: any) => {
      if (sessionId && sourceName) {
        await supabase.from('data_population_progress').update(updates).eq('session_id', sessionId).eq('source_name', sourceName);
      }
    };

    await updateProgress({ status: 'running', started_at: new Date().toISOString() });

    const { data: jurisdictions } = await supabase.from('jurisdiction').select('id, name, code').neq('code', 'US');

    const statesToProcess = stateCode 
      ? Object.entries(STATE_CANNABIS_SOURCES).filter(([code]) => code === stateCode)
      : Object.entries(STATE_CANNABIS_SOURCES);

    let recordsProcessed = 0;
    let newItemsFound = 0;
    const errors: string[] = [];
    const recentItems: any[] = [];

    const { data: existingItems } = await supabase
      .from('instrument')
      .select('external_id')
      .in('source', ['state_rss', 'state_news', 'state_regulations']);
    const existingIds = new Set((existingItems || []).map(i => i.external_id));

    console.log(`Processing ${statesToProcess.length} states (${stateCode || 'all'}), existing items: ${existingIds.size}`);

    for (const [code, sources] of statesToProcess) {
      const jurisdiction = jurisdictions?.find(j => j.code === code);
      if (!jurisdiction) {
        console.log(`No jurisdiction found for ${code}, skipping`);
        continue;
      }

      console.log(`Processing ${code} - ${sources.agencyName}`);
      
      // Process RSS feeds
      for (const feedUrl of sources.rssFeeds) {
        try {
          console.log(`Fetching RSS: ${feedUrl}`);
          const xml = await fetchWithRetry(feedUrl);
          if (xml) {
            const items = parseRSSFeed(xml, sources.agency);
            console.log(`Found ${items.length} RSS items from ${feedUrl}`);
            for (const item of items) {
              const externalId = `${code}-rss-${btoa(item.guid || item.link).substring(0, 50)}`;
              const isNew = !existingIds.has(externalId);
              if (!isNew && !fullScan) { recordsProcessed++; continue; }
              
              const analysis = await analyzeWithOpenAI(item.title, item.description, sources.agencyName, code);
              let effectiveDate = new Date().toISOString().split('T')[0];
              if (item.pubDate) { 
                try { 
                  const d = new Date(item.pubDate); 
                  if (!isNaN(d.getTime())) effectiveDate = d.toISOString().split('T')[0]; 
                } catch {} 
              }
              
              await supabase.from('instrument').upsert({
                external_id: externalId,
                title: item.title.substring(0, 500),
                description: analysis.summary || item.description?.substring(0, 2000),
                effective_date: effectiveDate,
                jurisdiction_id: jurisdiction.id,
                source: 'state_rss',
                url: item.link,
                metadata: { 
                  ...analysis, 
                  agencyName: sources.agencyName, 
                  sourceType: 'rss', 
                  feedUrl, 
                  analyzedAt: new Date().toISOString() 
                }
              }, { onConflict: 'external_id' });
              
              recordsProcessed++;
              if (isNew) {
                newItemsFound++;
                existingIds.add(externalId);
                recentItems.push({ 
                  state: code, 
                  title: item.title, 
                  type: analysis.documentType, 
                  urgency: analysis.urgency, 
                  isNew: true, 
                  link: item.link 
                });
              }
              await new Promise(r => setTimeout(r, 200));
            }
          }
        } catch (e: any) { 
          errors.push(`${code} RSS ${feedUrl}: ${e.message}`); 
          console.error(`Error processing RSS for ${code}:`, e);
        }
      }
      
      // Process news pages
      for (const newsUrl of sources.newsPages) {
        try {
          console.log(`Fetching news page: ${newsUrl}`);
          const html = await fetchWithRetry(newsUrl);
          if (html) {
            const items = parseNewsPage(html, sources.agency);
            console.log(`Found ${items.length} news items from ${newsUrl}`);
            for (const item of items) {
              const externalId = `${code}-news-${btoa(item.link).substring(0, 50)}`;
              const isNew = !existingIds.has(externalId);
              if (!isNew && !fullScan) { recordsProcessed++; continue; }
              
              const analysis = await analyzeWithOpenAI(item.title, item.description, sources.agencyName, code);
              let effectiveDate = new Date().toISOString().split('T')[0];
              if (item.pubDate) { 
                try { 
                  const d = new Date(item.pubDate); 
                  if (!isNaN(d.getTime())) effectiveDate = d.toISOString().split('T')[0]; 
                } catch {} 
              }
              
              await supabase.from('instrument').upsert({
                external_id: externalId,
                title: item.title.substring(0, 500),
                description: analysis.summary || item.description?.substring(0, 2000),
                effective_date: effectiveDate,
                jurisdiction_id: jurisdiction.id,
                source: 'state_news',
                url: item.link,
                metadata: { 
                  ...analysis, 
                  agencyName: sources.agencyName, 
                  sourceType: 'news', 
                  newsPageUrl: newsUrl, 
                  analyzedAt: new Date().toISOString() 
                }
              }, { onConflict: 'external_id' });
              
              recordsProcessed++;
              if (isNew) {
                newItemsFound++;
                existingIds.add(externalId);
                recentItems.push({ 
                  state: code, 
                  title: item.title, 
                  type: analysis.documentType, 
                  urgency: analysis.urgency, 
                  isNew: true, 
                  link: item.link 
                });
              }
              await new Promise(r => setTimeout(r, 200));
            }
          }
        } catch (e: any) { 
          errors.push(`${code} news ${newsUrl}: ${e.message}`); 
          console.error(`Error processing news for ${code}:`, e);
        }
      }
      
      await updateProgress({ 
        records_fetched: recordsProcessed, 
        metadata: { newItemsFound, statesProcessed: code } 
      });
    }

    await supabase.from('ingestion_log').insert({
      source: 'cannabis_hemp_poller',
      status: errors.length === 0 ? 'success' : (errors.length < statesToProcess.length ? 'partial' : 'error'),
      records_fetched: recordsProcessed,
      metadata: { 
        newItemsFound, 
        statesProcessed: statesToProcess.length,
        totalStatesAvailable: Object.keys(STATE_CANNABIS_SOURCES).length,
        errors: errors.slice(0, 10), 
        recentItems: recentItems.slice(0, 20), 
        fullScan, 
        stateCode: stateCode || 'all' 
      }
    });

    await updateProgress({ 
      status: 'completed', 
      records_fetched: recordsProcessed, 
      completed_at: new Date().toISOString(), 
      metadata: { newItemsFound, errors } 
    });

    console.log(`Completed: ${recordsProcessed} records processed, ${newItemsFound} new items found`);

    return new Response(JSON.stringify({ 
      success: true, 
      recordsProcessed, 
      newItemsFound, 
      statesProcessed: statesToProcess.length,
      totalStatesAvailable: Object.keys(STATE_CANNABIS_SOURCES).length,
      errors: errors.slice(0, 10), 
      recentItems: recentItems.slice(0, 20) 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Cannabis hemp poller error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

---

## Testing After Deployment

### Test Single State (Florida)

```bash
curl -X POST https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/cannabis-hemp-poller \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"stateCode": "FL"}'
```

### Test All 50 States

```bash
curl -X POST https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/cannabis-hemp-poller \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Expected Response

```json
{
  "success": true,
  "recordsProcessed": 145,
  "newItemsFound": 28,
  "statesProcessed": 50,
  "totalStatesAvailable": 50,
  "errors": [],
  "recentItems": [
    {
      "state": "FL",
      "title": "2024 OMMU Updates",
      "type": "announcement",
      "urgency": "medium",
      "isNew": true,
      "link": "https://knowthefactsmmj.com/..."
    }
  ]
}
```

---

## Troubleshooting

### No Jurisdiction Found

If you see "No jurisdiction found for XX, skipping", add the state to the `jurisdiction` table:

```sql
INSERT INTO jurisdiction (name, code, type) VALUES 
  ('State Name', 'XX', 'state')
ON CONFLICT (code) DO NOTHING;
```

### OpenAI Analysis Not Working

Check that `OPENAI_API_KEY` is set in your Supabase Edge Function secrets:
1. Go to Supabase Dashboard > Project Settings > Edge Functions
2. Add/verify the `OPENAI_API_KEY` secret

### Fetch Timeouts

Some state websites may block automated requests. The function uses:
- 15-second timeout
- 2 retries with exponential backoff
- Browser-like User-Agent header

---

## Scheduled Polling

The `scheduled-poller-cron` function should trigger the cannabis-hemp-poller every 6 hours. Verify it includes:

```typescript
// At hours 0, 6, 12, 18 UTC
if (hour % 6 === 0) {
  await fetch(`${supabaseUrl}/functions/v1/cannabis-hemp-poller`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
    body: JSON.stringify({ fullScan: false })
  });
}
```
