#!/usr/bin/env node

/**
 * Quick Poller Sources Accuracy Check
 * Samples 10% of sources for fast accuracy estimate
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CSV_FILE = path.join(__dirname, 'all-poller-sources.csv');
const SAMPLE_SIZE = 0.1; // 10% sample

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadCSV() {
  return new Promise((resolve, reject) => {
    const sources = [];
    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', (data) => sources.push(data))
      .on('end', () => resolve(sources))
      .on('error', reject);
  });
}

async function checkSource(source) {
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
      timeout: 15000, // 15 second timeout
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

async function main() {
  try {
    console.log('Loading CSV...');
    const allSources = await loadCSV();
    console.log(`Loaded ${allSources.length} total sources`);

    // Sample 10% randomly
    const sampleSize = Math.floor(allSources.length * SAMPLE_SIZE);
    const sampledSources = [];
    const usedIndices = new Set();

    while (sampledSources.length < sampleSize) {
      const randomIndex = Math.floor(Math.random() * allSources.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        sampledSources.push(allSources[randomIndex]);
      }
    }

    console.log(`Checking ${sampledSources.length} sampled sources...`);

    const results = [];
    for (let i = 0; i < sampledSources.length; i++) {
      const source = sampledSources[i];
      console.log(`Checking ${i + 1}/${sampledSources.length}: ${source.url}`);
      const result = await checkSource(source);
      results.push(result);

      // Small delay
      await sleep(500);
    }

    const accessible = results.filter(r => r.accessible).length;
    const accuracy = (accessible / results.length) * 100;

    console.log('\n=== QUICK ACCURACY CHECK ===');
    console.log(`Sample size: ${results.length}/${allSources.length} (${(SAMPLE_SIZE * 100).toFixed(0)}%)`);
    console.log(`Accessible: ${accessible}`);
    console.log(`Accuracy: ${accuracy.toFixed(1)}%`);

    // Project to full set
    const projectedAccessible = Math.floor((accessible / results.length) * allSources.length);
    const projectedAccuracy = (projectedAccessible / allSources.length) * 100;

    console.log('\n=== PROJECTION ===');
    console.log(`Projected accessible: ${projectedAccessible}/${allSources.length}`);
    console.log(`Projected accuracy: ${projectedAccuracy.toFixed(1)}%`);

    // By state summary
    const stateStats = {};
    results.forEach(result => {
      const state = result.state;
      if (!stateStats[state]) {
        stateStats[state] = { total: 0, accessible: 0 };
      }
      stateStats[state].total++;
      if (result.accessible) {
        stateStats[state].accessible++;
      }
    });

    console.log('\n=== STATE BREAKDOWN ===');
    Object.keys(stateStats).sort().forEach(state => {
      const stat = stateStats[state];
      const stateAccuracy = (stat.accessible / stat.total) * 100;
      console.log(`${state}: ${stat.accessible}/${stat.total} (${stateAccuracy.toFixed(1)}%)`);
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();