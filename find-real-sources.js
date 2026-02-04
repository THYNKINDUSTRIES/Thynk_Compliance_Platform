#!/usr/bin/env node

/**
 * Find Real Sources: Research actual working URLs for states needing improvement
 */

async function testUrl(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Research/1.0)',
      },
      timeout: 10000,
    });
    return { url, status: response.status, ok: response.ok };
  } catch (e) {
    return { url, status: 0, ok: false };
  }
}

async function findSourcesForState(state) {
  console.log(`\nResearching sources for ${state}...`);

  // Common patterns to try
  const baseUrls = {
    'ND': ['https://www.ndda.nd.gov', 'https://www.nd.gov'],
    'SD': ['https://sddps.gov', 'https://www.sd.gov'],
    'WY': ['https://agriculture.wy.gov', 'https://www.wy.gov'],
    'VT': ['https://agriculture.vermont.gov', 'https://www.vt.gov'],
    'NH': ['https://www.nh.gov', 'https://agriculture.nh.gov'],
    'ME': ['https://www.maine.gov', 'https://agriculture.me.gov'],
    'RI': ['https://www.agriculture.ri.gov', 'https://www.ri.gov'],
    'DE': ['https://dda.delaware.gov', 'https://www.de.gov'],
    'HI': ['https://hdoa.hawaii.gov', 'https://www.hi.gov'],
    'AK': ['https://www.commerce.alaska.gov', 'https://www.ak.gov']
  };

  const patterns = [
    '/news',
    '/press-releases',
    '/announcements',
    '/hemp',
    '/industrial-hemp',
    '/cannabis',
    '/marijuana',
    '/agriculture',
    '/plant-industries',
    '/regulations',
    '/rules',
    '/laws'
  ];

  const foundSources = { news: [], regulations: [] };

  for (const base of baseUrls[state] || []) {
    for (const pattern of patterns) {
      const url = base + pattern;
      const result = await testUrl(url);

      if (result.ok) {
        // Check if it's news or regulations based on URL
        if (pattern.includes('news') || pattern.includes('press') || pattern.includes('announcement')) {
          foundSources.news.push(url);
        } else if (pattern.includes('regulat') || pattern.includes('rule') || pattern.includes('law')) {
          foundSources.regulations.push(url);
        } else if (pattern.includes('hemp') || pattern.includes('cannabis') || pattern.includes('marijuana')) {
          // Could be either, add to both for now
          foundSources.news.push(url);
          foundSources.regulations.push(url);
        }
      }
    }
  }

  console.log(`Found ${foundSources.news.length} news sources and ${foundSources.regulations.length} regulation sources`);

  return foundSources;
}

async function main() {
  const states = ['ND', 'SD', 'WY', 'VT', 'NH', 'ME', 'RI', 'DE', 'HI', 'AK'];

  console.log('=== FINDING REAL SOURCES FOR PHASE 1 IMPROVEMENT ===\n');

  const allFindings = {};

  for (const state of states) {
    allFindings[state] = await findSourcesForState(state);
  }

  console.log('\n=== SUMMARY OF FOUND SOURCES ===');

  let totalNews = 0;
  let totalReg = 0;

  for (const [state, sources] of Object.entries(allFindings)) {
    console.log(`\n${state}:`);
    console.log(`  News: ${sources.news.length}`);
    sources.news.forEach(url => console.log(`    ${url}`));
    console.log(`  Regulations: ${sources.regulations.length}`);
    sources.regulations.forEach(url => console.log(`    ${url}`));

    totalNews += sources.news.length;
    totalReg += sources.regulations.length;
  }

  console.log(`\nTOTAL FOUND: ${totalNews} news sources, ${totalReg} regulation sources`);

  // Save findings
  const fs = await import('fs');
  fs.writeFileSync('found-sources.json', JSON.stringify(allFindings, null, 2));
  console.log('\nFindings saved to found-sources.json');
}

main();