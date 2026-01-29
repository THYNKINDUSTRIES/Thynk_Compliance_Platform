#!/usr/bin/env node

/**
 * Script to update cannabis agency URLs using OpenStates API
 * This will fetch current, accurate agency information for all states
 */

import fetch from 'node-fetch';

const OPENSTATES_API_KEY = 'db79f2e7-d16e-4b9b-bb71-bb496dc308ed';
const LEGISCAN_API_KEY = 'db9e2013fe8fc89561fd857e9b9f055d';

const BASE_URL = 'https://v3.openstates.org';

// Rate limiting: 1 request per second
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRateLimit(url) {
  const response = await fetch(url, {
    headers: {
      'X-API-KEY': OPENSTATES_API_KEY,
      'User-Agent': 'Thynk-Compliance-Platform/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  await delay(1100); // 1.1 seconds to be safe
  return response.json();
}

async function getStateMetadata() {
  console.log('📊 Fetching state metadata from OpenStates...');
  const metadata = await fetchWithRateLimit(`${BASE_URL}/jurisdictions`);
  return metadata.results || metadata; // Handle pagination if needed
}

async function findCannabisAgencies(state) {
  try {
    // Try to find committees related to cannabis/hemp
    const committeesUrl = `${BASE_URL}/committees/?state=${state}&q=cannabis+marijuana+hemp`;
    const committees = await fetchWithRateLimit(committeesUrl);

    // Also try broader search
    const broadCommitteesUrl = `${BASE_URL}/committees/?state=${state}&q=agriculture+commerce+health`;
    const broadCommittees = await fetchWithRateLimit(broadCommitteesUrl);

    return {
      committees: committees,
      broadCommittees: broadCommittees
    };
  } catch (error) {
    console.warn(`⚠️  Could not fetch committees for ${state}:`, error.message);
    return { committees: [], broadCommittees: [] };
  }
}

function extractAgencyInfo(state, metadata, committees) {
  const stateData = metadata.find(m => m.abbreviation === state);
  if (!stateData) {
    console.warn(`⚠️  No metadata found for ${state}`);
    return null;
  }

  // Look for cannabis-related committees
  const cannabisCommittees = committees.committees.filter(c =>
    c.name.toLowerCase().includes('cannabis') ||
    c.name.toLowerCase().includes('marijuana') ||
    c.name.toLowerCase().includes('hemp') ||
    c.name.toLowerCase().includes('medical marijuana')
  );

  // Fallback to agriculture/health committees that might handle cannabis
  const relevantCommittees = cannabisCommittees.length > 0 ?
    cannabisCommittees :
    committees.broadCommittees.filter(c =>
      c.name.toLowerCase().includes('agriculture') ||
      c.name.toLowerCase().includes('commerce') ||
      c.name.toLowerCase().includes('health') ||
      c.name.toLowerCase().includes('business')
    );

  // Extract URLs from committees
  const urls = new Set();

  // Add legislature URL
  if (stateData.legislature_url) {
    urls.add(stateData.legislature_url);
  }

  // Add committee URLs
  relevantCommittees.forEach(committee => {
    if (committee.url) urls.add(committee.url);
  });

  // Try to construct common agency URLs
  const commonUrls = [
    `https://www.${state.toLowerCase()}.gov/agriculture`,
    `https://www.${state.toLowerCase()}.gov/health`,
    `https://www.${state.toLowerCase()}.gov/commerce`,
    `https://agriculture.${state.toLowerCase()}.gov`,
    `https://health.${state.toLowerCase()}.gov`,
    `https://commerce.${state.toLowerCase()}.gov`
  ];

  return {
    state: state,
    name: stateData.name,
    legislature_url: stateData.legislature_url,
    relevant_committees: relevantCommittees.map(c => ({ name: c.name, url: c.url })),
    potential_urls: Array.from(urls),
    common_urls: commonUrls
  };
}

async function updatePollerConfig(agencyData) {
  console.log('🔧 Updating poller configuration...');

  // Read current poller file
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const pollerPath = path.join(__dirname, 'supabase/functions/cannabis-hemp-poller/index.ts');
  let pollerContent = fs.readFileSync(pollerPath, 'utf8');

  // For now, let's just log what we found and create a summary
  // In a real implementation, we'd parse and update the STATE_CANNABIS_SOURCES

  console.log('\n📋 Agency Data Summary:');
  agencyData.forEach(data => {
    if (data) {
      console.log(`\n${data.state} (${data.name}):`);
      console.log(`  Legislature: ${data.legislature_url}`);
      console.log(`  Relevant Committees: ${data.relevant_committees.length}`);
      console.log(`  Potential URLs: ${data.potential_urls.slice(0, 3).join(', ')}`);
    }
  });

  return agencyData;
}

async function main() {
  try {
    console.log('🚀 Starting OpenStates API data collection...');

    // Get all state metadata
    const metadata = await getStateMetadata();
    console.log(`📊 Found ${metadata.length} states`);

    // Focus on states that had failing URLs
    const failingStates = ['AL', 'AK', 'AR', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'IA', 'IL', 'IN', 'KS', 'KY', 'LA', 'ME', 'MD', 'MI', 'MS', 'MT', 'NE', 'NH', 'NM', 'NV', 'OH', 'OK', 'RI', 'TN', 'UT', 'VA', 'VT', 'WI', 'WY'];

    console.log(`🎯 Focusing on ${failingStates.length} states with failing URLs`);

    const agencyData = [];

    for (const state of failingStates) {
      console.log(`\n🔍 Processing ${state}...`);

      try {
        const committees = await findCannabisAgencies(state);
        const agencyInfo = extractAgencyInfo(state, metadata, committees);
        agencyData.push(agencyInfo);

        console.log(`✅ Found ${agencyInfo?.relevant_committees?.length || 0} relevant committees for ${state}`);

      } catch (error) {
        console.error(`❌ Error processing ${state}:`, error.message);
        agencyData.push(null);
      }
    }

    // Update the poller configuration
    await updatePollerConfig(agencyData.filter(d => d));

    console.log('\n🎉 OpenStates data collection complete!');
    console.log('💡 Next step: Manually verify and update the STATE_CANNABIS_SOURCES with the found URLs');

  } catch (error) {
    console.error('❌ Script error:', error);
    process.exit(1);
  }
}

// Run the script
main();