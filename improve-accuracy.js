#!/usr/bin/env node

/**
 * Phase 1 Accuracy Improvement: Target 75% accessible sources
 * Ensure every state has at least 2 sources
 */

import fs from 'fs';
import * as cheerio from 'cheerio';

const REPORT_FILE = 'poller-sources-review-report.json';

// States that need additional sources (based on analysis)
const STATES_NEEDING_SOURCES = [
  'ND', 'SD', 'WY', 'VT', 'NH', 'ME', 'RI', 'DE', 'HI', 'AK',
  'MT', 'NE', 'NV', 'NM', 'OK', 'WV', 'ID', 'KS', 'MS', 'SC'
];

// Additional sources to add for these states
const ADDITIONAL_SOURCES = {
  'ND': [
    { type: 'news', url: 'https://www.ndda.nd.gov/agriculture' },
    { type: 'regulations', url: 'https://www.ndda.nd.gov/industrial-hemp/rules' }
  ],
  'SD': [
    { type: 'news', url: 'https://sddps.gov/agriculture' },
    { type: 'regulations', url: 'https://sddps.gov/hemp/rules' }
  ],
  'WY': [
    { type: 'news', url: 'https://agriculture.wy.gov/agriculture' },
    { type: 'regulations', url: 'https://agriculture.wy.gov/divisions/hemp/rules' }
  ],
  'VT': [
    { type: 'news', url: 'https://agriculture.vermont.gov/agriculture' },
    { type: 'regulations', url: 'https://agriculture.vermont.gov/hemp/rules' }
  ],
  'NH': [
    { type: 'news', url: 'https://www.nh.gov/hemp/agriculture' },
    { type: 'regulations', url: 'https://www.nh.gov/hemp/rules' }
  ],
  'ME': [
    { type: 'news', url: 'https://www.maine.gov/agriculture' },
    { type: 'regulations', url: 'https://www.maine.gov/agriculture/hemp/rules' }
  ],
  'RI': [
    { type: 'news', url: 'https://www.agriculture.ri.gov/agriculture' },
    { type: 'regulations', url: 'https://www.agriculture.ri.gov/hemp/rules' }
  ],
  'DE': [
    { type: 'news', url: 'https://dda.delaware.gov/agriculture' },
    { type: 'regulations', url: 'https://dda.delaware.gov/hemp/rules' }
  ],
  'HI': [
    { type: 'news', url: 'https://hdoa.hawaii.gov/agriculture' },
    { type: 'regulations', url: 'https://hdoa.hawaii.gov/hemp/rules' }
  ],
  'AK': [
    { type: 'news', url: 'https://www.commerce.alaska.gov/web/cbpl' },
    { type: 'regulations', url: 'https://www.commerce.alaska.gov/web/cbpl/Hemp/rules' }
  ]
};

async function verifySource(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AccuracyImprovement/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 15000,
    });

    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');

    let hasHempContent = false;
    if (isHtml) {
      const content = await response.text();
      const $ = cheerio.load(content);
      const bodyText = $('body').text().toLowerCase();
      hasHempContent = bodyText.includes('hemp') || bodyText.includes('cannabis') ||
                       bodyText.includes('marijuana') || bodyText.includes('industrial');
    }

    return {
      url,
      status: response.status,
      accessible: response.ok && hasHempContent,
      hasHempContent,
      error: null
    };
  } catch (error) {
    return {
      url,
      status: 0,
      accessible: false,
      hasHempContent: false,
      error: error.message
    };
  }
}

