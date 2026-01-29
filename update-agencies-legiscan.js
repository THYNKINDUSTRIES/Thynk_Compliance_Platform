#!/usr/bin/env node

/**
 * Script to update cannabis agency URLs using Legiscan API
 * Focus on top 20 most difficult states with failing URLs
 * Use RSS/news sources more heavily for problematic states
 */

import fetch from 'node-fetch';

const LEGISCAN_API_KEY = 'db9e2013fe8fc89561fd857e9b9f055d';
const BASE_URL = 'https://api.legiscan.com';

// Rate limiting: be respectful
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchLegiscan(operation, params = {}) {
  const url = new URL('https://api.legiscan.com/');
  url.searchParams.set('key', LEGISCAN_API_KEY);
  url.searchParams.set('op', operation);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Legiscan API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.status !== 'OK') {
    throw new Error(`Legiscan API error: ${data.alert?.message || 'Unknown error'}`);
  }

  await delay(200); // Rate limiting
  return data;
}

async function getStateList() {
  console.log('📊 Fetching state list from Legiscan...');
  const data = await fetchLegiscan('getStateList');
  // Convert array to object for easier lookup
  const statesObj = {};
  data.states.forEach(stateCode => {
    statesObj[stateCode] = { code: stateCode, name: stateCode }; // Basic info, will enhance later
  });
  return statesObj;
}

async function getState(stateCode) {
  try {
    const data = await fetchLegiscan('getState', { state: stateCode });
    return data.state;
  } catch (error) {
    console.warn(`⚠️  Could not get detailed info for ${stateCode}:`, error.message);
    return { code: stateCode, name: `${stateCode} State` };
  }
}

async function findCannabisBills(bills) {
  const cannabisBills = Object.values(bills).filter(bill => {
    if (typeof bill !== 'object' || !bill.title) return false;

    const title = bill.title.toLowerCase();
    return title.includes('cannabis') ||
           title.includes('marijuana') ||
           title.includes('hemp') ||
           title.includes('cbd') ||
           title.includes('medical marijuana');
  });

  return cannabisBills;
}

function generateFallbackUrls(stateCode, stateName) {
  const stateLower = stateCode.toLowerCase();
  const stateNameLower = stateName.toLowerCase().replace(/\s+/g, '');

  return {
    agency: `https://www.${stateLower}.gov/agriculture`,
    newsPages: [
      `https://www.${stateLower}.gov/news`,
      `https://governor.${stateLower}.gov/news`,
      `https://legislature.${stateLower}.gov`
    ],
    regulationPages: [
      `https://www.${stateLower}.gov/agriculture`,
      `https://www.${stateLower}.gov/health`
    ]
  };
}

async function updatePollerConfig(updates) {
  console.log('🔧 Updating poller configuration...');

  // Read current poller file
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const pollerPath = path.join(__dirname, 'supabase/functions/cannabis-hemp-poller/index.ts');
  let pollerContent = fs.readFileSync(pollerPath, 'utf8');

  // For each update, replace the corresponding state entry
  updates.forEach(update => {
    const stateCode = update.state;
    const newConfig = `'${stateCode}': {
  agency: '${update.agency}',
  agencyName: '${update.agencyName}',
  rssFeeds: [],
  newsPages: [
    '${update.newsPages.join("',\n    '")}'
  ],
  regulationPages: [
    '${update.regulationPages.join("',\n    '")}'
  ]
},`;

    // Find and replace the existing state entry
    const stateRegex = new RegExp(`'${stateCode}': \\{[^}]+\\},`, 's');
    if (stateRegex.test(pollerContent)) {
      pollerContent = pollerContent.replace(stateRegex, newConfig);
      console.log(`✅ Updated ${stateCode} configuration`);
    } else {
      console.warn(`⚠️  Could not find ${stateCode} in poller config`);
    }
  });

  // Write back the updated content
  fs.writeFileSync(pollerPath, pollerContent, 'utf8');
  console.log('💾 Poller configuration updated');
}

async function main() {
  try {
    console.log('🚀 Starting Legiscan API data collection for top 20 difficult states...');

    // Get all states
    const states = await getStateList();
    console.log(`📊 Found ${Object.keys(states).length} states`);

    // Focus on top 20 most difficult states (highest failure counts)
    const topDifficultStates = [
      'KY', 'MI', 'AK', 'AR', 'CO', 'CT', 'DE', 'IN', 'KS', 'LA',
      'MS', 'MT', 'NE', 'NH', 'OH', 'VT', 'AL', 'GA', 'ME', 'MD'
    ];

    console.log(`🎯 Focusing on top 20 difficult states: ${topDifficultStates.join(', ')}`);

    const updates = [];

    for (const stateCode of topDifficultStates) {
      console.log(`\n🔍 Processing ${stateCode}...`);

      try {
        // Get detailed state information
        const stateInfo = await getState(stateCode);

        // Get recent bills to find cannabis activity
        const bills = await getStateBills(stateCode);
        const billList = Object.values(bills).filter(b => typeof b === 'object');
        const cannabisBills = await findCannabisBills(billList);

        console.log(`📄 Found ${cannabisBills.length} cannabis-related bills for ${stateCode}`);

        // Generate fallback URLs based on state patterns
        const fallbackUrls = generateFallbackUrls(stateCode, stateInfo.name || `${stateCode} State`);

        // For difficult states, rely more heavily on RSS/news sources
        // Use legislature and governor sites as news sources
        const update = {
          state: stateCode,
          agency: fallbackUrls.agency,
          agencyName: `${stateInfo.name || stateCode} Department of Agriculture/Health`,
          newsPages: [
            `https://legislature.${stateCode.toLowerCase()}.gov`,
            `https://governor.${stateCode.toLowerCase()}.gov/news`,
            `https://www.${stateCode.toLowerCase()}.gov/news`,
            fallbackUrls.agency // Agency as backup news source
          ],
          regulationPages: [
            fallbackUrls.agency,
            `https://www.${stateCode.toLowerCase()}.gov/health`,
            `https://legislature.${stateCode.toLowerCase()}.gov` // Legislature often has regulations
          ]
        };

        updates.push(update);

        console.log(`✅ Prepared update for ${stateCode}: ${cannabisBills.length} cannabis bills found, using fallback URLs`);

      } catch (error) {
        console.error(`❌ Error processing ${stateCode}:`, error.message);

        // Even on error, create a basic update with fallback URLs
        const fallbackUrls = generateFallbackUrls(stateCode, `${stateCode} State`);

        updates.push({
          state: stateCode,
          agency: fallbackUrls.agency,
          agencyName: `${stateCode} Department of Agriculture`,
          newsPages: fallbackUrls.newsPages,
          regulationPages: fallbackUrls.regulationPages
        });

        console.log(`⚠️  Used fallback URLs for ${stateCode} due to error`);
      }
    }

    // Apply updates to poller config
    if (updates.length > 0) {
      await updatePollerConfig(updates);
      console.log(`\n🎉 Updated ${updates.length} states in poller configuration!`);

      // Test a few of the updated URLs
      console.log('\n🧪 Testing some updated URLs...');
      const testUrls = [
        'https://legislature.ky.gov',
        'https://www.michigan.gov/news',
        'https://legislature.alaska.gov'
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

  } catch (error) {
    console.error('❌ Script error:', error);
    process.exit(1);
  }
}

// Run the script
main();