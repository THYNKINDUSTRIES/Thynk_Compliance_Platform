#!/usr/bin/env node

/**
 * Fast State-by-State Accuracy Check
 * Checks all sources with parallel processing and shorter timeouts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CSV_FILE = path.join(__dirname, 'all-poller-sources.csv');
const CONCURRENT_REQUESTS = 10; // Check 10 at a time
const TIMEOUT = 10000; // 10 second timeout

async function checkSource(source) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PollerReviewAgent/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
      timeout: TIMEOUT,
    });

    clearTimeout(timeoutId);
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

async function processBatch(sources, startIdx) {
  const batch = sources.slice(startIdx, startIdx + CONCURRENT_REQUESTS);
  const promises = batch.map(source => checkSource(source));
  return await Promise.all(promises);
}

async function main() {
  try {
    console.log('Loading CSV...');
    const sources = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(CSV_FILE)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });

    console.log(`Loaded ${sources.length} sources`);
    console.log(`Processing in batches of ${CONCURRENT_REQUESTS}...`);

    const results = [];
    for (let i = 0; i < sources.length; i += CONCURRENT_REQUESTS) {
      console.log(`Processing batch ${Math.floor(i / CONCURRENT_REQUESTS) + 1}/${Math.ceil(sources.length / CONCURRENT_REQUESTS)} (${i + 1}-${Math.min(i + CONCURRENT_REQUESTS, sources.length)})`);
      const batchResults = await processBatch(sources, i);
      results.push(...batchResults);
    }

    // Calculate overall stats
    const accessible = results.filter(r => r.accessible).length;
    const accuracy = (accessible / results.length) * 100;

    console.log('\n=== OVERALL ACCURACY ===');
    console.log(`Total sources: ${results.length}`);
    console.log(`Accessible: ${accessible}`);
    console.log(`Accuracy: ${accuracy.toFixed(1)}%`);

    // State-by-state breakdown
    const stateStats = {};
    results.forEach(result => {
      const state = result.state;
      if (!stateStats[state]) {
        stateStats[state] = { total: 0, accessible: 0, sources: [] };
      }
      stateStats[state].total++;
      if (result.accessible) {
        stateStats[state].accessible++;
        stateStats[state].sources.push(result.url);
      }
    });

    console.log('\n=== STATE-BY-STATE BREAKDOWN ===');
    const sortedStates = Object.keys(stateStats).sort((a, b) => {
      const accA = stateStats[a].accessible / stateStats[a].total;
      const accB = stateStats[b].accessible / stateStats[b].total;
      return accA - accB; // Sort by accuracy ascending
    });

    sortedStates.forEach(state => {
      const stat = stateStats[state];
      const stateAccuracy = stat.total > 0 ? (stat.accessible / stat.total) * 100 : 0;
      console.log(`${state}: ${stat.accessible}/${stat.total} (${stateAccuracy.toFixed(1)}%)`);
    });

    // Identify states needing more sources
    console.log('\n=== STATES NEEDING MORE SOURCES (< 2 working) ===');
    const needyStates = sortedStates.filter(state => stateStats[state].accessible < 2);
    needyStates.forEach(state => {
      const stat = stateStats[state];
      console.log(`${state}: ${stat.accessible}/${stat.total} working sources`);
    });

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      overall: {
        total: results.length,
        accessible,
        accuracy: accuracy.toFixed(1) + '%'
      },
      states: stateStats,
      needyStates: needyStates.map(state => ({
        state,
        accessible: stateStats[state].accessible,
        total: stateStats[state].total
      }))
    };

    fs.writeFileSync('fast-accuracy-report.json', JSON.stringify(report, null, 2));
    console.log('\nReport saved to fast-accuracy-report.json');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();