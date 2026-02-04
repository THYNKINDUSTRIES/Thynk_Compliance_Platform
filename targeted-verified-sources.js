import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// States with fewest sources to prioritize
const TARGET_STATES = ['GA', 'MS', 'IL', 'IA', 'MD', 'MO'];

const STATE_BASE_URLS = {
  'GA': [
    'https://agr.georgia.gov',
    'https://www.agr.georgia.gov',
    'https://www.ga.gov/agriculture',
    'https://www.freshfromflorida.com' // Georgia uses Florida's site
  ],
  'MS': [
    'https://www.mda.ms.gov',
    'https://agriculture.ms.gov',
    'https://www.mdac.ms.gov'
  ],
  'IL': [
    'https://isp.idfpr.illinois.gov',
    'https://isp.ifpr.illinois.gov',
    'https://isp.il.gov',
    'https://isp.illinois.gov'
  ],
  'IA': [
    'https://www.iowaagriculture.gov',
    'https://www.iowa.gov/agriculture',
    'https://www.iowaag.gov'
  ],
  'MD': [
    'https://mda.maryland.gov',
    'https://www.mda.state.md.us',
    'https://egov.maryland.gov'
  ],
  'MO': [
    'https://agriculture.mo.gov',
    'https://www.mda.mo.gov',
    'https://dnr.mo.gov'
  ]
};

const COMMON_PATHS = {
  news: [
    '/news',
    '/newsroom',
    '/press-releases',
    '/announcements',
    '/updates',
    '/latest-news',
    '/media/news',
    '/about/news'
  ],
  regulations: [
    '/hemp',
    '/industrial-hemp',
    '/cannabis',
    '/marijuana',
    '/rules',
    '/regulations',
    '/laws',
    '/statutes',
    '/plant-industries/hemp',
    '/divisions/plant-protection/hemp',
    '/programs/hemp'
  ]
};

function testUrl(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 10000 }, (res) => {
      resolve({ url, status: res.statusCode, accessible: res.statusCode < 400 });
    });
    req.on('error', () => resolve({ url, status: null, accessible: false }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ url, status: null, accessible: false });
    });
    req.end();
  });
}

async function findSourcesForState(state) {
  console.log(`\nTesting sources for ${state}...`);
  const baseUrls = STATE_BASE_URLS[state];
  const workingSources = { news: [], regulations: [] };

  for (const baseUrl of baseUrls) {
    // Test base URL first
    const baseResult = await testUrl(baseUrl);
    if (!baseResult.accessible) continue;

    // Test news paths
    for (const newsPath of COMMON_PATHS.news) {
      const newsUrl = baseUrl + newsPath;
      const result = await testUrl(newsUrl);
      if (result.accessible) {
        workingSources.news.push(newsUrl);
        console.log(`  ✓ ${newsUrl}`);
      }
    }

    // Test regulation paths
    for (const regPath of COMMON_PATHS.regulations) {
      const regUrl = baseUrl + regPath;
      const result = await testUrl(regUrl);
      if (result.accessible) {
        workingSources.regulations.push(regUrl);
        console.log(`  ✓ ${regUrl}`);
      }
    }
  }

  return workingSources;
}

async function updatePollerConfig(updates) {
  const configPath = path.join(process.cwd(), 'supabase/functions/cannabis-hemp-poller/index.ts');
  let configContent = fs.readFileSync(configPath, 'utf8');

  for (const [state, sources] of Object.entries(updates)) {
    // Find the state block
    const stateRegex = new RegExp(`('${state}'\\s*:\\s*{[^}]*?newsPages:\\s*\\[[^\\]]*?\\],\\s*regulationPages:\\s*\\[[^\\]]*?\\])`, 's');
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
  console.log('Updated poller configuration');
}

async function main() {
  const updates = {};

  for (const state of TARGET_STATES) {
    const sources = await findSourcesForState(state);
    const totalAdded = sources.news.length + sources.regulations.length;

    if (totalAdded > 0) {
      updates[state] = sources;
      console.log(`Found ${totalAdded} working sources for ${state} (${sources.news.length} news, ${sources.regulations.length} reg)`);
    }
  }

  const totalAdded = Object.values(updates).reduce((sum, sources) =>
    sum + sources.news.length + sources.regulations.length, 0);

  if (totalAdded > 0) {
    await updatePollerConfig(updates);
    console.log(`\nAdded ${totalAdded} verified working sources to ${Object.keys(updates).length} states.`);

    // Regenerate CSV
    console.log('Regenerating CSV files...');
    const { execSync } = await import('child_process');
    execSync('node export-poller-sources.js', { stdio: 'inherit' });
  } else {
    console.log('No working sources found to add.');
  }
}

main().catch(console.error);