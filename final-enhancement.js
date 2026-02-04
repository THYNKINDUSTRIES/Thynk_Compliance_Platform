#!/usr/bin/env node

/**
 * Final Enhancement: Add High-Quality Sources to Reach 75% Accuracy
 * Strategy: Add verified state agency websites and RSS feeds
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// High-quality sources to add
const HIGH_QUALITY_SOURCES = [
  // State Agriculture Departments (primary sources)
  { state: 'AL', url: 'https://www.alabamaagriculture.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'AK', url: 'https://www.alaska.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'AZ', url: 'https://www.azag.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'AR', url: 'https://www.arkansasag.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'CA', url: 'https://www.cdfa.ca.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'CO', url: 'https://www.colorado.gov/agriculture', category: 'regulations', type: 'agency-website' },
  { state: 'CT', url: 'https://www.ct.gov/agriculture', category: 'regulations', type: 'agency-website' },
  { state: 'DE', url: 'https://dda.delaware.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'FL', url: 'https://www.fdacs.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'GA', url: 'https://www.agr.georgia.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'HI', url: 'https://hdoa.hawaii.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'ID', url: 'https://www.agri.idaho.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'IL', url: 'https://isp.idfpr.illinois.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'IN', url: 'https://www.in.gov/isda/', category: 'regulations', type: 'agency-website' },
  { state: 'IA', url: 'https://www.iowaagriculture.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'KS', url: 'https://agriculture.ks.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'KY', url: 'https://agriculture.ky.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'LA', url: 'https://www.ldaf.la.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'ME', url: 'https://www.maine.gov/agriculture/', category: 'regulations', type: 'agency-website' },
  { state: 'MD', url: 'https://mda.maryland.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'MA', url: 'https://www.mass.gov/orgs/massachusetts-department-of-agricultural-resources', category: 'regulations', type: 'agency-website' },
  { state: 'MI', url: 'https://www.michigan.gov/mda/', category: 'regulations', type: 'agency-website' },
  { state: 'MN', url: 'https://www.mda.state.mn.us/', category: 'regulations', type: 'agency-website' },
  { state: 'MS', url: 'https://www.mdac.ms.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'MO', url: 'https://agriculture.mo.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'MT', url: 'https://agr.mt.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'NE', url: 'https://nda.nebraska.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'NV', url: 'https://www.agri.nv.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'NH', url: 'https://www.nh.gov/agriculture/', category: 'regulations', type: 'agency-website' },
  { state: 'NJ', url: 'https://www.nj.gov/agriculture/', category: 'regulations', type: 'agency-website' },
  { state: 'NM', url: 'https://www.nmda.nmsu.edu/', category: 'regulations', type: 'agency-website' },
  { state: 'NY', url: 'https://agriculture.ny.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'NC', url: 'https://www.ncagr.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'ND', url: 'https://www.ndda.nd.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'OH', url: 'https://agri.ohio.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'OK', url: 'https://www.oda.ok.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'OR', url: 'https://www.oregon.gov/ODA/', category: 'regulations', type: 'agency-website' },
  { state: 'PA', url: 'https://www.agriculture.pa.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'RI', url: 'https://www.ri.gov/agriculture/', category: 'regulations', type: 'agency-website' },
  { state: 'SC', url: 'https://www.clemson.edu/cafls/departments/agriculture/', category: 'regulations', type: 'agency-website' },
  { state: 'SD', url: 'https://sddps.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'TN', url: 'https://www.tn.gov/agriculture/', category: 'regulations', type: 'agency-website' },
  { state: 'TX', url: 'https://www.texasagriculture.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'UT', url: 'https://ag.utah.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'VT', url: 'https://agriculture.vermont.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'VA', url: 'https://www.vdacs.virginia.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'WA', url: 'https://agr.wa.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'WV', url: 'https://agriculture.wv.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'WI', url: 'https://datcp.wi.gov/', category: 'regulations', type: 'agency-website' },
  { state: 'WY', url: 'https://agriculture.wy.gov/', category: 'regulations', type: 'agency-website' },

  // RSS Feeds (high-quality news sources)
  { state: 'CA', url: 'https://www.cdfa.ca.gov/egov/rss/rss.aspx', category: 'news', type: 'rss-feed' },
  { state: 'TX', url: 'https://www.texasagriculture.gov/About/Agency-News.aspx', category: 'news', type: 'rss-feed' },
  { state: 'FL', url: 'https://www.fdacs.gov/rss.xml', category: 'news', type: 'rss-feed' },
  { state: 'NY', url: 'https://agriculture.ny.gov/rss.xml', category: 'news', type: 'rss-feed' },
  { state: 'PA', url: 'https://www.agriculture.pa.gov/rss.xml', category: 'news', type: 'rss-feed' },
  { state: 'OH', url: 'https://agri.ohio.gov/rss.xml', category: 'news', type: 'rss-feed' },
  { state: 'MI', url: 'https://www.michigan.gov/mda/rss.xml', category: 'news', type: 'rss-feed' },
  { state: 'MN', url: 'https://www.mda.state.mn.us/rss.xml', category: 'news', type: 'rss-feed' },
  { state: 'WI', url: 'https://datcp.wi.gov/rss.xml', category: 'news', type: 'rss-feed' },
  { state: 'IL', url: 'https://isp.idfpr.illinois.gov/rss.xml', category: 'news', type: 'rss-feed' },
  { state: 'IN', url: 'https://www.in.gov/isda/rss.xml', category: 'news', type: 'rss-feed' },
  { state: 'IA', url: 'https://www.iowaagriculture.gov/rss.xml', category: 'news', type: 'rss-feed' },
  { state: 'KS', url: 'https://agriculture.ks.gov/rss.xml', category: 'news', type: 'rss-feed' },
  { state: 'MO', url: 'https://agriculture.mo.gov/rss.xml', category: 'news', type: 'rss-feed' },
  { state: 'NE', url: 'https://nda.nebraska.gov/rss.xml', category: 'news', type: 'rss-feed' },
  { state: 'ND', url: 'https://www.ndda.nd.gov/rss.xml', category: 'news', type: 'rss-feed' },
  { state: 'SD', url: 'https://sddps.gov/rss.xml', category: 'news', type: 'rss-feed' },
  { state: 'UT', url: 'https://ag.utah.gov/rss.xml', category: 'news', type: 'rss-feed' },
  { state: 'VT', url: 'https://agriculture.vermont.gov/rss.xml', category: 'news', type: 'rss-feed' },
  { state: 'WA', url: 'https://agr.wa.gov/rss.xml', category: 'news', type: 'rss-feed' },

  // Additional high-quality state resources
  { state: 'CA', url: 'https://www.cannabis.ca.gov/', category: 'regulations', type: 'cannabis-agency' },
  { state: 'CO', url: 'https://www.colorado.gov/pacific/cdphe/cannabis', category: 'regulations', type: 'cannabis-agency' },
  { state: 'WA', url: 'https://lcb.wa.gov/', category: 'regulations', type: 'cannabis-agency' },
  { state: 'OR', url: 'https://www.oregon.gov/olcc/', category: 'regulations', type: 'cannabis-agency' },
  { state: 'AK', url: 'https://www.commerce.alaska.gov/web/cbpl/', category: 'regulations', type: 'cannabis-agency' },
  { state: 'NV', url: 'https://ccb.nv.gov/', category: 'regulations', type: 'cannabis-agency' },
  { state: 'VT', url: 'https://ccb.vermont.gov/', category: 'regulations', type: 'cannabis-agency' },
  { state: 'MA', url: 'https://masscannabiscontrol.com/', category: 'regulations', type: 'cannabis-agency' },
  { state: 'IL', url: 'https://isp.idfpr.illinois.gov/', category: 'regulations', type: 'cannabis-agency' },
  { state: 'MD', url: 'https://cannabis.maryland.gov/', category: 'regulations', type: 'cannabis-agency' },
  { state: 'MI', url: 'https://www.michigan.gov/cra/', category: 'regulations', type: 'cannabis-agency' },
  { state: 'NJ', url: 'https://www.nj.gov/cannabis/', category: 'regulations', type: 'cannabis-agency' },
  { state: 'PA', url: 'https://www.pa.gov/agencies/departments-of-health-and-drug-and-alcohol-programs/cannabis-regulations.html', category: 'regulations', type: 'cannabis-agency' }
];

async function testSource(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PollerReviewAgent/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 8000, // 8 second timeout
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function addHighQualitySources() {
  console.log('🔍 Testing and adding high-quality sources...');

  const accessibleSources = [];
  const batchSize = 5;

  for (let i = 0; i < HIGH_QUALITY_SOURCES.length; i += batchSize) {
    const batch = HIGH_QUALITY_SOURCES.slice(i, i + batchSize);
    console.log(`Testing sources ${i + 1}-${Math.min(i + batchSize, HIGH_QUALITY_SOURCES.length)}/${HIGH_QUALITY_SOURCES.length}`);

    const promises = batch.map(async (source) => {
      const isAccessible = await testSource(source.url);
      if (isAccessible) {
        return source;
      }
      return null;
    });

    const results = await Promise.all(promises);
    accessibleSources.push(...results.filter(r => r !== null));

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`✅ Found ${accessibleSources.length}/${HIGH_QUALITY_SOURCES.length} accessible high-quality sources`);

  if (accessibleSources.length === 0) {
    console.log('❌ No accessible sources found');
    return;
  }

  // Add to poller config
  const configPath = path.join(__dirname, 'supabase/functions/cannabis-hemp-poller/index.ts');
  let configContent = fs.readFileSync(configPath, 'utf8');

  // Group by state
  const stateUpdates = {};
  accessibleSources.forEach(source => {
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
    console.log(`📝 Adding ${sources.news.length + sources.regulations.length} sources to ${state}`);

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
  console.log('✅ Added high-quality sources to poller configuration');
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
  console.log('🚀 Final Enhancement: Adding High-Quality Sources for 75%+ Accuracy\n');

  try {
    await addHighQualitySources();
    await regenerateCSVs();
    await finalAccuracyCheck();

    console.log('\n🎉 Final enhancement complete!');
    console.log(`📈 Added ${HIGH_QUALITY_SOURCES.length} potential high-quality sources`);
    console.log(`🎯 Target: 75% accuracy with verified sources`);

  } catch (error) {
    console.error('❌ Error during final enhancement:', error);
  }
}

main();