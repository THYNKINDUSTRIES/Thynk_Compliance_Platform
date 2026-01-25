export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // or 'https://www.thynkflow.io' change for prod
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const STATE_CANNABIS_SOURCES: Record<string, {
  agency: string;
  agencyName: string;
  rssFeeds: string[];
  newsPages: string[];
  regulationPages: string[];
}> = {
'AL': {
  agency: 'https://amcc.alabama.gov/',
  agencyName: 'Alabama Medical Cannabis Commission',
  rssFeeds: [],
  newsPages: [
    'https://amcc.alabama.gov/news/',
    'https://www.alabama.gov/newsroom/'
  ],
  regulationPages: [
    'https://amcc.alabama.gov/rules/'
  ]
},

'AK': {
  agency: 'https://www.commerce.alaska.gov/web/cbpl/Marijuana.aspx',
  agencyName: 'Alaska Marijuana Control Board',
  rssFeeds: [],
  newsPages: [
    'https://www.commerce.alaska.gov/web/cbpl/Marijuana/News.aspx'
  ],
  regulationPages: [
    'https://www.commerce.alaska.gov/web/cbpl/Marijuana/StatutesRegulations.aspx'
  ]
},

'AZ': {
  agency: 'https://www.azdhs.gov/licensing/marijuana/',
  agencyName: 'Arizona Department of Health Services – Marijuana Program',
  rssFeeds: [],
  newsPages: [
    'https://www.azdhs.gov/news/'
  ],
  regulationPages: [
    'https://www.azdhs.gov/licensing/marijuana/adult-use-marijuana/'
  ]
},

'AR': {
  agency: 'https://www.arkansas.gov/amcc/',
  agencyName: 'Arkansas Medical Marijuana Commission',
  rssFeeds: [],
  newsPages: [
    'https://www.arkansas.gov/amcc/news/'
  ],
  regulationPages: [
    'https://www.arkansas.gov/amcc/rules-regulations/'
  ]
},

'CA': {
  agency: 'https://www.cannabis.ca.gov/',
  agencyName: 'California Department of Cannabis Control',
  rssFeeds: [],
  newsPages: [
    'https://www.cannabis.ca.gov/about-us/announcements/',
    'https://www.cannabis.ca.gov/posts/'
  ],
  regulationPages: [
    'https://www.cannabis.ca.gov/cannabis-laws/dcc-regulations/'
  ]
},

'CO': {
  agency: 'https://sbg.colorado.gov/marijuana',
  agencyName: 'Colorado Marijuana Enforcement Division',
  rssFeeds: [],
  newsPages: [
    'https://sbg.colorado.gov/marijuana/news'
  ],
  regulationPages: [
    'https://sbg.colorado.gov/marijuana/rules'
  ]
},

'CT': {
  agency: 'https://portal.ct.gov/dcp/cannabis',
  agencyName: 'Connecticut Department of Consumer Protection – Cannabis',
  rssFeeds: [],
  newsPages: [
    'https://portal.ct.gov/dcp/news'
  ],
  regulationPages: [
    'https://portal.ct.gov/dcp/cannabis/regulations'
  ]
},

'DE': {
  agency: 'https://omc.delaware.gov/',
  agencyName: 'Delaware Office of the Marijuana Commissioner',
  rssFeeds: [],
  newsPages: [
    'https://omc.delaware.gov/news/',
    'https://news.delaware.gov/category/office-of-the-marijuana-commissioner/'
  ],
  regulationPages: [
    'https://omc.delaware.gov/regulations/'
  ]
},

'FL': {
  agency: 'https://knowthefactsmmj.com/',
  agencyName: 'Florida Office of Medical Marijuana Use',
  rssFeeds: [],
  newsPages: [
    'https://knowthefactsmmj.com/about/weekly-updates/',
    'https://www.floridahealth.gov/newsroom/'
  ],
  regulationPages: [
    'https://knowthefactsmmj.com/about/'
  ]
},

'GA': {
  agency: 'https://www.gmcc.ga.gov/',
  agencyName: 'Georgia Access to Medical Cannabis Commission',
  rssFeeds: [],
  newsPages: [
    'https://www.gmcc.ga.gov/news',
    'https://gov.georgia.gov/press-releases'
  ],
  regulationPages: [
    'https://www.gmcc.ga.gov/regulations'
  ]
}
,
'HI': {
  agency: 'https://health.hawaii.gov/medicalcannabis/',
  agencyName: 'Hawaii Department of Health – Medical Cannabis Program',
  rssFeeds: [],
  newsPages: [
    'https://health.hawaii.gov/news/'
  ],
  regulationPages: [
    'https://health.hawaii.gov/medicalcannabis/statutes-rules/'
  ]
},

'ID': {
  agency: 'https://agri.idaho.gov/main/hemp/',
  agencyName: 'Idaho State Department of Agriculture – Hemp Program',
  rssFeeds: [],
  newsPages: [
    'https://agri.idaho.gov/news/'
  ],
  regulationPages: [
    'https://agri.idaho.gov/main/hemp/'
  ]
},

'IL': {
  agency: 'https://idfpr.illinois.gov/profs/adultusecan.html',
  agencyName: 'Illinois Department of Financial and Professional Regulation – Cannabis',
  rssFeeds: [],
  newsPages: [
    'https://idfpr.illinois.gov/News.html'
  ],
  regulationPages: [
    'https://idfpr.illinois.gov/profs/adultusecan.html'
  ]
},

'IN': {
  agency: 'https://www.in.gov/cannabis/',
  agencyName: 'Indiana State Department of Health – Cannabis / Hemp',
  rssFeeds: [],
  newsPages: [
    'https://www.in.gov/news/'
  ],
  regulationPages: [
    'https://www.in.gov/cannabis/'
  ]
},

'IA': {
  agency: 'https://hhs.iowa.gov/medical-cannabis',
  agencyName: 'Iowa Department of Health and Human Services – Medical Cannabis',
  rssFeeds: [],
  newsPages: [
    'https://hhs.iowa.gov/news'
  ],
  regulationPages: [
    'https://hhs.iowa.gov/medical-cannabis'
  ]
},

'KS': {
  agency: 'https://agriculture.ks.gov/divisions-programs/plant-protection-and-weed-control/hemp',
  agencyName: 'Kansas Department of Agriculture – Hemp Program',
  rssFeeds: [],
  newsPages: [
    'https://agriculture.ks.gov/news'
  ],
  regulationPages: [
    'https://agriculture.ks.gov/divisions-programs/plant-protection-and-weed-control/hemp'
  ]
},

'KY': {
  agency: 'https://kymedcan.ky.gov/',
  agencyName: 'Kentucky Office of Medical Cannabis',
  rssFeeds: [],
  newsPages: [
    'https://kymedcan.ky.gov/news',
    'https://governor.ky.gov/news'
  ],
  regulationPages: [
    'https://kymedcan.ky.gov/laws-and-regulations/Pages/Regulations.aspx'
  ]
},

'LA': {
  agency: 'https://www.ldaf.state.la.us/medical-marijuana/',
  agencyName: 'Louisiana Department of Agriculture & Forestry – Medical Marijuana',
  rssFeeds: [],
  newsPages: [
    'https://www.ldaf.state.la.us/newsroom/'
  ],
  regulationPages: [
    'https://www.ldaf.state.la.us/medical-marijuana/regulations/'
  ]
},

'ME': {
  agency: 'https://www.maine.gov/dafs/ocp',
  agencyName: 'Maine Office of Cannabis Policy',
  rssFeeds: [],
  newsPages: [
    'https://www.maine.gov/dafs/ocp/news'
  ],
  regulationPages: [
    'https://www.maine.gov/dafs/ocp/rules-statutes'
  ]
},

'MD': {
  agency: 'https://cannabis.maryland.gov/',
  agencyName: 'Maryland Cannabis Administration',
  rssFeeds: [],
  newsPages: [
    'https://cannabis.maryland.gov/Pages/news.aspx'
  ],
  regulationPages: [
    'https://cannabis.maryland.gov/Pages/Laws-Regulations.aspx'
  ]
},
'MA': { 
   agency: 'https://masscannabiscontrol.com', 
   agencyName: 'Massachusetts Cannabis Control Commission', 
   rssFeeds: ['https://masscannabiscontrol.com/feed'], 
   newsPages: ['https://masscannabiscontrol.com/news', 'https://masscannabiscontrol.com/public-meetings'], 
   regulationPages: ['https://masscannabiscontrol.com/public-documents/regulations'] 
},
'MI': { 
   agency: 'https://www.michigan.gov/cra', 
   agencyName: 'Michigan Cannabis Regulatory Agency', 
   rssFeeds: [], 
   newsPages: ['https://www.michigan.gov/cra/news', 'https://www.michigan.gov/cra/about/bulletins'], 
   regulationPages: ['https://www.michigan.gov/cra/about/rules'] 
},
'MN': { 
   agency: 'https://mn.gov/ocm', 
   agencyName: 'Minnesota Office of Cannabis Management', 
   rssFeeds: [], 
   newsPages: ['https://mn.gov/ocm/media/news-releases/'], 
   regulationPages: [
    'https://mn.gov/ocm/laws/',
    'https://mn.gov/ocm/laws/rulemaking.jsp',
    'https://www.revisor.mn.gov/rules/9810/'
  ] 
},
'MS': { 
   agency: 'https://www.mda.ms.gov/divisions/hemp', 
   agencyName: 'Mississippi Department of Agriculture - Hemp', 
   rssFeeds: [], 
   newsPages: ['https://www.mda.ms.gov/news'], 
   regulationPages: ['https://www.mda.ms.gov/hemp-program'] 
},
'MO': { 
   agency: 'https://cannabis.mo.gov', 
   agencyName: 'Missouri Division of Cannabis Regulation', 
   rssFeeds: [], 
   newsPages: ['https://cannabis.mo.gov/news'], 
   regulationPages: ['https://cannabis.mo.gov/rules-regulations'] 
},
'MT': { 
   agency: 'https://mt.gov/cannabis', 
   agencyName: 'Montana Department of Revenue - Cannabis Control Division', 
   rssFeeds: [], 
   newsPages: ['https://mt.gov/cannabis/news'], 
   regulationPages: ['https://mt.gov/cannabis/rules'] 
},
'NE': { 
   agency: 'https://agr.nebraska.gov/hemp', 
   agencyName: 'Nebraska Department of Agriculture - Hemp', 
   rssFeeds: [], 
   newsPages: ['https://agr.nebraska.gov/news'], 
   regulationPages: ['https://agr.nebraska.gov/hemp'] 
},
'NV': { 
   agency: 'https://ccb.nv.gov', 
   agencyName: 'Nevada Cannabis Compliance Board', 
   rssFeeds: [], 
   newsPages: ['https://ccb.nv.gov/news-events', 'https://ccb.nv.gov/public-notices'], 
   regulationPages: ['https://ccb.nv.gov/laws-regulations'] 
},
'NH': {
  agency: 'https://www.dhhs.nh.gov/programs-services/population-health/therapeutic-cannabis',
  agencyName: 'New Hampshire Department of Health and Human Services - Therapeutic Cannabis Program',
  rssFeeds: [],
  newsPages: [
    'https://www.dhhs.nh.gov/news-events/press-releases',
    'https://www.dhhs.nh.gov/document/therapeutic-cannabis-program-data-report-2024'
  ],
  regulationPages: [
    'https://gc.nh.gov/rsa/html/x/126-x/126-x-mrg.htm',
    'https://gc.nh.gov/rules/state_agencies/he-c400.html'
  ]
},
'NJ': {
  agency: 'https://www.nj.gov/cannabis/',
  agencyName: 'New Jersey Cannabis Regulatory Commission',
  rssFeeds: [],
  newsPages: [
    'https://www.nj.gov/cannabis/news/'
  ],
  regulationPages: [
    'https://www.nj.gov/cannabis/resources/cannabis-laws/'
  ]
},

'NM': {
  agency: 'https://www.rld.nm.gov/cannabis/',
  agencyName: 'New Mexico Regulation & Licensing Department – Cannabis Control Division',
  rssFeeds: [],
  newsPages: [
    'https://www.rld.nm.gov/news/'
  ],
  regulationPages: [
    'https://www.rld.nm.gov/cannabis/rules-and-regulations/'
  ]
},

'NY': {
  agency: 'https://cannabis.ny.gov/',
  agencyName: 'New York Office of Cannabis Management',
  rssFeeds: [],
  newsPages: [
    'https://cannabis.ny.gov/pressroom'
  ],
  regulationPages: [
    'https://cannabis.ny.gov/marihuana-regulation-and-taxation-act-mrta'
  ]
},

'OH': {
  agency: 'https://cannabis.ohio.gov/',
  agencyName: 'Ohio Division of Cannabis Control',
  rssFeeds: [],
  newsPages: [
    'https://cannabis.ohio.gov/news'
  ],
  regulationPages: [
    'https://cannabis.ohio.gov/rules'
  ]
},

'OK': {
  agency: 'https://oklahoma.gov/omma.html',
  agencyName: 'Oklahoma Medical Marijuana Authority',
  rssFeeds: [],
  newsPages: [
    'https://oklahoma.gov/omma/news.html'
  ],
  regulationPages: [
    'https://oklahoma.gov/omma/rules.html'
  ]
},

'OR': {
  agency: 'https://www.oregon.gov/olcc/',
  agencyName: 'Oregon Liquor and Cannabis Commission',
  rssFeeds: [],
  newsPages: [
    'https://www.oregon.gov/olcc/Pages/news.aspx'
  ],
  regulationPages: [
    'https://www.oregon.gov/olcc/marijuana/Pages/Recreational-Marijuana-Laws-and-Rules.aspx'
  ]
},

'PA': {
  agency: 'https://www.health.pa.gov/topics/programs/Medical%20Marijuana',
  agencyName: 'Pennsylvania Department of Health – Medical Marijuana Program',
  rssFeeds: [],
  newsPages: [
    'https://www.health.pa.gov/topics/healthcare/Pages/News.aspx'
  ],
  regulationPages: [
    'https://www.health.pa.gov/topics/programs/Medical%20Marijuana/Pages/Regulations.aspx'
  ]
},
'RI': {
  agency: 'https://ccc.ri.gov/',
  agencyName: 'Rhode Island Cannabis Control Commission',
  rssFeeds: [],
  newsPages: [
    'https://ccc.ri.gov/news',
    'https://governor.ri.gov/press-releases'
  ],
  regulationPages: [
    'https://ccc.ri.gov/regulations',
    'https://rules.sos.ri.gov/regulations/part/230-80-05-1'
  ]
},
'SC': {
  agency: 'https://agriculture.sc.gov/divisions/consumer-protection/hemp/',
  agencyName: 'South Carolina Department of Agriculture – Hemp Program',
  rssFeeds: [],
  newsPages: [
    'https://agriculture.sc.gov/news/'
  ],
  regulationPages: [
    'https://www.scstatehouse.gov/code/t46c055.php'
  ]
},

'SD': {
  agency: 'https://medcannabis.sd.gov/',
  agencyName: 'South Dakota Department of Health – Medical Cannabis Program',
  rssFeeds: [],
  newsPages: [
    'https://medcannabis.sd.gov/Updates/News.aspx'
  ],
  regulationPages: [
    'https://medcannabis.sd.gov/About/Laws.aspx',
    'https://sdlegislature.gov/Statutes/34-20G'
  ]
},

'TN': {
  agency: 'https://www.tn.gov/agriculture/businesses/hemp.html',
  agencyName: 'Tennessee Department of Agriculture – Hemp Program',
  rssFeeds: [],
  newsPages: [
    'https://www.tn.gov/agriculture/news.html'
  ],
  regulationPages: [
    'https://www.tn.gov/agriculture/businesses/hemp.html',
    'https://www.tn.gov/agriculture/businesses/hemp/hemp-derived-cannabinoids.html'
  ]
},

'TX': {
  agency: 'https://www.dshs.texas.gov/consumable-hemp-program',
  agencyName: 'Texas Department of State Health Services – Consumable Hemp Program',
  rssFeeds: [],
  newsPages: [
    'https://www.dshs.texas.gov/news-alerts'
  ],
  regulationPages: [
    'https://www.dshs.texas.gov/consumable-hemp-program',
    'https://texasagriculture.gov/Regulatory-Programs/Hemp'
  ]
},

'UT': {
  agency: 'https://medicalcannabis.utah.gov/',
  agencyName: 'Utah Department of Health & Human Services – Medical Cannabis Program',
  rssFeeds: [],
  newsPages: [
    'https://medicalcannabis.utah.gov/news/'
  ],
  regulationPages: [
    'https://medicalcannabis.utah.gov/laws-and-rules/'
  ]
},

'VA': {
  agency: 'https://www.cca.virginia.gov/',
  agencyName: 'Virginia Cannabis Control Authority',
  rssFeeds: [],
  newsPages: [
    'https://www.cca.virginia.gov/news'
  ],
  regulationPages: [
    'https://www.cca.virginia.gov/regulations'
  ]
},

'VT': {
  agency: 'https://ccb.vermont.gov/',
  agencyName: 'Vermont Cannabis Control Board',
  rssFeeds: [
    'https://ccb.vermont.gov/feed'
  ],
  newsPages: [
    'https://ccb.vermont.gov/news'
  ],
  regulationPages: [
    'https://ccb.vermont.gov/rules'
  ]
},

'WA': {
  agency: 'https://lcb.wa.gov/',
  agencyName: 'Washington State Liquor and Cannabis Board',
  rssFeeds: [],
  newsPages: [
    'https://lcb.wa.gov/pressreleases'
  ],
  regulationPages: [
    'https://lcb.wa.gov/laws/laws-and-rules'
  ]
},

'WI': {
  agency: 'https://datcp.wi.gov/Pages/Programs_Services/Hemp.aspx',
  agencyName: 'Wisconsin Department of Agriculture, Trade and Consumer Protection – Hemp Program',
  rssFeeds: [],
  newsPages: [
    'https://datcp.wi.gov/Pages/News_Media/News.aspx'
  ],
  regulationPages: [
    'https://datcp.wi.gov/Pages/Programs_Services/Hemp.aspx'
  ]
},

'WV': {
  agency: 'https://omc.wv.gov/',
  agencyName: 'West Virginia Office of Medical Cannabis',
  rssFeeds: [],
  newsPages: [
    'https://omc.wv.gov/news'
  ],
  regulationPages: [
    'https://omc.wv.gov/rules/Pages/default.aspx',
    'https://code.wvlegislature.gov/16A/'
  ]
},

'WY': {
  agency: 'https://agriculture.wy.gov/divisions/hemp',
  agencyName: 'Wyoming Department of Agriculture – Hemp Program',
  rssFeeds: [],
  newsPages: [
    'https://agriculture.wy.gov/news'
  ],
  regulationPages: [
    'https://agriculture.wy.gov/divisions/hemp'
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

// TEMPORARY STUB: Use default analysis during lite testing
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
    category: 'cannabis',
    sub_category: 'other',
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
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { stateCode, fullScan = false, sessionId, sourceName } = body;

    // Ensure we have a valid UUID session id for DB operations. If the caller
    // provided an invalid value (for example a placeholder like "test-quick-<uuid>"),
    // generate a proper UUID server-side so upserts won't fail.
    let session_id = sessionId;
    try {
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!session_id || !uuidRegex.test(session_id)) {
        session_id = crypto.randomUUID();
        console.log('Generated session_id:', session_id);
      }
    } catch (e) {
      // Fallback: generate with crypto.randomUUID (Deno provides this)
      try {
        session_id = crypto.randomUUID();
      } catch (_) {
        session_id = String(Date.now());
      }
      console.log('Fallback generated session_id:', session_id);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // Prefer non-SUPABASE alias used in CI/Dashboard, then the official service role env,
    // then runtime alias `Supabase_API_Public`, and finally the anon key.
    // Order: `SERVICE_ROLE_KEY` -> `SUPABASE_SERVICE_ROLE_KEY` -> `Supabase_API_Public` -> `SUPABASE_ANON_KEY`.
    // Do NOT commit secrets to the repo.
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('Supabase_API_Public') || Deno.env.get('SUPABASE_ANON_KEY');
    const keySource = Deno.env.get('SERVICE_ROLE_KEY')
      ? 'service_role_alias_SERVICE_ROLE_KEY'
      : (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'service_role_SUPABASE_SERVICE_ROLE_KEY' : (Deno.env.get('Supabase_API_Public') ? 'alias_Supabase_API_Public' : (Deno.env.get('SUPABASE_ANON_KEY') ? 'anon' : 'none')));

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing SUPABASE_URL or SUPABASE keys. Ensure SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY is set.');
      return new Response(JSON.stringify({ success: false, error: 'Missing SUPABASE_URL or SUPABASE keys. Ensure SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY is set.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If only an anon key is available, fail loudly — anon keys cannot perform writes under RLS.
    if (keySource === 'anon') {
      console.error('Refusing to run poller with anon key: writes will be rejected by RLS. Map a service role secret (SERVICE_ROLE_KEY) in the project.');
      return new Response(JSON.stringify({ success: false, error: 'Server requires a Supabase service role key (SERVICE_ROLE_KEY). Do not use anon key for writes.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Log which key source is being used (do not log the key value itself)
    console.log('Using Supabase key source for DB operations:', keySource);

    const supabase = createClient(supabaseUrl, supabaseKey.trim());

    // basic counters and error collection (moved earlier so updateProgress can reference it)
    let recordsProcessed = 0;
    let newItemsFound = 0;
    const errors: string[] = [];
    const recentItems: any[] = [];

    const updateProgress = async (updates: any) => {
      if (session_id && sourceName) {
        const row = {
          session_id: session_id,
          source_name: sourceName,
          ...updates
        };
        const { data: pgData, error: pgError } = await supabase.from('data_population_progress').upsert(row, { onConflict: ['session_id', 'source_name'] });
        if (pgError) {
          console.error('data_population_progress upsert error:', pgError);
          errors.push(`progress_upsert:${pgError.message}`);
        }
        return pgData;
      }
      return null;
    };

    await updateProgress({ status: 'running', started_at: new Date().toISOString() });

    const { data: jurisdictions, error: jurisdictionsErr } = await supabase.from('jurisdiction').select('id, name, code').neq('code', 'US');
    if (jurisdictionsErr) {
      console.error('jurisdiction query error:', jurisdictionsErr);
      errors.push(`jurisdiction:${jurisdictionsErr.message}`);
    }

    const statesToProcess = stateCode
      ? Object.entries(STATE_CANNABIS_SOURCES).filter(([code]) => code === stateCode)
      : Object.entries(STATE_CANNABIS_SOURCES);

    const { data: existingItems, error: existingItemsErr } = await supabase
      .from('instrument')
      .select('external_id')
      .in('source', ['state_rss', 'state_news', 'state_regulations']);
    if (existingItemsErr) {
      console.error('existingItems query error:', existingItemsErr);
      errors.push(`existing_items:${existingItemsErr.message}`);
    }

    const existingIds = new Set((existingItems || []).map(i => i.external_id));

    for (const [code, sources] of statesToProcess) {
      const jurisdiction = jurisdictions?.find(j => j.code === code);
      if (!jurisdiction) continue;

      // RSS Feeds
      for (const feedUrl of sources.rssFeeds) {
        try {
          const xml = await fetchWithRetry(feedUrl);
          if (xml) {
            const items = parseRSSFeed(xml, sources.agency);
            for (const item of items) {
              const externalId = `${code}-rss-${btoa(item.guid || item.link).substring(0, 50)}`;
              const isNew = !existingIds.has(externalId);
              if (!isNew && !fullScan) { recordsProcessed++; continue; }

              const analysis = await analyzeWithOpenAI(item.title, item.description || '', sources.agencyName, code);
              let effectiveDate = new Date().toISOString().split('T')[0];
              if (item.pubDate) {
                try {
                  const d = new Date(item.pubDate);
                  if (!isNaN(d.getTime())) effectiveDate = d.toISOString().split('T')[0];
                } catch {}
              }

              const { data: upsertData, error: upsertErr } = await supabase.from('instrument').upsert({
                external_id: externalId,
                title: item.title.substring(0, 500),
                description: analysis.summary || item.description?.substring(0, 2000),
                effective_date: effectiveDate,
                jurisdiction_id: jurisdiction.id,
                source: 'state_rss',
                url: item.link,
                category: analysis.category || 'cannabis',
                sub_category: analysis.sub_category || 'other',
                metadata: {
                  ...analysis,
                  agencyName: sources.agencyName,
                  sourceType: 'rss',
                  feedUrl,
                  analyzedAt: new Date().toISOString()
                }
              }, { onConflict: 'external_id' });
              if (upsertErr) {
                console.error('instrument upsert error (rss):', upsertErr);
                errors.push(`${code} instrument_upsert_rss:${upsertErr.message}`);
              }
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
              await new Promise(r => setTimeout(r, 1000));
            }
          }
        } catch (e: any) {
          errors.push(`${code} RSS ${feedUrl}: ${e.message}`);
        }
      }

      // News Pages
      for (const newsUrl of sources.newsPages) {
        try {
          const html = await fetchWithRetry(newsUrl);
          if (html) {
            const items = parseNewsPage(html, sources.agency);
            for (const item of items) {
              const externalId = `${code}-news-${btoa(item.link).substring(0, 50)}`;
              const isNew = !existingIds.has(externalId);
              if (!isNew && !fullScan) { recordsProcessed++; continue; }

              const analysis = await analyzeWithOpenAI(item.title, item.description || '', sources.agencyName, code);

              let effectiveDate = new Date().toISOString().split('T')[0];
              if (item.pubDate) {
                try {
                  const d = new Date(item.pubDate);
                  if (!isNaN(d.getTime())) effectiveDate = d.toISOString().split('T')[0];
                } catch {}
              }

              const { data: upsertData2, error: upsertErr2 } = await supabase.from('instrument').upsert({
                external_id: externalId,
                title: item.title.substring(0, 500),
                description: analysis.summary || item.description?.substring(0, 2000),
                effective_date: effectiveDate,
                jurisdiction_id: jurisdiction.id,
                source: 'state_news',
                url: item.link,
                category: analysis.category || 'cannabis',
                sub_category: analysis.sub_category || 'other',
                metadata: {
                  ...analysis,
                  agencyName: sources.agencyName,
                  sourceType: 'news',
                  newsPageUrl: newsUrl,
                  analyzedAt: new Date().toISOString()
                }
              }, { onConflict: 'external_id' });
              if (upsertErr2) {
                console.error('instrument upsert error (news):', upsertErr2);
                errors.push(`${code} instrument_upsert_news:${upsertErr2.message}`);
              }
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
              await new Promise(r => setTimeout(r, 1000));
            }
          }
        } catch (e: any) {
          errors.push(`${code} news ${newsUrl}: ${e.message}`);
        }
      }

      await updateProgress({
        records_fetched: recordsProcessed,
        metadata: { newItemsFound, statesProcessed: code }
      });
    }

    const { data: ingestionData, error: ingestionErr } = await supabase.from('ingestion_log').insert({
      source: 'state_regulations_lite',
      status: errors.length === 0 ? 'success' : (errors.length < statesToProcess.length ? 'partial' : 'error'),
      records_fetched: recordsProcessed,
      metadata: {
        newItemsFound,
        statesProcessed: statesToProcess.length,
        errors: errors.slice(0, 10),
        recentItems: recentItems.slice(0, 20),
        fullScan,
        stateCode: stateCode || 'all'
      }
    });
    if (ingestionErr) {
      console.error('ingestion_log insert error:', ingestionErr);
      errors.push(`ingestion_log:${ingestionErr.message}`);
    }

    await updateProgress({
      status: 'completed',
      records_fetched: recordsProcessed,
      completed_at: new Date().toISOString(),
      metadata: { newItemsFound, errors }
    });

    return new Response(JSON.stringify({
      success: true,
      recordsProcessed,
      newItemsFound,
      statesProcessed: statesToProcess.length,
      errors: errors.slice(0, 10),
      recentItems: recentItems.slice(0, 20)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Poller lite error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function analyzeWithOpenAI(
  title: string,
  description: string,
  agencyName: string,
  stateCode: string
): Promise<{
  documentType: string;
  category: string;
  sub_category: string;
  summary: string;
  relevanceScore: number;
  topics: string[];
  isDispensaryRelated: boolean;
  isLicensingRelated: boolean;
  isComplianceRelated: boolean;
  urgency: string;
}> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    console.log('No OpenAI key — falling back to default analysis');
    return getDefaultAnalysis(title, description);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a cannabis regulatory analyst specializing in hemp, THC, and CBD. Analyze news items from state agencies for operators in the alternative wellness space. Return JSON with:
documentType (one of: ${DOCUMENT_TYPES.join(', ')}),
category ('cannabis' or 'hemp'),
sub_category (one of: 'medical', 'adult-use', 'hemp-derived', 'THC', 'CBD', 'other'),
summary (1-2 sentences),
relevanceScore (0-1),
topics (array, max 5),
isDispensaryRelated (bool),
isLicensingRelated (bool),
isComplianceRelated (bool),
urgency (low/medium/high/critical). Return ONLY valid JSON.`
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

    if (!response.ok) {
      console.log(`OpenAI API error: ${response.status} ${response.statusText}`);
      return getDefaultAnalysis(title, description);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        documentType: DOCUMENT_TYPES.includes(parsed.documentType) ? parsed.documentType : 'announcement',
        category: ['cannabis', 'hemp'].includes(parsed.category) ? parsed.category : 'cannabis',
        sub_category: ['medical', 'adult-use', 'hemp-derived', 'THC', 'CBD', 'other'].includes(parsed.sub_category)
          ? parsed.sub_category
          : 'other',
        summary: parsed.summary || description?.substring(0, 200) || title,
        relevanceScore: Math.min(1, Math.max(0, parsed.relevanceScore || 0.5)),
        topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 5) : [],
        isDispensaryRelated: Boolean(parsed.isDispensaryRelated),
        isLicensingRelated: Boolean(parsed.isLicensingRelated),
        isComplianceRelated: Boolean(parsed.isComplianceRelated),
        urgency: ['low', 'medium', 'high', 'critical'].includes(parsed.urgency) ? parsed.urgency : 'medium'
      };
    } else {
      console.log('No valid JSON from OpenAI');
      return getDefaultAnalysis(title, description);
    }
  } catch (e) {
    console.error('OpenAI error:', e);
    return getDefaultAnalysis(title, description);
  }
}