async function analyzeAndImprove() {
  console.log('=== PHASE 1 ACCURACY IMPROVEMENT: TARGET 75% ===\n');

  // Load current report
  let report;
  try {
    report = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));
  } catch (e) {
    console.log('No existing report found, will create new one after verification');
    report = null;
  }

  if (report) {
    console.log(`Current status: ${report.summary.accessibleCount}/${report.totalSources} accessible (${(report.summary.accessibleCount/report.totalSources*100).toFixed(1)}%)`);
  }

  // Verify additional sources
  console.log('\nVerifying additional sources for states needing improvement...\n');

  const verifiedAdditions = {};

  for (const [state, sources] of Object.entries(ADDITIONAL_SOURCES)) {
    console.log(`Verifying sources for ${state}:`);
    verifiedAdditions[state] = { newsPages: [], regulationPages: [] };

    for (const source of sources) {
      console.log(`  Checking ${source.type}: ${source.url}`);
      const result = await verifySource(source.url);

      if (result.accessible) {
        if (source.type === 'news') {
          verifiedAdditions[state].newsPages.push(source.url);
        } else {
          verifiedAdditions[state].regulationPages.push(source.url);
        }
        console.log(`    ✅ Added (${result.status})`);
      } else {
        console.log(`    ❌ Rejected (${result.status}) - ${result.error || 'No hemp content'}`);
      }
    }

    console.log(`  Added: ${verifiedAdditions[state].newsPages.length} news, ${verifiedAdditions[state].regulationPages.length} regulations\n`);
  }

  // Update the poller file
  console.log('Updating poller configuration...\n');

  let pollerContent = fs.readFileSync('supabase/functions/cannabis-hemp-poller/index.ts', 'utf8');

  for (const [state, additions] of Object.entries(verifiedAdditions)) {
    if (additions.newsPages.length > 0 || additions.regulationPages.length > 0) {
      // Find the state entry
      const stateRegex = new RegExp(`('${state}': \\{[^}]*\\})`, 's');
      const match = pollerContent.match(stateRegex);

      if (match) {
        let stateEntry = match[1];

        // Add news pages
        if (additions.newsPages.length > 0) {
          const newsMatch = stateEntry.match(/(newsPages: \[([^\]]*)\])/);
          if (newsMatch) {
            const existingNews = newsMatch[2];
            const newNews = additions.newsPages.map(url => `    '${url}'`).join(',\n');
            const updatedNews = existingNews ? `${existingNews},\n${newNews}` : newNews;
            stateEntry = stateEntry.replace(newsMatch[1], `newsPages: [\n${updatedNews}\n  ]`);
          }
        }

        // Add regulation pages
        if (additions.regulationPages.length > 0) {
          const regMatch = stateEntry.match(/(regulationPages: \[([^\]]*)\])/);
          if (regMatch) {
            const existingReg = regMatch[2];
            const newReg = additions.regulationPages.map(url => `    '${url}'`).join(',\n');
            const updatedReg = existingReg ? `${existingReg},\n${newReg}` : newReg;
            stateEntry = stateEntry.replace(regMatch[1], `regulationPages: [\n${updatedReg}\n  ]`);
          }
        }

        pollerContent = pollerContent.replace(match[1], stateEntry);
        console.log(`✅ Updated ${state} with ${additions.newsPages.length + additions.regulationPages.length} new sources`);
      }
    }
  }

  fs.writeFileSync('supabase/functions/cannabis-hemp-poller/index.ts', pollerContent);

  // Regenerate CSV
  console.log('\nRegenerating CSV files...\n');
  const { spawn } = await import('child_process');
  await new Promise((resolve, reject) => {
    const child = spawn('node', ['export-poller-sources.js'], { stdio: 'inherit' });
    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ CSV files updated');
        resolve();
      } else {
        reject(new Error(`Export failed with code ${code}`));
      }
    });
  });

  // Run quick verification on updated sources
  console.log('\nRunning quick verification of improvements...\n');

  const quickResults = [];
  for (const [state, additions] of Object.entries(verifiedAdditions)) {
    for (const url of [...additions.newsPages, ...additions.regulationPages]) {
      const result = await verifySource(url);
      quickResults.push(result);
    }
  }

  const accessibleNew = quickResults.filter(r => r.accessible).length;
  const totalNew = quickResults.length;

  console.log(`\n=== IMPROVEMENT RESULTS ===`);
  console.log(`New sources added: ${totalNew}`);
  console.log(`New sources accessible: ${accessibleNew} (${(accessibleNew/totalNew*100).toFixed(1)}%)`);

  if (report) {
    const projectedTotal = report.totalSources + totalNew;
    const projectedAccessible = report.summary.accessibleCount + accessibleNew;
    const projectedAccuracy = (projectedAccessible / projectedTotal * 100).toFixed(1);

    console.log(`\nProjected totals:`);
    console.log(`Total sources: ${projectedTotal}`);
    console.log(`Accessible sources: ${projectedAccessible}`);
    console.log(`Accuracy: ${projectedAccuracy}%`);

    if (parseFloat(projectedAccuracy) >= 75) {
      console.log('🎉 TARGET ACHIEVED: 75% accuracy reached!');
    } else {
      console.log(`📈 Progress made, but need ${(75 - parseFloat(projectedAccuracy)).toFixed(1)}% more to reach target`);
    }
  }

  console.log('\nPhase 1 improvements complete. Run full review script to get updated comprehensive stats.');
}

analyzeAndImprove();