import fs from 'fs';
import https from 'https';

// States with worst performance from latest check
const WORST_STATES = ['AZ', 'HI', 'ID', 'KS', 'MD', 'MI', 'MO', 'MS', 'MT', 'NH', 'NJ', 'NM', 'NV', 'NY', 'OK', 'OR', 'RI', 'VA', 'WV', 'WY'];

const BASE_URLS = {
  AZ: ['https://agriculture.az.gov', 'https://www.azag.gov', 'https://az.gov/agriculture'],
  HI: ['https://hdoa.hawaii.gov', 'https://agriculture.hi.gov', 'https://health.hawaii.gov'],
  ID: ['https://www.idahoagriculture.gov', 'https://agri.idaho.gov'],
  KS: ['https://agriculture.ks.gov', 'https://www.ksda.gov'],
  MD: ['https://mda.maryland.gov', 'https://agriculture.md.gov'],
  MI: ['https://www.michigan.gov/mda', 'https://www.michigan.gov/cra'],
  MO: ['https://agriculture.mo.gov', 'https://mda.mo.gov'],
  MS: ['https://www.mda.ms.gov', 'https://agriculture.ms.gov'],
  MT: ['https://agr.mt.gov', 'https://www.montana.gov/agriculture'],
  NH: ['https://agriculture.nh.gov', 'https://www.nh.gov/agriculture'],
  NJ: ['https://agriculture.nj.gov', 'https://www.nj.gov/agriculture'],
  NM: ['https://www.nmda.nmsu.edu', 'https://agriculture.nm.gov'],
  NV: ['https://www.agri.nv.gov', 'https://agriculture.nv.gov'],
  NY: ['https://agriculture.ny.gov', 'https://www.agriculture.ny.gov'],
  OK: ['https://www.oda.ok.gov', 'https://agriculture.ok.gov'],
  OR: ['https://www.oda.state.or.us', 'https://agriculture.or.gov'],
  RI: ['https://www.agriculture.ri.gov', 'https://agriculture.ri.gov'],
  VA: ['https://www.vdacs.virginia.gov', 'https://agriculture.virginia.gov'],
  WV: ['https://agriculture.wv.gov', 'https://www.wvagriculture.gov'],
  WY: ['https://agriculture.wy.gov', 'https://www.wyo.gov/agriculture']
};

const PATHS_TO_TRY = [
  '/hemp',
  '/industrial-hemp',
  '/cannabis',
  '/marijuana',
  '/plant-industries',
  '/plant-industry',
  '/ag-industries',
  '/agriculture',
  '/news',
  '/newsroom',
  '/press-releases',
  '/announcements',
  '/rules',
  '/regulations',
  '/laws',
  '/statutes'
];

async function testUrl(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function findWorkingSources() {
  const workingSources = {};

  for (const state of WORST_STATES) {
    workingSources[state] = { newsPages: [], regulationPages: [] };
    const bases = BASE_URLS[state] || [];

    console.log(`Testing sources for ${state}...`);

    for (const base of bases) {
      for (const path of PATHS_TO_TRY) {
        const url = base + path;
        const isWorking = await testUrl(url);

        if (isWorking) {
          if (path.includes('news') || path.includes('press') || path.includes('announcement')) {
            workingSources[state].newsPages.push(url);
          } else {
            workingSources[state].regulationPages.push(url);
          }
          console.log(`  ✓ ${url}`);
        }
      }
    }
  }

  return workingSources;
}

async function main() {
  console.log('Finding working sources for worst-performing states...\n');

  const workingSources = await findWorkingSources();

  // Read current poller config
  const pollerPath = 'supabase/functions/cannabis-hemp-poller/index.ts';
  let pollerContent = fs.readFileSync(pollerPath, 'utf8');

  let additionsCount = 0;

  // Add working sources to poller config
  for (const [state, sources] of Object.entries(workingSources)) {
    // Add news pages
    sources.newsPages.forEach(url => {
      if (!pollerContent.includes(url)) {
        const newsRegex = new RegExp(`('${state}': \\{[^}]*newsPages: \\[)`, 'g');
        if (newsRegex.test(pollerContent)) {
          pollerContent = pollerContent.replace(newsRegex, `$1\n    '${url}',`);
          additionsCount++;
          console.log(`Added news source: ${url} to ${state}`);
        }
      }
    });

    // Add regulation pages
    sources.regulationPages.forEach(url => {
      if (!pollerContent.includes(url)) {
        const regRegex = new RegExp(`('${state}': \\{[^}]*regulationPages: \\[)`, 'g');
        if (regRegex.test(pollerContent)) {
          pollerContent = pollerContent.replace(regRegex, `$1\n    '${url}',`);
          additionsCount++;
          console.log(`Added regulation source: ${url} to ${state}`);
        }
      }
    });
  }

  // Write back the updated config
  fs.writeFileSync(pollerPath, pollerContent);
  console.log(`\nAdded ${additionsCount} verified working sources.`);

  // Regenerate CSVs
  console.log('Regenerating CSV files...');
  await import('./export-poller-sources.js');
}

main().catch(console.error);