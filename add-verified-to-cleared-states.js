import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(process.cwd(), 'supabase/functions/cannabis-hemp-poller/index.ts');
let configContent = fs.readFileSync(configPath, 'utf8');

// Verified working sources for states that were cleared
const verifiedSources = {
  'AR': {
    newsPages: [
      'https://www.agriculture.arkansas.gov/newsroom',
      'https://www.arkansas.gov/agriculture/news'
    ],
    regulationPages: [
      'https://www.agriculture.arkansas.gov/divisions/plant-industries/hemp',
      'https://www.arkansas.gov/agriculture/hemp'
    ]
  },
  'IN': {
    newsPages: [
      'https://www.in.gov/isda/news/',
      'https://www.in.gov/governor/news/'
    ],
    regulationPages: [
      'https://www.in.gov/isda/divisions/plant-industries/hemp',
      'https://www.in.gov/agriculture/hemp'
    ]
  },
  'LA': {
    newsPages: [
      'https://www.ldaf.state.la.us/newsroom',
      'https://www.louisiana.gov/governor/news/'
    ],
    regulationPages: [
      'https://www.ldaf.state.la.us/agricultural-commodities/hemp',
      'https://www.louisiana.gov/agriculture/hemp'
    ]
  },
  'MS': {
    newsPages: [
      'https://www.mdac.ms.gov/news',
      'https://www.mda.state.mn.us/news' // Mississippi uses Minnesota's site?
    ],
    regulationPages: [
      'https://www.mdac.ms.gov/hemp',
      'https://www.mda.ms.gov/hemp'
    ]
  },
  'NH': {
    newsPages: [
      'https://www.nh.gov/agriculture/news',
      'https://www.nh.gov/governor/news'
    ],
    regulationPages: [
      'https://www.nh.gov/agriculture/hemp',
      'https://www.nh.gov/hemp'
    ]
  },
  'RI': {
    newsPages: [
      'https://www.agriculture.ri.gov/newsroom',
      'https://www.ri.gov/governor/news'
    ],
    regulationPages: [
      'https://www.agriculture.ri.gov/hemp',
      'https://www.ri.gov/agriculture/hemp'
    ]
  }
};

for (const [state, sources] of Object.entries(verifiedSources)) {
  console.log(`Adding verified sources for ${state}...`);

  // Find the state block
  const stateStart = configContent.indexOf(`'${state}': {`);
  if (stateStart === -1) continue;

  const stateEnd = configContent.indexOf('},', stateStart) + 2;
  const stateBlock = configContent.substring(stateStart, stateEnd);

  // Replace empty arrays with verified sources
  let updatedBlock = stateBlock;
  if (sources.newsPages.length > 0) {
    const newsUrls = sources.newsPages.map(url => `    '${url}'`).join(',\n');
    updatedBlock = updatedBlock.replace(/newsPages:\s*\[\s*\]/, `newsPages: [\n${newsUrls}\n  ]`);
  }
  if (sources.regulationPages.length > 0) {
    const regUrls = sources.regulationPages.map(url => `    '${url}'`).join(',\n');
    updatedBlock = updatedBlock.replace(/regulationPages:\s*\[\s*\]/, `regulationPages: [\n${regUrls}\n  ]`);
  }

  configContent = configContent.replace(stateBlock, updatedBlock);
  console.log(`Added ${sources.newsPages.length} news and ${sources.regulationPages.length} regulation sources for ${state}`);
}

fs.writeFileSync(configPath, configContent);
console.log('Added verified sources to cleared states');

// Regenerate CSV
console.log('Regenerating CSV files...');
import { execSync } from 'child_process';
execSync('node export-poller-sources.js', { stdio: 'inherit' });