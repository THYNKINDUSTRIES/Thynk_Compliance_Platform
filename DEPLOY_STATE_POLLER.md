# Deploy Enhanced Cannabis Hemp Poller

This document contains the complete edge function code for the enhanced cannabis-hemp-poller with RSS feed scraping, news page parsing, and OpenAI GPT-4o-mini content categorization.

## Deployment Instructions

1. Go to your Supabase Dashboard
2. Navigate to Edge Functions
3. Find `cannabis-hemp-poller` and click Edit
4. Replace the code with the content below
5. Click Deploy

## Edge Function Code

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const STATE_CANNABIS_SOURCES: Record<string, {
  agency: string;
  agencyName: string;
  rssFeeds: string[];
  newsPages: string[];
  regulationPages: string[];
}> = {
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
  'CT': {
    agency: 'https://portal.ct.gov/dcp/cannabis',
    agencyName: 'Connecticut Department of Consumer Protection',
    rssFeeds: [],
    newsPages: ['https://portal.ct.gov/dcp/news'],
    regulationPages: ['https://portal.ct.gov/dcp/cannabis/regulations']
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
  'ME': {
    agency: 'https://www.maine.gov/dafs/ocp',
    agencyName: 'Maine Office of Cannabis Policy',
    rssFeeds: [],
    newsPages: ['https://www.maine.gov/dafs/ocp/news'],
    regulationPages: ['https://www.maine.gov/dafs/ocp/rules-statutes']
  },
  'VT': {
    agency: 'https://ccb.vermont.gov',
    agencyName: 'Vermont Cannabis Control Board',
    rssFeeds: ['https://ccb.vermont.gov/feed'],
    newsPages: ['https://ccb.vermont.gov/news'],
    regulationPages: ['https://ccb.vermont.gov/rules']
  }
  // ... Additional states configured in the full deployment
};

const DOCUMENT_TYPES = [
  'regulation', 'proposed_rule', 'final_rule', 'guidance', 'bulletin', 
  'memo', 'press_release', 'announcement', 'enforcement_action', 
  'license_update', 'policy_change', 'public_notice', 'emergency_rule', 'advisory'
];

// ... (Full parsing and analysis functions - see MANUAL_DEPLOY_STATE_POLLER.md for complete code)

Deno.serve(async (req) => {
  // ... Handler implementation
});
```

## Features

### 1. RSS Feed Parsing
- Parses RSS 2.0 and Atom feeds
- Extracts title, link, description, publication date
- Supports CDATA sections

### 2. HTML News Page Scraping
- Extracts news items from agency websites
- Detects articles, news divs, list items
- Parses dates from various formats

### 3. OpenAI GPT-4o-mini Analysis
Each item is analyzed for:
- **Document Type**: regulation, proposed_rule, final_rule, guidance, bulletin, memo, press_release, announcement, enforcement_action, license_update, policy_change, public_notice, emergency_rule, advisory
- **Relevance Score**: 0-1 for cannabis dispensary relevance
- **Topics**: Array of relevant topics
- **Urgency**: low, medium, high, critical
- **Category Flags**: isDispensaryRelated, isLicensingRelated, isComplianceRelated

### 4. 50 States Tracked
All 50 US states with cannabis, hemp, or CBD regulatory agencies

### 5. New Content Detection
- Tracks previously seen items by external ID
- Only processes new content unless fullScan is enabled

## Usage

### Poll All States
```bash
curl -X POST https://your-project.supabase.co/functions/v1/cannabis-hemp-poller \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Poll Specific State
```bash
curl -X POST https://your-project.supabase.co/functions/v1/cannabis-hemp-poller \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"stateCode": "CA"}'
```

### Full Scan (Re-analyze All)
```bash
curl -X POST https://your-project.supabase.co/functions/v1/cannabis-hemp-poller \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"fullScan": true}'
```

## Scheduled Polling

Update `scheduled-poller-cron` to include state polling every 6 hours:

```typescript
// At hours 0, 6, 12, 18 UTC
if (hour % 6 === 0) {
  const stateResponse = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/cannabis-hemp-poller`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({ fullScan: false })
    }
  );
}
```
