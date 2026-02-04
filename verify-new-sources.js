#!/usr/bin/env node

/**
 * Verify New Sources for Problematic States
 * Scrapes potential new sources to verify they work
 */

import fs from 'fs';
import * as cheerio from 'cheerio';

// Potential new sources for states with poor coverage
const NEW_SOURCES = {
  'ND': {
    agency: 'https://www.ndda.nd.gov/',
    agencyName: 'North Dakota Department of Agriculture',
    candidates: [
      { type: 'news', url: 'https://www.ndda.nd.gov/news' },
      { type: 'news', url: 'https://www.ndda.nd.gov/industrial-hemp' },
      { type: 'regulations', url: 'https://www.ndda.nd.gov/industrial-hemp/regulations' },
      { type: 'regulations', url: 'https://www.nd.gov/laws-regulations/hemp' }
    ]
  },
  'SD': {
    agency: 'https://sddps.gov/',
    agencyName: 'South Dakota Department of Agriculture',
    candidates: [
      { type: 'news', url: 'https://sddps.gov/news' },
      { type: 'news', url: 'https://sddps.gov/hemp' },
      { type: 'regulations', url: 'https://sddps.gov/hemp/regulations' },
      { type: 'regulations', url: 'https://sddps.gov/hemp/rules' },
      { type: 'regulations', url: 'https://www.sd.gov/laws-regulations/hemp' }
    ]
  },
  'WY': {
    agency: 'https://agriculture.wy.gov/',
    agencyName: 'Wyoming Department of Agriculture',
    candidates: [
      { type: 'news', url: 'https://agriculture.wy.gov/news' },
      { type: 'news', url: 'https://agriculture.wy.gov/divisions/hemp' },
      { type: 'regulations', url: 'https://agriculture.wy.gov/divisions/hemp/regulations' },
      { type: 'regulations', url: 'https://www.wy.gov/laws-regulations/hemp' }
    ]
  },
  'VT': {
    agency: 'https://agriculture.vermont.gov/',
    agencyName: 'Vermont Agency of Agriculture, Food and Markets',
    candidates: [
      { type: 'news', url: 'https://agriculture.vermont.gov/news' },
      { type: 'news', url: 'https://agriculture.vermont.gov/hemp' },
      { type: 'regulations', url: 'https://agriculture.vermont.gov/hemp/regulations' },
      { type: 'regulations', url: 'https://agriculture.vermont.gov/hemp/rules' },
      { type: 'regulations', url: 'https://www.vt.gov/laws-regulations/hemp' }
    ]
  },
  'NH': {
    agency: 'https://www.nh.gov/hemp/',
    agencyName: 'New Hampshire Hemp Program',
    candidates: [
      { type: 'news', url: 'https://www.nh.gov/hemp/news' },
      { type: 'news', url: 'https://www.nh.gov/hemp/' },
      { type: 'regulations', url: 'https://www.nh.gov/hemp/regulations' },
      { type: 'regulations', url: 'https://www.nh.gov/hemp/rules' },
      { type: 'regulations', url: 'https://www.nh.gov/laws-regulations/hemp' }
    ]
  }
};

async function verifySource(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SourceVerifier/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 10000,
    });

    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');

    let title = '';
    let textLength = 0;
    let linkCount = 0;
    let hasHempContent = false;

    if (isHtml) {
      const content = await response.text();
      const $ = cheerio.load(content);
      title = $('title').text().trim();
      textLength = $('body').text().replace(/\s+/g, ' ').trim().length;
      linkCount = $('a').length;

      // Check for hemp/cannabis related content
      const bodyText = $('body').text().toLowerCase();
      hasHempContent = bodyText.includes('hemp') || bodyText.includes('cannabis') || bodyText.includes('marijuana');
    }

    return {
      url,
      status: response.status,
      accessible: response.ok,
      isHtml,
      title,
      textLength,
      linkCount,
      hasHempContent,
      error: null
    };
  } catch (error) {
    return {
      url,
      status: 0,
      accessible: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('Verifying new sources for problematic states...\n');

  const verifiedSources = {};

  for (const [state, data] of Object.entries(NEW_SOURCES)) {
    console.log(`Verifying sources for ${state} (${data.agencyName})`);
    verifiedSources[state] = {
      agency: data.agency,
      agencyName: data.agencyName,
      verifiedNews: [],
      verifiedRegulations: []
    };

    for (const candidate of data.candidates) {
      console.log(`  Checking ${candidate.type}: ${candidate.url}`);
      const result = await verifySource(candidate.url);

      if (result.accessible && result.hasHempContent && result.textLength > 1000) {
        if (candidate.type === 'news') {
          verifiedSources[state].verifiedNews.push(candidate.url);
        } else {
          verifiedSources[state].verifiedRegulations.push(candidate.url);
        }
        console.log(`    ✓ Valid source (${result.textLength} chars, ${result.linkCount} links)`);
      } else {
        console.log(`    ✗ Invalid: accessible=${result.accessible}, hempContent=${result.hasHempContent}, length=${result.textLength}`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`  Verified: ${verifiedSources[state].verifiedNews.length} news, ${verifiedSources[state].verifiedRegulations.length} regulations\n`);
  }

  // Generate update code
  console.log('=== PROPOSED UPDATES TO STATE_CANNABIS_SOURCES ===\n');

  for (const [state, data] of Object.entries(verifiedSources)) {
    if (data.verifiedNews.length > 0 || data.verifiedRegulations.length > 0) {
      console.log(`'${state}': {`);
      console.log(`  agency: '${data.agency}',`);
      console.log(`  agencyName: '${data.agencyName}',`);
      console.log(`  rssFeeds: [],`);
      console.log(`  newsPages: [`);

      data.verifiedNews.forEach(url => {
        console.log(`    '${url}',`);
      });

      console.log(`  ],`);
      console.log(`  regulationPages: [`);

      data.verifiedRegulations.forEach(url => {
        console.log(`    '${url}',`);
      });

      console.log(`  ]`);
      console.log(`},`);
      console.log();
    }
  }

  // Save to file
  fs.writeFileSync('verified-new-sources.json', JSON.stringify(verifiedSources, null, 2));
  console.log('Results saved to verified-new-sources.json');
}

main();