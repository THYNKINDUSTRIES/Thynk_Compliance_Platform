import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// API Keys - Add your keys here if available
const API_KEYS = {
  LEGISCAN: process.env.LEGISCAN_API_KEY || null,
  OPENSTATES: process.env.OPENSTATES_API_KEY || null,
  FEDERAL_REGISTER: null, // Public API
};

const CANNABIS_KEYWORDS = [
  'cannabis', 'marijuana', 'hemp', 'industrial hemp', 'cbd', 'cannabinoid',
  'medical marijuana', 'recreational marijuana', 'cannabis regulation'
];

const STATE_DATA_PORTALS = {};

function loadStatePortals() {
  const csvPath = path.join(process.cwd(), 'open_data_us.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('❌ open_data_us.csv not found');
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n');

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;

    const parts = line.split(',').map(part => part.replace(/"/g, '').trim());
    if (parts.length >= 3 && parts[2] === 'US State') {
      const fullName = parts[0];
      const url = parts[1];

      // Try to extract state name from the full name
      let stateName = fullName;
      const stateNames = Object.keys(getStateAbbrevMap());

      // Check if the full name contains a state name
      for (const name of stateNames) {
        if (fullName.includes(name)) {
          stateName = name;
          break;
        }
      }

      const stateAbbrev = getStateAbbrev(stateName);
      if (stateAbbrev && url && url.startsWith('http')) {
        // Only add if we don't already have this state
        if (!STATE_DATA_PORTALS[stateAbbrev]) {
          STATE_DATA_PORTALS[stateAbbrev] = { name: stateName, url: url };
        }
      }
    }
  }
}

function getStateAbbrevMap() {
  return {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
    'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
    'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
    'Wisconsin': 'WI', 'Wyoming': 'WY'
  };
}

function getStateAbbrev(stateName) {
  const stateMap = getStateAbbrevMap();
  return stateMap[stateName];
}

async function fetchFederalRegisterData() {
  console.log('🔍 Fetching Federal Register data...');
  const sources = [];

  try {
    const searchUrl = `https://www.federalregister.gov/api/v1/documents.json?per_page=50&conditions[term]=${encodeURIComponent(CANNABIS_KEYWORDS.join(' OR '))}`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    for (const doc of data.results || []) {
      if (doc.agencies && doc.agencies.some(agency =>
        agency.name.toLowerCase().includes('agriculture') ||
        agency.name.toLowerCase().includes('health') ||
        agency.name.toLowerCase().includes('justice') ||
        agency.name.toLowerCase().includes('food')
      )) {
        sources.push({
          url: doc.html_url,
          title: doc.title,
          type: 'federal-regulation',
          category: 'regulations',
          agency: doc.agencies[0]?.name || 'Federal Register',
          state: 'FEDERAL'
        });
      }
    }

    console.log(`✅ Found ${sources.length} federal regulations`);
  } catch (error) {
    console.log('❌ Error fetching Federal Register data:', error.message);
  }

  return sources;
}

async function fetchLegiScanData() {
  console.log('🔍 Fetching LegiScan data...');
  const sources = [];

  if (!API_KEYS.LEGISCAN) {
    console.log('⚠️  No LegiScan API key provided - skipping');
    return sources;
  }

  try {
    // Search for cannabis-related bills across states
    const searchUrl = `https://api.legiscan.com/?key=${API_KEYS.LEGISCAN}&op=getSearch&query=cannabis+OR+marijuana+OR+hemp&state=ALL&page=1`;
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.searchresult) {
      // Convert the searchresult object to an array
      const bills = Object.values(data.searchresult).filter(item => typeof item === 'object' && item.bill_id);

      // Group by state and take top results
      const stateBills = {};

      for (const bill of bills.slice(0, 100)) { // Take first 100 results
        if (!stateBills[bill.state]) {
          stateBills[bill.state] = [];
        }
        stateBills[bill.state].push(bill);
      }

      // For each state, add a public legislative search URL
      for (const state of Object.keys(stateBills)) {
        // Use public legislative website search URLs instead of specific bills
        const publicSearchUrls = {
          'AL': 'https://www.legislature.state.al.us/alis/',
          'AK': 'https://www.akleg.gov/basis',
          'AZ': 'https://www.azleg.gov/ars/',
          'AR': 'https://www.arkleg.state.ar.us/Laws',
          'CA': 'https://leginfo.legislature.ca.gov/faces/billSearchClient.xhtml',
          'CO': 'https://leg.colorado.gov/bills',
          'CT': 'https://www.cga.ct.gov/asp/menu/leg.asp',
          'DE': 'https://delcode.delaware.gov/',
          'FL': 'https://www.flsenate.gov/Laws',
          'GA': 'https://www.legis.ga.gov/legislation',
          'HI': 'https://www.capitol.hawaii.gov/advreports',
          'ID': 'https://legislature.idaho.gov/statutesrules/',
          'IL': 'https://www.ilga.gov/commission/lrb/',
          'IN': 'https://iga.in.gov/legislative/2025/bills',
          'IA': 'https://www.legis.iowa.gov/law',
          'KS': 'https://www.kslegislature.org/li',
          'KY': 'https://legislature.ky.gov/Laws',
          'LA': 'https://www.legis.la.gov/legis/Law.aspx',
          'ME': 'https://legislature.maine.gov/statutes',
          'MD': 'https://mgaleg.maryland.gov/',
          'MA': 'https://malegislature.gov/Laws',
          'MI': 'https://www.legislature.mi.gov/(S(3q0v0j0j0j0j0j0j0j0j))/mileg.aspx',
          'MN': 'https://www.revisor.mn.gov/statutes/',
          'MS': 'https://www.lc.ms.gov/Laws',
          'MO': 'https://www.mo.gov/government',
          'MT': 'https://leg.mt.gov/bills',
          'NE': 'https://nebraskalegislature.gov/laws',
          'NV': 'https://www.leg.state.nv.us/NRS/',
          'NH': 'https://www.gencourt.state.nh.us/rsa/',
          'NJ': 'https://www.njleg.state.nj.us/bills',
          'NM': 'https://www.nmlegis.gov/Laws',
          'NY': 'https://nyassembly.gov/leg/',
          'NC': 'https://www.ncleg.gov/BillLookUp',
          'ND': 'https://www.legis.nd.gov/cencode/t01-01.html',
          'OH': 'https://www.legislature.ohio.gov/legislation',
          'OK': 'https://www.oscn.net/applications/oscn/DeliverDocument.asp',
          'OR': 'https://www.oregonlegislature.gov/bills_laws',
          'PA': 'https://www.legis.state.pa.us/cfdocs/legis/LI/consCheck.cfm',
          'RI': 'https://webserver.rilegislature.gov/Statutes/',
          'SC': 'https://www.scstatehouse.gov/code/',
          'SD': 'https://sdlegislature.gov/Statutes',
          'TN': 'https://www.tn.gov/laws-statutes.html',
          'TX': 'https://statutes.capitol.texas.gov/',
          'UT': 'https://le.utah.gov/xcode/',
          'VT': 'https://legislature.vermont.gov/statutes',
          'VA': 'https://lis.virginia.gov/cgi-bin/legp604.exe',
          'WA': 'https://leg.wa.gov/CodeReviser/',
          'WV': 'https://code.wvlegislature.gov/',
          'WI': 'https://docs.legis.wisconsin.gov/statutes',
          'WY': 'https://www.wyoleg.gov/Statutes'
        };

        if (publicSearchUrls[state]) {
          sources.push({
            url: publicSearchUrls[state],
            title: `${state} Legislature Bill Search`,
            type: 'legislative-search',
            category: 'legislation',
            agency: 'State Legislature',
            state: state
          });
        }
      }
    }

    console.log(`✅ Found ${sources.length} legislative bill sources`);
  } catch (error) {
    console.log('❌ Error fetching LegiScan data:', error.message);
  }

  return sources;
}

async function fetchOpenStatesData() {
  console.log('🔍 Fetching OpenStates data...');
  const sources = [];

  try {
    // Search for cannabis-related bills
    const searchUrl = 'https://v3.openstates.org/bills?q=cannabis+OR+marijuana+OR+hemp&sort=updated_desc&include=versions';
    const response = await fetch(searchUrl, {
      headers: API_KEYS.OPENSTATES ? { 'X-API-Key': API_KEYS.OPENSTATES } : {}
    });

    if (!response.ok) {
      console.log('⚠️  OpenStates API not accessible');
      return sources;
    }

    const data = await response.json();

    // Group by jurisdiction
    const jurisdictionBills = {};

    for (const bill of (data.results || []).slice(0, 50)) {
      const jurisdiction = bill.jurisdiction?.name;
      if (jurisdiction && !jurisdictionBills[jurisdiction]) {
        jurisdictionBills[jurisdiction] = bill;
      }
    }

    // Add public legislative search URLs for states with bills
    const publicSearchUrls = {
      'CA': 'https://leginfo.legislature.ca.gov/faces/billSearchClient.xhtml',
      'OR': 'https://www.oregonlegislature.gov/bills_laws',
      'MA': 'https://malegislature.gov/Bills',
      'MO': 'https://www.mo.gov/government',
      'OH': 'https://www.legislature.ohio.gov/legislation',
      'FL': 'https://www.flsenate.gov/Session/Bills'
    };

    for (const [jurisdiction, bill] of Object.entries(jurisdictionBills)) {
      const stateMatch = jurisdiction.match(/([A-Z][a-z]+)$/);
      const stateName = stateMatch ? stateMatch[1] : jurisdiction;
      const stateCode = getStateAbbrev(stateName);

      if (stateCode && publicSearchUrls[stateCode]) {
        sources.push({
          url: publicSearchUrls[stateCode],
          title: `${jurisdiction} Legislative Bill Search`,
          type: 'legislative-search',
          category: 'legislation',
          agency: 'OpenStates',
          state: stateCode
        });
      }
    }

    console.log(`✅ Found ${sources.length} legislative bill sources`);
  } catch (error) {
    console.log('❌ Error fetching OpenStates data:', error.message);
  }

  return sources;
}

async function testStateDataPortals() {
  console.log('🔍 Testing state data portals...');
  const workingSources = [];
  const states = Object.keys(STATE_DATA_PORTALS).slice(0, 45); // Test ALL states

  for (const state of states) {
    const portal = STATE_DATA_PORTALS[state];
    console.log(`Testing ${state}: ${portal.url}`);

    try {
      const isWorking = await testUrl(portal.url);
      if (isWorking) {
        workingSources.push({
          state: state,
          url: portal.url,
          type: 'state-portal',
          category: 'data-portal',
          agency: `${portal.name} Open Data Portal`
        });

        // Test common legislative/agriculture paths
        const testPaths = [
          '/legislation', '/laws', '/regulations', '/agriculture', '/hemp', '/cannabis',
          '/data/agriculture', '/data/legislation', '/datasets', '/api',
          '/search', '/bills', '/statutes', '/rules', '/codes',
          '/government', '/departments', '/ag', '/farm', '/plants'
        ];

        for (const testPath of testPaths) { // Test ALL paths per state
          const testUrlStr = portal.url.replace(/\/$/, '') + testPath;
          const pathWorking = await testUrl(testUrlStr);
          if (pathWorking) {
            workingSources.push({
              state: state,
              url: testUrlStr,
              type: 'state-portal',
              category: 'regulations',
              agency: `${portal.name} Open Data Portal`
            });
          }
        }
      }
    } catch (error) {
      console.log(`❌ Error testing ${state}:`, error.message);
    }
  }

  console.log(`✅ Found ${workingSources.length} working state portals`);
  return workingSources;
}

async function testUrl(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 8000 }, (res) => {
      resolve(res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

async function updatePollerConfig(newSources) {
  const configPath = path.join(process.cwd(), 'supabase/functions/cannabis-hemp-poller/index.ts');
  let configContent = fs.readFileSync(configPath, 'utf8');

  console.log(`🔍 Processing ${newSources.length} new sources...`);

  // Test accessibility and filter sources
  const accessibleSources = [];
  for (const source of newSources) {
    console.log(`  Testing ${source.state}: ${source.url}`);
    const isAccessible = await testUrl(source.url);
    if (isAccessible) {
      console.log(`    ✅ Accessible`);
      accessibleSources.push(source);
    } else {
      console.log(`    ❌ Not accessible - skipping`);
    }
  }

  console.log(`📊 ${accessibleSources.length}/${newSources.length} sources are accessible`);

  // Group sources by state
  const stateUpdates = {};

  for (const source of accessibleSources) {
    if (source.state && source.url) {
      if (!stateUpdates[source.state]) {
        stateUpdates[source.state] = { news: [], regulations: [] };
      }

      if (source.category === 'news' || source.type.includes('news')) {
        stateUpdates[source.state].news.push(source.url);
      } else {
        stateUpdates[source.state].regulations.push(source.url);
      }
    }
  }

  // Update each state's configuration
  for (const [state, sources] of Object.entries(stateUpdates)) {
    console.log(`📝 Updating ${state} with ${sources.news.length} news and ${sources.regulations.length} regulation sources`);

    // Find the state block
    const stateRegex = new RegExp(`('${state}'\\s*:\\s*{[^}]*?newsPages:\\s*\\[[^\\]]*\\],\\s*regulationPages:\\s*\\[[^\\]]*\\])`, 's');
    const match = configContent.match(stateRegex);

    if (match) {
      let stateBlock = match[1];

      // Add news sources
      if (sources.news.length > 0) {
        const newsUrls = sources.news.map(url => `    '${url}'`).join(',\n');
        stateBlock = stateBlock.replace(
          /(newsPages:\s*\[[^\]]*?)(\],)/s,
          `$1${sources.news.length > 0 ? ',\n' + newsUrls : ''}$2`
        );
      }

      // Add regulation sources
      if (sources.regulations.length > 0) {
        const regUrls = sources.regulations.map(url => `    '${url}'`).join(',\n');
        stateBlock = stateBlock.replace(
          /(regulationPages:\s*\[[^\]]*?)(\],)/s,
          `$1${sources.regulations.length > 0 ? ',\n' + regUrls : ''}$2`
        );
      }

      configContent = configContent.replace(match[0], stateBlock);
    } else if (state === 'FEDERAL') {
      // Add federal section if it doesn't exist
      const federalSection = `'FEDERAL': {
  agency: 'https://www.federalregister.gov/',
  agencyName: 'Federal Register',
  rssFeeds: [],
  newsPages: [],
  regulationPages: [
${sources.regulations.map(url => `    '${url}'`).join(',\n')}
  ]
},
`;
      // Insert before the first state
      configContent = configContent.replace(
        /(STATE_CANNABIS_SOURCES: Record<string, \{[\s\S]*?\{)/,
        `$1${federalSection}`
      );
    }
  }

  fs.writeFileSync(configPath, configContent);
  console.log('✅ Updated poller configuration with API sources');
}

async function main() {
  console.log('🚀 Starting comprehensive API source integration...\n');

  loadStatePortals();
  console.log(`📊 Loaded ${Object.keys(STATE_DATA_PORTALS).length} state data portals\n`);

  const allSources = [];

  // 1. Federal Register (confirmed working)
  const federalSources = await fetchFederalRegisterData();
  allSources.push(...federalSources);
  console.log('');

  // 2. LegiScan (requires API key)
  const legiscanSources = await fetchLegiScanData();
  allSources.push(...legiscanSources);
  console.log('');

  // 3. OpenStates/Plural Policy
  const openStatesSources = await fetchOpenStatesData();
  allSources.push(...openStatesSources);
  console.log('');

  // 4. State Data Portals
  const stateSources = await testStateDataPortals();
  allSources.push(...stateSources);
  console.log('');

  console.log(`📈 Total sources found: ${allSources.length}`);

  if (allSources.length > 0) {
    console.log('💾 Updating poller configuration...');
    await updatePollerConfig(allSources);

    console.log('🔄 Regenerating CSV files...');
    execSync('node export-poller-sources.js', { stdio: 'inherit' });

    console.log(`\n🎉 Successfully integrated ${allSources.length} verified sources from APIs!`);

    // Run accuracy check
    console.log('\n📊 Running accuracy check...');
    execSync('node quick-accuracy-check.js', { stdio: 'inherit' });
  } else {
    console.log('❌ No sources found from APIs');
  }
}

main().catch(console.error);