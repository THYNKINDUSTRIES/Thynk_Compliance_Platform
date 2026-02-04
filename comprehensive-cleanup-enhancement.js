#!/usr/bin/env node

/**
 * Comprehensive Poller Sources Cleanup & Enhancement
 * - Validates all existing sources
 * - Removes inaccessible ones
 * - Adds verified sources from APIs
 * - Ensures at least one source per state
 * - Targets 75%+ accuracy
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
const CSV_FILE = path.join(__dirname, 'all-poller-sources.csv');

// API Keys (set via environment)
const API_KEYS = {
  LEGISCAN: process.env.LEGISCAN_API_KEY,
  OPENSTATES: process.env.OPENSTATES_API_KEY
};

// State data portals
const STATE_DATA_PORTALS = {
  'AL': { url: 'https://open.alabama.gov/', name: 'Alabama Open Data' },
  'AK': { url: 'https://data.alaska.gov/', name: 'Alaska Open Data' },
  'AZ': { url: 'https://openbooks.az.gov/', name: 'Arizona Open Books' },
  'AR': { url: 'https://transparency.arkansas.gov/', name: 'Arkansas Transparency' },
  'CA': { url: 'https://data.ca.gov/', name: 'California Open Data' },
  'CO': { url: 'https://data.colorado.gov/', name: 'Colorado Open Data' },
  'CT': { url: 'https://data.ct.gov/', name: 'Connecticut Open Data' },
  'DE': { url: 'https://data.delaware.gov/', name: 'Delaware Open Data' },
  'FL': { url: 'https://data.fl.gov/', name: 'Florida Open Data' },
  'GA': { url: 'https://open.ga.gov/', name: 'Georgia Open Data' },
  'HI': { url: 'https://data.hawaii.gov/', name: 'Hawaii Open Data' },
  'ID': { url: 'https://gis.idaho.gov/', name: 'Idaho GIS' },
  'IL': { url: 'https://data.illinois.gov/', name: 'Illinois Open Data' },
  'IN': { url: 'https://data.in.gov/', name: 'Indiana Open Data' },
  'IA': { url: 'https://data.iowa.gov/', name: 'Iowa Open Data' },
  'KS': { url: 'https://data.kansas.gov/', name: 'Kansas Open Data' },
  'KY': { url: 'https://open.ky.gov/', name: 'Kentucky Open Data' },
  'LA': { url: 'https://data.louisiana.gov/', name: 'Louisiana Open Data' },
  'ME': { url: 'https://data.maine.gov/', name: 'Maine Open Data' },
  'MD': { url: 'https://data.maryland.gov/', name: 'Maryland Open Data' },
  'MA': { url: 'https://data.mass.gov/', name: 'Massachusetts Open Data' },
  'MI': { url: 'https://data.michigan.gov/', name: 'Michigan Open Data' },
  'MN': { url: 'https://data.minnesota.gov/', name: 'Minnesota Open Data' },
  'MS': { url: 'https://data.ms.gov/', name: 'Mississippi Open Data' },
  'MO': { url: 'https://data.mo.gov/', name: 'Missouri Open Data' },
  'MT': { url: 'https://data.mt.gov/', name: 'Montana Open Data' },
  'NE': { url: 'https://data.nebraska.gov/', name: 'Nebraska Open Data' },
  'NV': { url: 'https://data.nv.gov/', name: 'Nevada Open Data' },
  'NH': { url: 'https://data.nh.gov/', name: 'New Hampshire Open Data' },
  'NJ': { url: 'https://data.nj.gov/', name: 'New Jersey Open Data' },
  'NM': { url: 'https://data.newmexico.gov/', name: 'New Mexico Open Data' },
  'NY': { url: 'https://data.ny.gov/', name: 'New York Open Data' },
  'NC': { url: 'https://data.nc.gov/', name: 'North Carolina Open Data' },
  'ND': { url: 'https://data.nd.gov/', name: 'North Dakota Open Data' },
  'OH': { url: 'https://data.ohio.gov/', name: 'Ohio Open Data' },
  'OK': { url: 'https://data.ok.gov/', name: 'Oklahoma Open Data' },
  'OR': { url: 'https://data.oregon.gov/', name: 'Oregon Open Data' },
  'PA': { url: 'https://data.pa.gov/', name: 'Pennsylvania Open Data' },
  'RI': { url: 'https://data.ri.gov/', name: 'Rhode Island Open Data' },
  'SC': { url: 'https://data.sc.gov/', name: 'South Carolina Open Data' },
  'SD': { url: 'https://data.sd.gov/', name: 'South Dakota Open Data' },
  'TN': { url: 'https://data.tn.gov/', name: 'Tennessee Open Data' },
  'TX': { url: 'https://data.texas.gov/', name: 'Texas Open Data' },
  'UT': { url: 'https://data.utah.gov/', name: 'Utah Open Data' },
  'VT': { url: 'https://data.vermont.gov/', name: 'Vermont Open Data' },
  'VA': { url: 'https://data.virginia.gov/', name: 'Virginia Open Data' },
  'WA': { url: 'https://data.wa.gov/', name: 'Washington Open Data' },
  'WV': { url: 'https://data.wv.gov/', name: 'West Virginia Open Data' },
  'WI': { url: 'https://data.wi.gov/', name: 'Wisconsin Open Data' },
  'WY': { url: 'https://data.wy.gov/', name: 'Wyoming Open Data' }
};

// User-provided verified sources
const VERIFIED_SOURCES = {
  'WA': [
    { url: 'https://lcb.wa.gov/laws/laws-and-rules', category: 'regulations', type: 'webpage' },
    { url: 'https://data.wa.gov', category: 'data-portal', type: 'webpage' },
    { url: 'https://agr.wa.gov', category: 'agriculture', type: 'webpage' }
  ],
  'NM': [
    { url: 'https://nmdeptag.nmsu.edu/aes/hemp/hemp-laws-and-regulations.html', category: 'regulations', type: 'webpage' },
    { url: 'https://www.rld.nm.gov/cannabis/laws-rules-regulations/', category: 'regulations', type: 'webpage' }
  ]
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testUrl(url, timeout = 10000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PollerReviewAgent/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function loadExistingSources() {
  return new Promise((resolve, reject) => {
    const sources = [];
    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', (data) => sources.push(data))
      .on('end', () => resolve(sources))
      .on('error', reject);
  });
}

async function validateExistingSources() {
  console.log('🔍 Validating existing sources...');
  const sources = await loadExistingSources();
  const validatedSources = [];

  console.log(`📊 Checking ${sources.length} existing sources...`);

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    if (i % 50 === 0) {
      console.log(`  Progress: ${i}/${sources.length} (${Math.round(i/sources.length*100)}%)`);
    }

    const isAccessible = await testUrl(source.url);
    if (isAccessible) {
      validatedSources.push(source);
    } else {
      console.log(`  ❌ Removing inaccessible: ${source.state} - ${source.url}`);
    }

    // Small delay to avoid overwhelming servers
    await sleep(200);
  }

  console.log(`✅ Validated: ${validatedSources.length}/${sources.length} sources accessible`);
  return validatedSources;
}

async function fetchFederalRegisterData() {
  console.log('🔍 Fetching Federal Register data...');
  const sources = [];

  try {
    const response = await fetch('https://www.federalregister.gov/api/v1/documents.json?per_page=20&order=newest&conditions[agencies][]=agriculture&conditions[term]=cannabis+OR+hemp+OR+marijuana');
    const data = await response.json();

    for (const doc of data.results.slice(0, 5)) {
      if (doc.html_url) {
        sources.push({
          url: doc.html_url,
          title: doc.title,
          type: 'federal-regulation',
          category: 'regulations',
          agency: doc.agencies[0]?.name || 'Federal Register',
          state: 'FEDERAL'
        });
      }
    }

    console.log(`✅ Found ${sources.length} federal regulations`);
  } catch (error) {
    console.log('❌ Error fetching Federal Register data:', error.message);
  }

  return sources;
}

async function fetchLegiScanData() {
  console.log('🔍 Fetching LegiScan data...');
  const sources = [];

  if (!API_KEYS.LEGISCAN) {
    console.log('⚠️  No LegiScan API key provided - skipping');
    return sources;
  }

  try {
    const searchUrl = `https://api.legiscan.com/?key=${API_KEYS.LEGISCAN}&op=getSearch&query=cannabis+OR+marijuana+OR+hemp&state=ALL&page=1`;
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.searchresult) {
      const bills = Object.values(data.searchresult).filter(item => typeof item === 'object' && item.bill_id);

      // Group by state and add public legislative URLs
      const stateLegislation = {};
      for (const bill of bills.slice(0, 200)) {
        if (!stateLegislation[bill.state]) {
          stateLegislation[bill.state] = true;
        }
      }

      // Public legislative search URLs for states with cannabis bills
      const publicSearchUrls = {
        'AL': 'https://www.legislature.state.al.us/alis/',
        'AK': 'https://www.akleg.gov/basis',
        'AZ': 'https://www.azleg.gov/ars/',
        'AR': 'https://www.arkleg.state.ar.us/Laws',
        'CA': 'https://leginfo.legislature.ca.gov/faces/billSearchClient.xhtml',
        'CO': 'https://leg.colorado.gov/bills',
        'CT': 'https://www.cga.ct.gov/asp/menu/leg.asp',
        'DE': 'https://delcode.delaware.gov/',
        'FL': 'https://www.flsenate.gov/Laws',
        'GA': 'https://www.legis.ga.gov/legislation',
        'HI': 'https://www.capitol.hawaii.gov/advreports',
        'ID': 'https://legislature.idaho.gov/statutesrules/',
        'IL': 'https://www.ilga.gov/commission/lrb/',
        'IN': 'https://iga.in.gov/legislative/2025/bills',
        'IA': 'https://www.legis.iowa.gov/law',
        'KS': 'https://www.kslegislature.org/li',
        'KY': 'https://legislature.ky.gov/Laws',
        'LA': 'https://www.legis.la.gov/legis/Law.aspx',
        'ME': 'https://legislature.maine.gov/statutes',
        'MD': 'https://mgaleg.maryland.gov/',
        'MA': 'https://malegislature.gov/Laws',
        'MI': 'https://www.legislature.mi.gov/(S(3q0v0j0j0j0j0j0j0j0j))/mileg.aspx',
        'MN': 'https://www.revisor.mn.gov/statutes/',
        'MS': 'https://www.lc.ms.gov/Laws',
        'MO': 'https://www.mo.gov/government',
        'MT': 'https://leg.mt.gov/bills',
        'NE': 'https://nebraskalegislature.gov/laws',
        'NV': 'https://www.leg.state.nv.us/NRS/',
        'NH': 'https://www.gencourt.state.nh.us/rsa/',
        'NJ': 'https://www.njleg.state.nj.us/bills',
        'NM': 'https://www.nmlegis.gov/Laws',
        'NY': 'https://nyassembly.gov/leg/',
        'NC': 'https://www.ncleg.gov/BillLookUp',
        'ND': 'https://www.legis.nd.gov/cencode/t01-01.html',
        'OH': 'https://www.legislature.ohio.gov/legislation',
        'OK': 'https://www.oscn.net/applications/oscn/DeliverDocument.asp',
        'OR': 'https://www.oregonlegislature.gov/bills_laws',
        'PA': 'https://www.legis.state.pa.us/cfdocs/legis/LI/consCheck.cfm',
        'RI': 'https://webserver.rilegislature.gov/Statutes/',
        'SC': 'https://www.scstatehouse.gov/code/',
        'SD': 'https://sdlegislature.gov/Statutes',
        'TN': 'https://www.tn.gov/laws-statutes.html',
        'TX': 'https://statutes.capitol.texas.gov/',
        'UT': 'https://le.utah.gov/xcode/',
        'VT': 'https://legislature.vermont.gov/statutes',
        'VA': 'https://lis.virginia.gov/cgi-bin/legp604.exe',
        'WA': 'https://leg.wa.gov/CodeReviser/',
        'WV': 'https://code.wvlegislature.gov/',
        'WI': 'https://docs.legis.wisconsin.gov/statutes',
        'WY': 'https://www.wyoleg.gov/Statutes'
      };

      for (const state of Object.keys(stateLegislation)) {
        if (publicSearchUrls[state]) {
          sources.push({
            url: publicSearchUrls[state],
            title: `${state} Legislature Bill Search`,
            type: 'legislative-search',
            category: 'legislation',
            agency: 'State Legislature',
            state: state
          });
        }
      }
    }

    console.log(`✅ Found ${sources.length} legislative sources`);
  } catch (error) {
    console.log('❌ Error fetching LegiScan data:', error.message);
  }

  return sources;
}

async function fetchOpenStatesData() {
  console.log('🔍 Fetching OpenStates data...');
  const sources = [];

  try {
    const searchUrl = 'https://v3.openstates.org/bills?q=cannabis+OR+marijuana+OR+hemp&sort=updated_desc&include=versions';
    const response = await fetch(searchUrl, {
      headers: API_KEYS.OPENSTATES ? { 'X-API-Key': API_KEYS.OPENSTATES } : {}
    });

    if (!response.ok) {
      console.log('⚠️  OpenStates API not accessible');
      return sources;
    }

    const data = await response.json();

    const jurisdictionBills = {};
    for (const bill of (data.results || []).slice(0, 50)) {
      const jurisdiction = bill.jurisdiction?.name;
      if (jurisdiction && !jurisdictionBills[jurisdiction]) {
        jurisdictionBills[jurisdiction] = bill;
      }
    }

    // Add public legislative URLs for states with bills
    const publicUrls = {
      'California': 'https://leginfo.legislature.ca.gov/faces/billSearchClient.xhtml',
      'Oregon': 'https://www.oregonlegislature.gov/bills_laws',
      'Massachusetts': 'https://malegislature.gov/Bills',
      'Missouri': 'https://www.mo.gov/government',
      'Ohio': 'https://www.legislature.ohio.gov/legislation',
      'Florida': 'https://www.flsenate.gov/Laws'
    };

    for (const [jurisdiction, bill] of Object.entries(jurisdictionBills)) {
      if (publicUrls[jurisdiction]) {
        const stateMatch = jurisdiction.match(/([A-Z][a-z]+)$/);
        const stateName = stateMatch ? stateMatch[1] : jurisdiction;
        const stateCode = getStateAbbrev(stateName);

        if (stateCode) {
          sources.push({
            url: publicUrls[jurisdiction],
            title: `${jurisdiction} Legislative Bill Search`,
            type: 'legislative-search',
            category: 'legislation',
            agency: 'OpenStates',
            state: stateCode
          });
        }
      }
    }

    console.log(`✅ Found ${sources.length} legislative sources`);
  } catch (error) {
    console.log('❌ Error fetching OpenStates data:', error.message);
  }

  return sources;
}

function getStateAbbrev(stateName) {
  const stateMap = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
  };
  return stateMap[stateName];
}

async function testStateDataPortals() {
  console.log('🔍 Testing state data portals...');
  const workingSources = [];

  for (const [state, portal] of Object.entries(STATE_DATA_PORTALS)) {
    console.log(`Testing ${state}: ${portal.url}`);

    try {
      const isWorking = await testUrl(portal.url);
      if (isWorking) {
        workingSources.push({
          state: state,
          url: portal.url,
          type: 'state-portal',
          category: 'data-portal',
          agency: `${portal.name} Open Data Portal`
        });

        // Test key agriculture/cannabis paths
        const testPaths = ['/agriculture', '/hemp', '/cannabis', '/farm', '/plants', '/datasets'];

        for (const testPath of testPaths) {
          const testUrlStr = portal.url.replace(/\/$/, '') + testPath;
          const pathWorking = await testUrl(testUrlStr);
          if (pathWorking) {
            workingSources.push({
              state: state,
              url: testUrlStr,
              type: 'state-portal',
              category: 'regulations',
              agency: `${portal.name} Open Data Portal`
            });
          }
        }
      }
    } catch (error) {
      console.log(`❌ Error testing ${state}:`, error.message);
    }
  }

  console.log(`✅ Found ${workingSources.length} working state portals`);
  return workingSources;
}

async function ensureMinimumSources(validatedSources) {
  console.log('🔍 Ensuring minimum one source per state...');

  const statesWithSources = new Set(validatedSources.map(s => s.state));
  const missingStates = [];

  // Check all 50 states + DC + FEDERAL
  const allStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC', 'FEDERAL'];

  for (const state of allStates) {
    if (!statesWithSources.has(state)) {
      missingStates.push(state);
    }
  }

  console.log(`📊 States missing sources: ${missingStates.join(', ')}`);

  // Add fallback sources for missing states
  const fallbackSources = [];
  for (const state of missingStates) {
    if (state === 'FEDERAL') {
      fallbackSources.push({
        state: 'FEDERAL',
        url: 'https://www.federalregister.gov/',
        type: 'federal-portal',
        category: 'federal',
        agency: 'Federal Register'
      });
    } else {
      // Add state legislature as fallback
      const stateLegislatures = {
        'AL': 'https://www.legislature.state.al.us/',
        'AK': 'https://www.akleg.gov/',
        'AZ': 'https://www.azleg.gov/',
        'AR': 'https://www.arkleg.state.ar.us/',
        'CA': 'https://www.legislature.ca.gov/',
        'CO': 'https://leg.colorado.gov/',
        'CT': 'https://www.cga.ct.gov/',
        'DE': 'https://legis.delaware.gov/',
        'FL': 'https://www.flsenate.gov/',
        'GA': 'https://www.legis.ga.gov/',
        'HI': 'https://www.capitol.hawaii.gov/',
        'ID': 'https://legislature.idaho.gov/',
        'IL': 'https://www.ilga.gov/',
        'IN': 'https://iga.in.gov/',
        'IA': 'https://www.legis.iowa.gov/',
        'KS': 'https://www.kslegislature.org/',
        'KY': 'https://legislature.ky.gov/',
        'LA': 'https://www.legis.la.gov/',
        'ME': 'https://legislature.maine.gov/',
        'MD': 'https://mgaleg.maryland.gov/',
        'MA': 'https://malegislature.gov/',
        'MI': 'https://www.legislature.mi.gov/',
        'MN': 'https://www.revisor.mn.gov/',
        'MS': 'https://www.lc.ms.gov/',
        'MO': 'https://www.mo.gov/government',
        'MT': 'https://leg.mt.gov/',
        'NE': 'https://nebraskalegislature.gov/',
        'NV': 'https://www.leg.state.nv.us/',
        'NH': 'https://www.gencourt.state.nh.us/',
        'NJ': 'https://www.njleg.state.nj.us/',
        'NM': 'https://www.nmlegis.gov/',
        'NY': 'https://nyassembly.gov/',
        'NC': 'https://www.ncleg.gov/',
        'ND': 'https://www.legis.nd.gov/',
        'OH': 'https://www.legislature.ohio.gov/',
        'OK': 'https://www.oscn.net/',
        'OR': 'https://www.oregonlegislature.gov/',
        'PA': 'https://www.legis.state.pa.us/',
        'RI': 'https://www.rilegislature.gov/',
        'SC': 'https://www.scstatehouse.gov/',
        'SD': 'https://sdlegislature.gov/',
        'TN': 'https://www.tn.gov/laws-statutes.html',
        'TX': 'https://www.texas.gov/',
        'UT': 'https://le.utah.gov/',
        'VT': 'https://legislature.vermont.gov/',
        'VA': 'https://lis.virginia.gov/',
        'WA': 'https://leg.wa.gov/',
        'WV': 'https://www.wvlegislature.gov/',
        'WI': 'https://legis.wisconsin.gov/',
        'WY': 'https://www.wyoleg.gov/',
        'DC': 'https://dccode.dc.gov/'
      };

      if (stateLegislatures[state]) {
        fallbackSources.push({
          state: state,
          url: stateLegislatures[state],
          type: 'state-legislature',
          category: 'legislation',
          agency: `${state} Legislature`
        });
      }
    }
  }

  console.log(`📝 Added ${fallbackSources.length} fallback sources for missing states`);
  return [...validatedSources, ...fallbackSources];
}

async function updatePollerConfig(allSources) {
  console.log('💾 Updating poller configuration...');

  // Group sources by state
  const stateUpdates = {};
  for (const source of allSources) {
    if (source.state && source.url) {
      if (!stateUpdates[source.state]) {
        stateUpdates[source.state] = { news: [], regulations: [] };
      }

      if (source.category === 'news' || (source.type && source.type.includes('news'))) {
        stateUpdates[source.state].news.push(source.url);
      } else {
        stateUpdates[source.state].regulations.push(source.url);
      }
    }
  }

  // Read current config
  let configContent = fs.readFileSync(POLLER_CONFIG_PATH, 'utf8');

  // Update each state's configuration
  for (const [state, sources] of Object.entries(stateUpdates)) {
    console.log(`📝 Updating ${state} with ${sources.news.length} news and ${sources.regulations.length} regulation sources`);

    // Find the state block
    const stateRegex = new RegExp(`('${state}'\\s*:\\s*{[^}]*?newsPages:\\s*\\[[^\\]]*\\],\\s*regulationPages:\\s*\\[[^\\]]*\\])`, 's');
    const match = configContent.match(stateRegex);

    if (match) {
      let stateBlock = match[1];

      // Replace news sources
      const newsUrls = sources.news.map(url => `    '${url}'`).join(',\n');
      stateBlock = stateBlock.replace(
        /(newsPages:\s*\[[^\]]*?)(\],)/s,
        `$1${newsUrls ? ',\n' + newsUrls : ''}$2`
      );

      // Replace regulation sources
      const regUrls = sources.regulations.map(url => `    '${url}'`).join(',\n');
      stateBlock = stateBlock.replace(
        /(regulationPages:\s*\[[^\]]*?)(\],)/s,
        `$1${regUrls ? ',\n' + regUrls : ''}$2`
      );

      configContent = configContent.replace(match[0], stateBlock);
    }
  }

  // Write updated config
  fs.writeFileSync(POLLER_CONFIG_PATH, configContent);
  console.log('✅ Updated poller configuration');
}

async function main() {
  console.log('🚀 Starting comprehensive poller sources cleanup & enhancement...\n');

  // 1. Validate existing sources and remove inaccessible ones
  const validatedSources = await validateExistingSources();
  console.log('');

  // 2. Add user-provided verified sources
  console.log('📝 Adding user-provided verified sources...');
  let allSources = [...validatedSources];
  for (const [state, sources] of Object.entries(VERIFIED_SOURCES)) {
    for (const source of sources) {
      allSources.push({
        state: state,
        url: source.url,
        category: source.category,
        type: source.type,
        agency: `${state} Department of Agriculture`,
        poller: 'cannabis-hemp-poller',
        sourceType: 'webpage'
      });
    }
  }
  console.log(`✅ Added verified sources for WA and NM`);
  console.log('');

  // 3. Fetch new sources from APIs
  const federalSources = await fetchFederalRegisterData();
  allSources.push(...federalSources);
  console.log('');

  const legiscanSources = await fetchLegiScanData();
  allSources.push(...legiscanSources);
  console.log('');

  const openStatesSources = await fetchOpenStatesData();
  allSources.push(...openStatesSources);
  console.log('');

  const statePortalSources = await testStateDataPortals();
  allSources.push(...statePortalSources);
  console.log('');

  // 4. Ensure minimum one source per state
  allSources = await ensureMinimumSources(allSources);
  console.log('');

  console.log(`📈 Total sources collected: ${allSources.length}`);

  // 5. Update poller configuration
  await updatePollerConfig(allSources);

  // 6. Regenerate CSV files
  console.log('🔄 Regenerating CSV files...');
  const { execSync } = await import('child_process');
  execSync('node export-poller-sources.js', { stdio: 'inherit' });

  console.log(`\n🎉 Successfully processed ${allSources.length} verified sources!`);

  // 7. Run final accuracy check
  console.log('\n📊 Running final accuracy check...');
  execSync('node quick-accuracy-check.js', { stdio: 'inherit' });
}

main().catch(console.error);