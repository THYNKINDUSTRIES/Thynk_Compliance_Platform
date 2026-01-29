#!/usr/bin/env node

/**
 * Targeted fix for failing cannabis agency URLs
 * Only updates states with confirmed failing URLs, keeps working ones intact
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// States with failing URLs that need fixes (from error_fetches_report.csv)
const failingStates = {
  'KY': { // 4 failures
    agency: 'https://kymedcan.ky.gov/',
    newsPages: ['https://legislature.ky.gov/news', 'https://governor.ky.gov/news'],
    regulationPages: ['https://legislature.ky.gov/laws/statutes']
  },
  'MI': { // 4 failures
    agency: 'https://www.michigan.gov/cra',
    newsPages: ['https://www.michigan.gov/news', 'https://legislature.mi.gov'],
    regulationPages: ['https://www.michigan.gov/cra/about/rules']
  },
  'AK': { // 3 failures
    agency: 'https://www.commerce.alaska.gov/web/cbpl/Marijuana.aspx',
    newsPages: ['https://www.alaska.gov/news', 'https://legislature.ak.gov/news.php'],
    regulationPages: ['https://www.commerce.alaska.gov/web/cbpl/Marijuana/StatutesRegulations.aspx']
  },
  'AR': { // 3 failures
    agency: 'https://www.arkansas.gov/amcc/',
    newsPages: ['https://www.arkansas.gov/news', 'https://www.arkansas.gov/governor/news'],
    regulationPages: ['https://www.arkansas.gov/amcc/rules-regulations/']
  },
  'CO': { // 3 failures - keep existing working URLs but add legislature backup
    newsPages: ['https://legislature.colorado.gov', 'https://www.colorado.gov/news'],
    regulationPages: ['https://legislature.colorado.gov']
  },
  'CT': { // 3 failures
    agency: 'https://portal.ct.gov/dcp/cannabis',
    newsPages: ['https://www.ct.gov/news', 'https://legislature.ct.gov'],
    regulationPages: ['https://portal.ct.gov/dcp/cannabis/regulations']
  },
  'DE': { // 3 failures
    newsPages: ['https://news.delaware.gov', 'https://legislature.delaware.gov'],
    regulationPages: ['https://omc.delaware.gov/regulations/']
  },
  'IN': { // 3 failures
    agency: 'https://www.in.gov/cannabis/',
    newsPages: ['https://www.in.gov/news', 'https://iga.in.gov/legislative/'],
    regulationPages: ['https://www.in.gov/cannabis/']
  },
  'KS': { // 3 failures
    agency: 'https://agriculture.ks.gov/divisions-programs/plant-protection-and-weed-control/hemp',
    newsPages: ['https://agriculture.ks.gov/news', 'https://www.kslegislature.org'],
    regulationPages: ['https://agriculture.ks.gov/divisions-programs/plant-protection-and-weed-control/hemp']
  },
  'LA': { // 3 failures
    agency: 'https://www.ldaf.state.la.us/medical-marijuana/',
    newsPages: ['https://www.ldaf.state.la.us/newsroom', 'https://legislature.la.gov'],
    regulationPages: ['https://www.ldaf.state.la.us/medical-marijuana/regulations/']
  },
  'MS': { // 3 failures
    agency: 'https://www.mda.ms.gov/divisions/hemp',
    newsPages: ['https://www.mda.ms.gov/news', 'https://www.legislature.ms.gov'],
    regulationPages: ['https://www.mda.ms.gov/hemp-program']
  },
  'MT': { // 3 failures
    agency: 'https://mt.gov/cannabis',
    newsPages: ['https://mt.gov/cannabis/news', 'https://leg.mt.gov'],
    regulationPages: ['https://mt.gov/cannabis/rules']
  },
  'NE': { // 3 failures
    agency: 'https://agr.nebraska.gov/hemp',
    newsPages: ['https://agr.nebraska.gov/news', 'https://legislature.nebraska.gov'],
    regulationPages: ['https://agr.nebraska.gov/hemp']
  },
  'NH': { // 3 failures
    agency: 'https://www.dhhs.nh.gov/programs-services/population-health/therapeutic-cannabis',
    newsPages: ['https://www.dhhs.nh.gov/news-events/press-releases', 'https://www.gencourt.state.nh.us'],
    regulationPages: ['https://www.dhhs.nh.gov/document/therapeutic-cannabis-program-data-report-2024']
  },
  'OH': { // 3 failures
    agency: 'https://cannabis.ohio.gov/',
    newsPages: ['https://cannabis.ohio.gov/news', 'https://www.legislature.ohio.gov'],
    regulationPages: ['https://cannabis.ohio.gov/rules']
  },
  'VT': { // 3 failures
    agency: 'https://ccb.vermont.gov/',
    newsPages: ['https://ccb.vermont.gov/news', 'https://legislature.vermont.gov'],
    regulationPages: ['https://ccb.vermont.gov/rules']
  },
  'AL': { // 2 failures
    newsPages: ['https://www.alabama.gov/newsroom', 'https://www.legislature.state.al.us'],
    regulationPages: ['https://amcc.alabama.gov/rules/']
  },
  'GA': { // 2 failures
    newsPages: ['https://www.gmcc.ga.gov/news', 'https://www.legis.ga.gov'],
    regulationPages: ['https://www.gmcc.ga.gov/regulations']
  },
  'ME': { // 2 failures
    newsPages: ['https://www.maine.gov/dafs/ocp/news', 'https://legislature.maine.gov'],
    regulationPages: ['https://www.maine.gov/dafs/ocp/rules-statutes']
  },
  'NV': { // 2 failures
    newsPages: ['https://ccb.nv.gov/news-events', 'https://www.leg.state.nv.us'],
    regulationPages: ['https://ccb.nv.gov/public-notices']
  },
  'OK': { // 2 failures
    newsPages: ['https://oklahoma.gov/omma/news.html', 'https://www.oklegislature.gov'],
    regulationPages: ['https://oklahoma.gov/omma/rules.html']
  },
  'RI': { // 2 failures
    newsPages: ['https://ccc.ri.gov/news', 'https://www.rilegislature.gov'],
    regulationPages: ['https://ccc.ri.gov/regulations']
  },
  'TN': { // 2 failures
    agency: 'https://www.tn.gov/agriculture/businesses/hemp.html',
    newsPages: ['https://www.tn.gov/news', 'https://wapp.capitol.tn.gov'],
    regulationPages: ['https://www.tn.gov/agriculture/businesses/hemp.html']
  },
  'UT': { // 2 failures
    newsPages: ['https://medicalcannabis.utah.gov/news/', 'https://le.utah.gov'],
    regulationPages: ['https://medicalcannabis.utah.gov/laws-and-rules/']
  },
  'WY': { // 2 failures
    agency: 'https://agriculture.wy.gov/divisions/hemp',
    newsPages: ['https://www.wyoleg.gov', 'https://governor.wyo.gov'],
    regulationPages: ['https://agriculture.wy.gov/divisions/hemp']
  }
};

async function updatePollerConfig() {
  console.log('🔧 Applying targeted fixes for failing states...');

  const pollerPath = path.join(__dirname, 'supabase/functions/cannabis-hemp-poller/index.ts');
  let pollerContent = fs.readFileSync(pollerPath, 'utf8');

  let updatedCount = 0;

  for (const [stateCode, updates] of Object.entries(failingStates)) {
    console.log(`\n🔍 Updating ${stateCode}...`);

    // Find the state entry in the poller config
    const stateRegex = new RegExp(`'${stateCode}': \\{[^}]+\\},`, 's');
    const match = pollerContent.match(stateRegex);

    if (!match) {
      console.warn(`⚠️  Could not find ${stateCode} in poller config`);
      continue;
    }

    const currentConfig = match[0];
    let newConfig = currentConfig;

    // Update agency if provided
    if (updates.agency) {
      const agencyRegex = /agency: '[^']*'/;
      newConfig = newConfig.replace(agencyRegex, `agency: '${updates.agency}'`);
      console.log(`  ✅ Updated agency: ${updates.agency}`);
    }

    // Update newsPages if provided
    if (updates.newsPages) {
      const newsRegex = /newsPages: \[[^\]]*\]/;
      const newsArray = updates.newsPages.map(url => `    '${url}'`).join(',\n');
      newConfig = newConfig.replace(newsRegex, `newsPages: [\n${newsArray}\n  ]`);
      console.log(`  ✅ Updated news pages: ${updates.newsPages.length} URLs`);
    }

    // Update regulationPages if provided
    if (updates.regulationPages) {
      const regRegex = /regulationPages: \[[^\]]*\]/;
      const regArray = updates.regulationPages.map(url => `    '${url}'`).join(',\n');
      newConfig = newConfig.replace(regRegex, `regulationPages: [\n${regArray}\n  ]`);
      console.log(`  ✅ Updated regulation pages: ${updates.regulationPages.length} URLs`);
    }

    // Replace in the main content
    pollerContent = pollerContent.replace(currentConfig, newConfig);
    updatedCount++;
  }

  // Write back the updated content
  fs.writeFileSync(pollerPath, pollerContent, 'utf8');
  console.log(`\n🎉 Updated ${updatedCount} states in poller configuration!`);

  // Test some of the updated URLs
  console.log('\n🧪 Testing some updated URLs...');
  const testUrls = [
    'https://legislature.ky.gov',
    'https://www.michigan.gov/news',
    'https://legislature.alaska.gov/news.php'
  ];

  for (const url of testUrls) {
    try {
      const response = await fetch(url, { timeout: 5000 });
      console.log(`✅ ${url}: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${url}: ${error.message}`);
    }
  }
}

// Run the update
updatePollerConfig().catch(console.error);