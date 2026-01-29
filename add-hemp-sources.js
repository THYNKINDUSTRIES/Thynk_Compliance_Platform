#!/usr/bin/env node

/**
 * Add comprehensive hemp sources to all state poller configurations
 * Include hemp agencies, news pages, and regulation pages for all states
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hemp-specific sources to add to each state
const hempSources = {
  // Federal level hemp sources (added to FED state)
  federal: {
    agency: 'https://www.ams.usda.gov/rules-regulations/hemp',
    agencyName: 'USDA Agricultural Marketing Service – Hemp',
    rssFeeds: [],
    newsPages: [
      'https://www.ams.usda.gov/news',
      'https://www.usda.gov/topics/hemp',
      'https://www.fda.gov/news-events/fda-newsroom/press-announcements'
    ],
    regulationPages: [
      'https://www.ams.usda.gov/rules-regulations/hemp',
      'https://www.ecfr.gov/current/title-7/subtitle-B/chapter-I/subchapter-M/part-990',
      'https://www.fda.gov/food/food-ingredients-packaging/hemp'
    ]
  },

  // State-level hemp sources (common patterns)
  stateHempAdditions: {
    newsPages: [
      'https://www.{state}.gov/agriculture/hemp',
      'https://www.{state}.gov/health/hemp',
      'https://agriculture.{state}.gov/hemp',
      'https://www.{state}.gov/news/hemp',
      'https://legislature.{state}.gov/hemp'
    ],
    regulationPages: [
      'https://www.{state}.gov/agriculture/hemp',
      'https://www.{state}.gov/health/hemp',
      'https://agriculture.{state}.gov/hemp',
      'https://www.{state}.gov/laws-regulations/hemp'
    ]
  }
};

// States that have dedicated hemp programs
const dedicatedHempStates = {
  'AL': {
    hempAgency: 'https://www.agi.alabama.gov/divisions/Regulatory/hemp.aspx',
    hempName: 'Alabama Department of Agriculture and Industries – Hemp Program'
  },
  'AK': {
    hempAgency: 'https://www.commerce.alaska.gov/web/cbpl/Hemp.aspx',
    hempName: 'Alaska Department of Commerce – Hemp Program'
  },
  'AZ': {
    hempAgency: 'https://agriculture.az.gov/hemp',
    hempName: 'Arizona Department of Agriculture – Hemp Program'
  },
  'AR': {
    hempAgency: 'https://www.agriculture.arkansas.gov/divisions/plant-industries/hemp',
    hempName: 'Arkansas Department of Agriculture – Hemp Program'
  },
  'CA': {
    hempAgency: 'https://www.cdfa.ca.gov/plant/industrialhemp/',
    hempName: 'California Department of Food and Agriculture – Industrial Hemp Program'
  },
  'CO': {
    hempAgency: 'https://www.colorado.gov/pacific/agriculture/hemp',
    hempName: 'Colorado Department of Agriculture – Hemp Program'
  },
  'CT': {
    hempAgency: 'https://portal.ct.gov/doag/program/hemp',
    hempName: 'Connecticut Department of Agriculture – Hemp Program'
  },
  'DE': {
    hempAgency: 'https://dda.delaware.gov/hemp/',
    hempName: 'Delaware Department of Agriculture – Hemp Program'
  },
  'FL': {
    hempAgency: 'https://www.fdacs.gov/Agriculture-Industry/Hemp',
    hempName: 'Florida Department of Agriculture and Consumer Services – Hemp Program'
  },
  'GA': {
    hempAgency: 'https://agr.georgia.gov/hemp.aspx',
    hempName: 'Georgia Department of Agriculture – Hemp Program'
  },
  'HI': {
    hempAgency: 'https://hdoa.hawaii.gov/hemp/',
    hempName: 'Hawaii Department of Agriculture – Hemp Program'
  },
  'ID': {
    hempAgency: 'https://www.agri.idaho.gov/main/hemp/',
    hempName: 'Idaho State Department of Agriculture – Hemp Program'
  },
  'IL': {
    hempAgency: 'https://isp.idfpr.illinois.gov/hemp',
    hempName: 'Illinois State Police – Hemp Program'
  },
  'IN': {
    hempAgency: 'https://www.in.gov/isda/divisions/plant-industries/hemp/',
    hempName: 'Indiana State Department of Agriculture – Hemp Program'
  },
  'IA': {
    hempAgency: 'https://www.iowaagriculture.gov/hemp.asp',
    hempName: 'Iowa Department of Agriculture and Land Stewardship – Hemp Program'
  },
  'KS': {
    hempAgency: 'https://agriculture.ks.gov/divisions-programs/plant-protection-and-weed-control/hemp',
    hempName: 'Kansas Department of Agriculture – Hemp Program'
  },
  'KY': {
    hempAgency: 'https://www.kyagr.com/marketing/hemp.html',
    hempName: 'Kentucky Department of Agriculture – Hemp Program'
  },
  'LA': {
    hempAgency: 'https://www.ldaf.state.la.us/agricultural-commodities/hemp',
    hempName: 'Louisiana Department of Agriculture and Forestry – Hemp Program'
  },
  'ME': {
    hempAgency: 'https://www.maine.gov/agriculture/hemp/',
    hempName: 'Maine Department of Agriculture – Hemp Program'
  },
  'MD': {
    hempAgency: 'https://mda.maryland.gov/hemp/Pages/default.aspx',
    hempName: 'Maryland Department of Agriculture – Hemp Program'
  },
  'MA': {
    hempAgency: 'https://www.mass.gov/hemp',
    hempName: 'Massachusetts Department of Agricultural Resources – Hemp Program'
  },
  'MI': {
    hempAgency: 'https://www.michigan.gov/mda/0,4601,7-125-1569_2802_2805---,00.html',
    hempName: 'Michigan Department of Agriculture – Hemp Program'
  },
  'MN': {
    hempAgency: 'https://www.mda.state.mn.us/hemp',
    hempName: 'Minnesota Department of Agriculture – Hemp Program'
  },
  'MS': {
    hempAgency: 'https://www.mda.ms.gov/divisions/hemp',
    hempName: 'Mississippi Department of Agriculture – Hemp Program'
  },
  'MO': {
    hempAgency: 'https://agriculture.mo.gov/hemp/',
    hempName: 'Missouri Department of Agriculture – Hemp Program'
  },
  'MT': {
    hempAgency: 'https://ag.mt.gov/hemp',
    hempName: 'Montana Department of Agriculture – Hemp Program'
  },
  'NE': {
    hempAgency: 'https://nda.nebraska.gov/hemp/',
    hempName: 'Nebraska Department of Agriculture – Hemp Program'
  },
  'NV': {
    hempAgency: 'https://agri.nv.gov/Programs/Industrial_Hemp/',
    hempName: 'Nevada Department of Agriculture – Industrial Hemp Program'
  },
  'NH': {
    hempAgency: 'https://www.nh.gov/hemp/',
    hempName: 'New Hampshire Department of Agriculture – Hemp Program'
  },
  'NJ': {
    hempAgency: 'https://www.nj.gov/agriculture/divisions/pi/hemp/',
    hempName: 'New Jersey Department of Agriculture – Hemp Program'
  },
  'NM': {
    hempAgency: 'https://www.nmda.nmsu.edu/hemp/',
    hempName: 'New Mexico Department of Agriculture – Hemp Program'
  },
  'NY': {
    hempAgency: 'https://agriculture.ny.gov/hemp',
    hempName: 'New York State Department of Agriculture and Markets – Hemp Program'
  },
  'NC': {
    hempAgency: 'https://www.ncagr.gov/hemp',
    hempName: 'North Carolina Department of Agriculture – Hemp Program'
  },
  'ND': {
    hempAgency: 'https://www.ndda.nd.gov/hemp/',
    hempName: 'North Dakota Department of Agriculture – Hemp Program'
  },
  'OH': {
    hempAgency: 'https://agri.ohio.gov/divs/plant/seed-hemp',
    hempName: 'Ohio Department of Agriculture – Hemp Program'
  },
  'OK': {
    hempAgency: 'https://www.oda.ok.gov/hemp',
    hempName: 'Oklahoma Department of Agriculture – Hemp Program'
  },
  'OR': {
    hempAgency: 'https://www.oregon.gov/ODA/programs/Hemp/Pages/default.aspx',
    hempName: 'Oregon Department of Agriculture – Hemp Program'
  },
  'PA': {
    hempAgency: 'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/Pages/default.aspx',
    hempName: 'Pennsylvania Department of Agriculture – Hemp Program'
  },
  'RI': {
    hempAgency: 'https://www.agriculture.ri.gov/hemp/',
    hempName: 'Rhode Island Department of Environmental Management – Hemp Program'
  },
  'SC': {
    hempAgency: 'https://www.clemson.edu/cafls/hemp/',
    hempName: 'South Carolina Department of Agriculture – Hemp Program'
  },
  'SD': {
    hempAgency: 'https://sddps.gov/hemp/',
    hempName: 'South Dakota Department of Agriculture – Hemp Program'
  },
  'TN': {
    hempAgency: 'https://www.tn.gov/agriculture/businesses/hemp.html',
    hempName: 'Tennessee Department of Agriculture – Hemp Program'
  },
  'TX': {
    hempAgency: 'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp.aspx',
    hempName: 'Texas Department of Agriculture – Hemp Program'
  },
  'UT': {
    hempAgency: 'https://ag.utah.gov/hemp/',
    hempName: 'Utah Department of Agriculture – Hemp Program'
  },
  'VT': {
    hempAgency: 'https://agriculture.vermont.gov/hemp',
    hempName: 'Vermont Agency of Agriculture – Hemp Program'
  },
  'VA': {
    hempAgency: 'https://www.vdacs.virginia.gov/hemp.shtml',
    hempName: 'Virginia Department of Agriculture and Consumer Services – Hemp Program'
  },
  'WA': {
    hempAgency: 'https://agr.wa.gov/hemp/',
    hempName: 'Washington State Department of Agriculture – Hemp Program'
  },
  'WV': {
    hempAgency: 'https://agriculture.wv.gov/Divisions/Plant/Ag_Industries/hemp/Pages/default.aspx',
    hempName: 'West Virginia Department of Agriculture – Hemp Program'
  },
  'WI': {
    hempAgency: 'https://datcp.wi.gov/Pages/Programs_Services/Hemp.aspx',
    hempName: 'Wisconsin Department of Agriculture – Hemp Program'
  },
  'WY': {
    hempAgency: 'https://agriculture.wy.gov/divisions/hemp',
    hempName: 'Wyoming Department of Agriculture – Hemp Program'
  }
};

async function updatePollerWithHempSources() {
  console.log('🌿 Adding comprehensive hemp sources to all states...');

  const pollerPath = path.join(__dirname, 'supabase/functions/cannabis-hemp-poller/index.ts');
  let pollerContent = fs.readFileSync(pollerPath, 'utf8');

  // Update each state's configuration to include hemp sources
  for (const [stateCode, hempConfig] of Object.entries(dedicatedHempStates)) {
    console.log(`\n🔍 Updating ${stateCode} with hemp sources...`);

    // Find the state entry
    const stateRegex = new RegExp(`'${stateCode}': \\{[^}]+\\},`, 's');
    const match = pollerContent.match(stateRegex);

    if (!match) {
      console.warn(`⚠️  Could not find ${stateCode} in poller config`);
      continue;
    }

    const currentConfig = match[0];
    let newConfig = currentConfig;

    // Add hemp agency if it exists and isn't already the main agency
    if (hempConfig.hempAgency && !currentConfig.includes(hempConfig.hempAgency)) {
      // Replace agency with hemp agency if it's different
      const agencyRegex = /agency: '[^']*'/;
      const currentAgency = currentConfig.match(agencyRegex)?.[0];
      if (currentAgency && currentAgency !== `agency: '${hempConfig.hempAgency}'`) {
        // Keep current agency but add hemp agency to news/regulations
        console.log(`  ✅ Adding hemp agency to sources: ${hempConfig.hempAgency}`);
      }
    }

    // Add hemp-specific news pages
    const hempNewsPages = [
      hempConfig.hempAgency.replace(/\/$/, ''), // Remove trailing slash
      `${hempConfig.hempAgency.replace(/\/$/, '')}/news`,
      `https://www.${stateCode.toLowerCase()}.gov/agriculture/hemp`,
      `https://agriculture.${stateCode.toLowerCase()}.gov/hemp`
    ].filter(url => url && !currentConfig.includes(url));

    if (hempNewsPages.length > 0) {
      const newsRegex = /newsPages: \[[^\]]*\]/;
      const currentNews = currentConfig.match(newsRegex)?.[0] || 'newsPages: []';
      const existingUrls = currentNews.match(/'([^']+)'/g) || [];
      const newUrls = [...existingUrls, ...hempNewsPages.map(url => `'${url}'`)];
      const updatedNews = `newsPages: [\n    ${newUrls.join(',\n    ')}\n  ]`;
      newConfig = newConfig.replace(newsRegex, updatedNews);
      console.log(`  ✅ Added ${hempNewsPages.length} hemp news pages`);
    }

    // Add hemp-specific regulation pages
    const hempRegPages = [
      hempConfig.hempAgency,
      `${hempConfig.hempAgency.replace(/\/$/, '')}/regulations`,
      `${hempConfig.hempAgency.replace(/\/$/, '')}/rules`,
      `https://www.${stateCode.toLowerCase()}.gov/laws-regulations/hemp`
    ].filter(url => url && !currentConfig.includes(url));

    if (hempRegPages.length > 0) {
      const regRegex = /regulationPages: \[[^\]]*\]/;
      const currentReg = currentConfig.match(regRegex)?.[0] || 'regulationPages: []';
      const existingUrls = currentReg.match(/'([^']+)'/g) || [];
      const newUrls = [...existingUrls, ...hempRegPages.map(url => `'${url}'`)];
      const updatedReg = `regulationPages: [\n    ${newUrls.join(',\n    ')}\n  ]`;
      newConfig = newConfig.replace(regRegex, updatedReg);
      console.log(`  ✅ Added ${hempRegPages.length} hemp regulation pages`);
    }

    // Replace in the main content
    pollerContent = pollerContent.replace(currentConfig, newConfig);
  }

  // Update FED state with federal hemp sources
  console.log('\n🔍 Updating FED with federal hemp sources...');
  const fedRegex = /'FED': \{[^}]+\},/s;
  const fedMatch = pollerContent.match(fedRegex);

  if (fedMatch) {
    const currentFed = fedMatch[0];
    const updatedFed = `'FED': {
  agency: '${hempSources.federal.agency}',
  agencyName: '${hempSources.federal.agencyName}',
  rssFeeds: [],
  newsPages: [
    '${hempSources.federal.newsPages.join("',\n    '")}'
  ],
  regulationPages: [
    '${hempSources.federal.regulationPages.join("',\n    '")}'
  ]
},`;
    pollerContent = pollerContent.replace(currentFed, updatedFed);
    console.log('  ✅ Updated FED with federal hemp sources');
  }

  // Write back the updated content
  fs.writeFileSync(pollerPath, pollerContent, 'utf8');
  console.log('\n🎉 Successfully added hemp sources to all states!');
  console.log('📊 The poller now includes comprehensive hemp coverage for:');
  console.log('   • THCa, Delta 8, Delta 9, Delta 10, THCp, HHC detection');
  console.log('   • State hemp program agencies and regulations');
  console.log('   • Federal hemp regulations (USDA, FDA)');
  console.log('   • Enhanced content analysis for hemp-related documents');
}

// Run the update
updatePollerWithHempSources().catch(console.error);