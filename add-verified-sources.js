#!/usr/bin/env node

/**
 * Add Verified Sources: Update poller with real working URLs
 */

import fs from 'fs';

// Load the found sources
const foundSources = JSON.parse(fs.readFileSync('found-sources.json', 'utf8'));

// Filter and organize sources to add (avoid duplicates with existing)
const sourcesToAdd = {
  'ND': {
    newsPages: [
      'https://www.ndda.nd.gov/hemp'  // Already exists, skip
    ].filter(url => !url.includes('ndda.nd.gov/hemp')), // Remove duplicates
    regulationPages: [
      'https://www.ndda.nd.gov/hemp'  // Already exists
    ].filter(url => !url.includes('ndda.nd.gov/hemp'))
  },
  'SD': {
    newsPages: [
      'https://www.sd.gov/press-releases',
      'https://www.sd.gov/announcements'
    ],
    regulationPages: [
      'https://www.sd.gov/regulations',
      'https://www.sd.gov/rules',
      'https://www.sd.gov/laws'
    ]
  },
  'WY': {
    newsPages: [
      'https://agriculture.wy.gov/hemp'  // Already exists
    ].filter(url => !url.includes('agriculture.wy.gov/hemp')),
    regulationPages: [
      'https://agriculture.wy.gov/hemp'  // Already exists
    ].filter(url => !url.includes('agriculture.wy.gov/hemp'))
  },
  'RI': {
    newsPages: [
      'https://www.ri.gov/news'
    ],
    regulationPages: []
  },
  'DE': {
    newsPages: [
      'https://dda.delaware.gov/press-releases',
      'https://dda.delaware.gov/announcements'
    ],
    regulationPages: [
      'https://dda.delaware.gov/regulations',
      'https://dda.delaware.gov/rules',
      'https://dda.delaware.gov/laws'
    ]
  },
  'HI': {
    newsPages: [
      'https://hdoa.hawaii.gov/hemp'  // Already exists
    ].filter(url => !url.includes('hdoa.hawaii.gov/hemp')),
    regulationPages: [
      'https://hdoa.hawaii.gov/hemp'  // Already exists
    ].filter(url => !url.includes('hdoa.hawaii.gov/hemp'))
  }
};

async function updatePoller() {
  console.log('=== ADDING VERIFIED SOURCES TO POLLER ===\n');

  let pollerContent = fs.readFileSync('supabase/functions/cannabis-hemp-poller/index.ts', 'utf8');

  let totalAdded = 0;

  for (const [state, additions] of Object.entries(sourcesToAdd)) {
    const totalForState = additions.newsPages.length + additions.regulationPages.length;
    if (totalForState === 0) continue;

    console.log(`Updating ${state} with ${totalForState} new sources...`);

    // Find the state entry
    const stateRegex = new RegExp(`('${state}': \\{[^}]*\\})`, 's');
    const match = pollerContent.match(stateRegex);

    if (match) {
      let stateEntry = match[1];

      // Add news pages
      if (additions.newsPages.length > 0) {
        const newsMatch = stateEntry.match(/(newsPages: \[([^\]]*)\])/);
        if (newsMatch) {
          let existingNews = newsMatch[2].trim();
          if (existingNews && !existingNews.endsWith(',')) {
            existingNews += ',';
          }
          const newNews = additions.newsPages.map(url => `    '${url}'`).join(',\n');
          const updatedNews = existingNews ? `${existingNews}\n${newNews}` : newNews;
          stateEntry = stateEntry.replace(newsMatch[1], `newsPages: [\n${updatedNews}\n  ]`);
        }
      }

      // Add regulation pages
      if (additions.regulationPages.length > 0) {
        const regMatch = stateEntry.match(/(regulationPages: \[([^\]]*)\])/);
        if (regMatch) {
          let existingReg = regMatch[2].trim();
          if (existingReg && !existingReg.endsWith(',')) {
            existingReg += ',';
          }
          const newReg = additions.regulationPages.map(url => `    '${url}'`).join(',\n');
          const updatedReg = existingReg ? `${existingReg}\n${newReg}` : newReg;
          stateEntry = stateEntry.replace(regMatch[1], `regulationPages: [\n${updatedReg}\n  ]`);
        }
      }

      pollerContent = pollerContent.replace(match[1], stateEntry);
      totalAdded += totalForState;
      console.log(`✅ Added ${totalForState} sources to ${state}`);
    } else {
      console.log(`❌ Could not find ${state} entry in poller`);
    }
  }

  fs.writeFileSync('supabase/functions/cannabis-hemp-poller/index.ts', pollerContent);

  console.log(`\n=== UPDATE COMPLETE ===`);
  console.log(`Total new sources added: ${totalAdded}`);

  // Regenerate CSV
  console.log('\nRegenerating CSV files...');
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

  console.log('\n🎯 Ready for Phase 1 accuracy testing!');
}

updatePoller();