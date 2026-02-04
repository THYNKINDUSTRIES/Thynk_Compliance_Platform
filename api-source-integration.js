import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keywords for cannabis/hemp regulations
const CANNABIS_KEYWORDS = [
  'cannabis', 'marijuana', 'hemp', 'industrial hemp', 'cbd', 'cannabinoid',
  'medical marijuana', 'recreational marijuana', 'cannabis regulation'
];

const STATE_DATA_PORTALS = {};

// Load state data portals from CSV
function loadStatePortals() {
  const csvPath = path.join(process.cwd(), 'open_data_us.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('open_data_us.csv not found');
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n');

  for (const line of lines.slice(1)) { // Skip header
    const parts = line.split(',');
    if (parts.length >= 3 && parts[2] === 'US State') {
      const stateName = parts[0];
      const url = parts[1];
      // Map state names to abbreviations
      const stateAbbrev = getStateAbbrev(stateName);
      if (stateAbbrev) {
        STATE_DATA_PORTALS[stateAbbrev] = { name: stateName, url: url };
      }
    }
  }
}

function getStateAbbrev(stateName) {
  const stateMap = {
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
  return stateMap[stateName];
}

async function fetchFederalRegisterData() {
  console.log('Fetching Federal Register data...');
  const sources = [];

  try {
    // Search for cannabis/hemp related documents
    const searchUrl = `https://www.federalregister.gov/api/v1/documents.json?per_page=100&conditions[term]=${encodeURIComponent(CANNABIS_KEYWORDS.join(' OR '))}`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    for (const doc of data.results || []) {
      if (doc.agencies && doc.agencies.some(agency =>
        agency.name.toLowerCase().includes('agriculture') ||
        agency.name.toLowerCase().includes('health') ||
        agency.name.toLowerCase().includes('justice')
      )) {
        sources.push({
          url: doc.html_url,
          title: doc.title,
          type: 'federal',
          category: 'regulations',
          agency: doc.agencies[0]?.name || 'Federal Register'
        });
      }
    }
  } catch (error) {
    console.log('Error fetching Federal Register data:', error.message);
  }

  return sources;
}

async function testStateDataPortals() {
  console.log('Testing state data portals...');
  const workingSources = [];

  for (const [state, portal] of Object.entries(STATE_DATA_PORTALS)) {
    try {
      console.log(`Testing ${state}: ${portal.url}`);

      // Test the main portal URL
      const isWorking = await testUrl(portal.url);
      if (isWorking) {
        workingSources.push({
          state: state,
          url: portal.url,
          type: 'state-portal',
          category: 'data-portal',
          agency: `${portal.name} Open Data Portal`
        });

        // Try common legislative/agriculture paths
        const testPaths = [
          '/legislation', '/laws', '/regulations', '/agriculture', '/hemp', '/cannabis',
          '/data/agriculture', '/data/legislation', '/datasets'
        ];

        for (const testPath of testPaths) {
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
      console.log(`Error testing ${state}:`, error.message);
    }
  }

  return workingSources;
}

async function testUrl(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 10000 }, (res) => {
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

async function checkPluralPolicyAPI() {
  console.log('Checking Plural Policy (OpenStates) API...');
  const sources = [];

  try {
    // Try to get jurisdictions
    const jurisdictionsUrl = 'https://open.pluralpolicy.com/api/v1/jurisdictions/';
    const response = await fetch(jurisdictionsUrl);
    const data = await response.json();

    for (const jurisdiction of data.results || []) {
      if (jurisdiction.name && jurisdiction.url) {
        sources.push({
          url: jurisdiction.url,
          title: `${jurisdiction.name} Legislative Data`,
          type: 'legislative-api',
          category: 'legislation',
          agency: 'Plural Policy (OpenStates)'
        });
      }
    }
  } catch (error) {
    console.log('Plural Policy API not accessible:', error.message);
  }

  return sources;
}

async function updatePollerConfig(newSources) {
  const configPath = path.join(process.cwd(), 'supabase/functions/cannabis-hemp-poller/index.ts');
  let configContent = fs.readFileSync(configPath, 'utf8');

  // Group sources by state
  const stateUpdates = {};

  for (const source of newSources) {
    if (source.state && source.url) {
      if (!stateUpdates[source.state]) {
        stateUpdates[source.state] = { news: [], regulations: [] };
      }

      if (source.category === 'news' || source.type === 'news') {
        stateUpdates[source.state].news.push(source.url);
      } else {
        stateUpdates[source.state].regulations.push(source.url);
      }
    }
  }

  // Update each state's configuration
  for (const [state, sources] of Object.entries(stateUpdates)) {
    console.log(`Updating ${state} with ${sources.news.length} news and ${sources.regulations.length} regulation sources`);

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
    }
  }

  fs.writeFileSync(configPath, configContent);
  console.log('Updated poller configuration with API sources');
}

async function main() {
  console.log('Starting API source integration...');
  loadStatePortals();
  console.log(`Loaded ${Object.keys(STATE_DATA_PORTALS).length} state data portals`);

  const allSources = [];

  // 1. Federal Register sources
  console.log('Fetching Federal Register data...');
  const federalSources = await fetchFederalRegisterData();
  console.log(`Found ${federalSources.length} federal sources`);
  allSources.push(...federalSources.map(s => ({ ...s, state: 'FEDERAL' })));

  // 2. State data portals
  console.log('Testing state data portals...');
  const stateSources = await testStateDataPortals();
  console.log(`Found ${stateSources.length} state portal sources`);
  allSources.push(...stateSources);

  // 3. Plural Policy (OpenStates) sources
  console.log('Checking Plural Policy API...');
  const pluralSources = await checkPluralPolicyAPI();
  console.log(`Found ${pluralSources.length} legislative sources`);
  allSources.push(...pluralSources);

  console.log(`\nTotal sources found: ${allSources.length}`);

  if (allSources.length > 0) {
    console.log('Updating poller config...');
    await updatePollerConfig(allSources);

    // Regenerate CSV
    console.log('Regenerating CSV files...');
    execSync('node export-poller-sources.js', { stdio: 'inherit' });

    console.log(`\n✅ Successfully added ${allSources.length} verified sources from APIs`);
  } else {
    console.log('❌ No sources found from APIs');
  }
}

main().catch(console.error);