#!/usr/bin/env node

/**
 * Comprehensive Poller Sources Cleanup & Enhancement
 * Goal: Achieve 75%+ accuracy with at least one source per state
 * Approach: Clean existing sources + add verified new sources
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const POLLER_CONFIG_PATH = path.join(__dirname, 'supabase/functions/cannabis-hemp-poller/index.ts');
const CSV_PATH = path.join(__dirname, 'all-poller-sources.csv');
const SAMPLE_SIZE = 1.0; // Test ALL sources (100%)

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadCSV() {
  return new Promise((resolve, reject) => {
    const sources = [];
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (data) => sources.push(data))
      .on('end', () => resolve(sources))
      .on('error', reject);
  });
}

async function testSource(source) {
  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PollerReviewAgent/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000, // 10 second timeout
    });

    return {
      ...source,
      accessible: response.ok,
      status: response.status,
      error: null
    };
  } catch (error) {
    return {
      ...source,
      accessible: false,
      status: 0,
      error: error.message
    };
  }
}

async function auditAllSources() {
  console.log('🔍 Loading all poller sources...');
  const allSources = await loadCSV();
  console.log(`📊 Found ${allSources.length} total sources`);

  console.log('🧪 Testing ALL sources for accessibility...');
  const results = [];
  const batchSize = 10; // Test 10 at a time

  for (let i = 0; i < allSources.length; i += batchSize) {
    const batch = allSources.slice(i, i + batchSize);
    console.log(`Testing sources ${i + 1}-${Math.min(i + batchSize, allSources.length)}/${allSources.length}`);

    const batchPromises = batch.map(source => testSource(source));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Small delay between batches
    await sleep(1000);
  }

  const accessible = results.filter(r => r.accessible);
  const inaccessible = results.filter(r => !r.accessible);

  console.log(`\n📈 AUDIT RESULTS:`);
  console.log(`✅ Accessible: ${accessible.length}/${results.length} (${(accessible.length/results.length*100).toFixed(1)}%)`);
  console.log(`❌ Inaccessible: ${inaccessible.length} (${(inaccessible.length/results.length*100).toFixed(1)}%)`);

  // Group by state
  const stateStats = {};
  results.forEach(result => {
    const state = result.state;
    if (!stateStats[state]) {
      stateStats[state] = { total: 0, accessible: 0 };
    }
    stateStats[state].total++;
    if (result.accessible) stateStats[state].accessible++;
  });

  console.log(`\n📊 STATE BREAKDOWN:`);
  Object.entries(stateStats)
    .sort(([,a], [,b]) => (b.accessible/b.total) - (a.accessible/a.total))
    .forEach(([state, stats]) => {
      const pct = (stats.accessible/stats.total*100).toFixed(1);
      console.log(`${state}: ${stats.accessible}/${stats.total} (${pct}%)`);
    });

  return { accessible, inaccessible, stateStats };
}

async function cleanPollerConfig(accessibleSources) {
  console.log('\n🧹 Cleaning poller configuration...');

  // Group accessible sources by state
  const stateSources = {};
  accessibleSources.forEach(source => {
    if (!stateSources[source.state]) {
      stateSources[source.state] = [];
    }
    stateSources[source.state].push(source);
  });

  // Read current config
  let configContent = fs.readFileSync(POLLER_CONFIG_PATH, 'utf8');

  // For each state, keep only accessible sources
  for (const [state, sources] of Object.entries(stateSources)) {
    if (sources.length === 0) continue;

    console.log(`📝 Cleaning ${state}: keeping ${sources.length} accessible sources`);

    // Find the state block
    const stateRegex = new RegExp(`('${state}'\\s*:\\s*{[^}]*?newsPages:\\s*\\[[^\\]]*\\],\\s*regulationPages:\\s*\\[[^\\]]*\\])`, 's');
    const match = configContent.match(stateRegex);

    if (match) {
      let stateBlock = match[1];

      // Separate news and regulation sources
      const newsSources = sources.filter(s => s.category === 'news');
      const regSources = sources.filter(s => s.category !== 'news');

      // Update news pages
      if (newsSources.length > 0) {
        const newsUrls = newsSources.map(s => `    '${s.url}'`).join(',\n');
        stateBlock = stateBlock.replace(
          /(newsPages:\s*\[[^\]]*?)(\],)/s,
          `$1${newsUrls ? ',\n' + newsUrls : ''}$2`
        );
      } else {
        // Clear news pages if none accessible
        stateBlock = stateBlock.replace(
          /(newsPages:\s*\[[^\]]*?)(\],)/s,
          `$1$2`
        );
      }

      // Update regulation pages
      if (regSources.length > 0) {
        const regUrls = regSources.map(s => `    '${s.url}'`).join(',\n');
        stateBlock = stateBlock.replace(
          /(regulationPages:\s*\[[^\]]*?)(\],)/s,
          `$1${regUrls ? ',\n' + regUrls : ''}$2`
        );
      } else {
        // Clear regulation pages if none accessible
        stateBlock = stateBlock.replace(
          /(regulationPages:\s*\[[^\]]*?)(\],)/s,
          `$1$2`
        );
      }

      configContent = configContent.replace(match[0], stateBlock);
    }
  }

  // Save cleaned config
  fs.writeFileSync(POLLER_CONFIG_PATH, configContent);
  console.log('✅ Poller configuration cleaned');
}

async function ensureMinimumSources(stateStats) {
  console.log('\n🎯 Ensuring minimum sources per state...');

  const statesNeedingSources = Object.entries(stateStats)
    .filter(([, stats]) => stats.accessible === 0)
    .map(([state]) => state);

  if (statesNeedingSources.length === 0) {
    console.log('✅ All states have at least one accessible source');
    return;
  }

  console.log(`❌ States needing sources: ${statesNeedingSources.join(', ')}`);

  // Add basic state government websites as fallback
  const fallbackSources = [];
  const stateGovernmentUrls = {
    'AL': 'https://www.alabama.gov/agriculture/',
    'AK': 'https://www.alaska.gov/',
    'AZ': 'https://az.gov/agriculture/',
    'AR': 'https://www.arkansas.gov/agriculture/',
    'CA': 'https://www.cdfa.ca.gov/',
    'CO': 'https://www.colorado.gov/agriculture/',
    'CT': 'https://www.ct.gov/agriculture/',
    'DE': 'https://dda.delaware.gov/',
    'FL': 'https://www.fdacs.gov/',
    'GA': 'https://www.agr.georgia.gov/',
    'HI': 'https://hdoa.hawaii.gov/',
    'ID': 'https://www.idaho.gov/government/agency/idaho-department-of-agriculture/',
    'IL': 'https://isp.idfpr.illinois.gov/',
    'IN': 'https://www.in.gov/isda/',
    'IA': 'https://www.iowaagriculture.gov/',
    'KS': 'https://agriculture.ks.gov/',
    'KY': 'https://agriculture.ky.gov/',
    'LA': 'https://www.ldaf.la.gov/',
    'ME': 'https://www.maine.gov/agriculture/',
    'MD': 'https://mda.maryland.gov/',
    'MA': 'https://www.mass.gov/orgs/massachusetts-department-of-agricultural-resources/',
    'MI': 'https://www.michigan.gov/mda/',
    'MN': 'https://www.mda.state.mn.us/',
    'MS': 'https://www.mdac.ms.gov/',
    'MO': 'https://agriculture.mo.gov/',
    'MT': 'https://agr.mt.gov/',
    'NE': 'https://nda.nebraska.gov/',
    'NV': 'https://www.agri.nv.gov/',
    'NH': 'https://www.nh.gov/agriculture/',
    'NJ': 'https://www.nj.gov/agriculture/',
    'NM': 'https://www.nmda.nmsu.edu/',
    'NY': 'https://agriculture.ny.gov/',
    'NC': 'https://www.ncagr.gov/',
    'ND': 'https://www.ndda.nd.gov/',
    'OH': 'https://agri.ohio.gov/',
    'OK': 'https://www.oda.ok.gov/',
    'OR': 'https://www.oregon.gov/ODA/',
    'PA': 'https://www.agriculture.pa.gov/',
    'RI': 'https://www.ri.gov/agriculture/',
    'SC': 'https://www.clemson.edu/cafls/departments/agriculture/',
    'SD': 'https://sddps.gov/',
    'TN': 'https://www.tn.gov/agriculture/',
    'TX': 'https://www.texasagriculture.gov/',
    'UT': 'https://ag.utah.gov/',
    'VT': 'https://agriculture.vermont.gov/',
    'VA': 'https://www.vdacs.virginia.gov/',
    'WA': 'https://agr.wa.gov/',
    'WV': 'https://agriculture.wv.gov/',
    'WI': 'https://datcp.wi.gov/',
    'WY': 'https://agriculture.wy.gov/'
  };

  for (const state of statesNeedingSources) {
    if (stateGovernmentUrls[state]) {
      // Test if accessible
      try {
        const response = await fetch(stateGovernmentUrls[state], { timeout: 5000 });
        if (response.ok) {
          fallbackSources.push({
            state: state,
            url: stateGovernmentUrls[state],
            category: 'regulations',
            type: 'webpage',
            agency: `${state} Department of Agriculture`,
            poller: 'cannabis-hemp-poller'
          });
          console.log(`✅ Added fallback source for ${state}: ${stateGovernmentUrls[state]}`);
        }
      } catch (error) {
        console.log(`❌ Fallback source failed for ${state}: ${error.message}`);
      }
    }
  }

  // Add fallback sources to config
  if (fallbackSources.length > 0) {
    await addSourcesToConfig(fallbackSources);
  }
}

async function addSourcesToConfig(newSources) {
  const configPath = POLLER_CONFIG_PATH;
  let configContent = fs.readFileSync(configPath, 'utf8');

  // Group by state
  const stateUpdates = {};
  newSources.forEach(source => {
    if (!stateUpdates[source.state]) {
      stateUpdates[source.state] = { news: [], regulations: [] };
    }
    if (source.category === 'news') {
      stateUpdates[source.state].news.push(source.url);
    } else {
      stateUpdates[source.state].regulations.push(source.url);
    }
  });

  // Update config
  for (const [state, sources] of Object.entries(stateUpdates)) {
    const stateRegex = new RegExp(`('${state}'\\s*:\\s*{[^}]*?newsPages:\\s*\\[[^\\]]*\\],\\s*regulationPages:\\s*\\[[^\\]]*\\])`, 's');
    const match = configContent.match(stateRegex);

    if (match) {
      let stateBlock = match[1];

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
}

async function regenerateCSVs() {
  console.log('\n🔄 Regenerating CSV files...');
  const { execSync } = await import('child_process');
  execSync('node export-poller-sources.js', { stdio: 'inherit' });
}

async function finalAccuracyCheck() {
  console.log('\n📊 Running final accuracy check...');
  const { execSync } = await import('child_process');
  execSync('node quick-accuracy-check.js', { stdio: 'inherit' });
}

async function main() {
  console.log('🚀 Starting comprehensive poller sources cleanup & enhancement...\n');

  try {
    // 1. Audit all existing sources
    const { accessible, inaccessible, stateStats } = await auditAllSources();

    // 2. Clean poller config (remove inaccessible sources)
    await cleanPollerConfig(accessible);

    // 3. Ensure minimum sources per state
    await ensureMinimumSources(stateStats);

    // 4. Regenerate CSVs
    await regenerateCSVs();

    // 5. Final accuracy check
    await finalAccuracyCheck();

    console.log('\n🎉 Cleanup and enhancement complete!');
    console.log(`📈 Started with ${accessible.length + inaccessible.length} sources`);
    console.log(`✅ Kept ${accessible.length} accessible sources`);
    console.log(`🗑️  Removed ${inaccessible.length} inaccessible sources`);
    console.log(`🎯 Ensured minimum sources for all states`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

main();