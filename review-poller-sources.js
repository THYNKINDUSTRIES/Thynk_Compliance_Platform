#!/usr/bin/env node

/**
 * Review Poller Sources Agent
 * Runs every 3 days to scrape and analyze poller sources from CSV
 * Determines the "best routes" based on accessibility, content quality, and recency
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const EXPORT_SCRIPT = path.join(__dirname, 'export-poller-sources.js');
const CSV_FILE = path.join(__dirname, 'all-poller-sources.csv');
const REPORT_FILE = path.join(__dirname, 'poller-sources-review-report.json');

// Scoring weights
const WEIGHTS = {
  accessibility: 0.3,
  responseTime: 0.2,
  contentRichness: 0.3,
  recency: 0.2
};

// Rate limiting: delay between requests (ms)
const REQUEST_DELAY = 1000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runExportScript() {
  console.log('Running export script...');
  const { spawn } = await import('child_process');
  return new Promise((resolve, reject) => {
    const child = spawn('node', [EXPORT_SCRIPT], { stdio: 'inherit' });
    child.on('close', (code) => {
      if (code === 0) {
        console.log('Export script completed successfully');
        resolve();
      } else {
        reject(new Error(`Export script failed with code ${code}`));
      }
    });
  });
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

async function scrapeSource(source) {
  const startTime = Date.now();
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
      timeout: 30000, // 30 second timeout
    });

    const responseTime = Date.now() - startTime;
    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');

    let content = '';
    let $ = null;
    let title = '';
    let textLength = 0;
    let linkCount = 0;
    let dateCount = 0;

    if (isHtml) {
      content = await response.text();
      $ = cheerio.load(content);
      title = $('title').text().trim();
      textLength = $('body').text().replace(/\s+/g, ' ').trim().length;
      linkCount = $('a').length;

      // Count potential date patterns (simple regex)
      const dateRegex = /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b|\b\d{4}[-\/]\d{1,2}[-\/]\d{1,2}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/gi;
      dateCount = (content.match(dateRegex) || []).length;
    } else {
      content = await response.text();
      textLength = content.length;
    }

    return {
      ...source,
      status: response.status,
      responseTime,
      contentType,
      isHtml,
      title,
      textLength,
      linkCount,
      dateCount,
      accessible: response.ok,
      error: null
    };
  } catch (error) {
    return {
      ...source,
      status: 0,
      responseTime: Date.now() - startTime,
      accessible: false,
      error: error.message,
      textLength: 0,
      linkCount: 0,
      dateCount: 0
    };
  }
}

function calculateScore(source) {
  let score = 0;

  // Accessibility (0-1)
  const accessibilityScore = source.accessible ? 1 : 0;
  score += accessibilityScore * WEIGHTS.accessibility;

  // Response time (faster is better, normalize to 0-1, assuming <5s is good)
  const responseTimeScore = Math.max(0, 1 - (source.responseTime / 5000));
  score += responseTimeScore * WEIGHTS.responseTime;

  // Content richness (more text and links is better, normalize)
  const textScore = Math.min(1, source.textLength / 10000); // 10k chars = 1
  const linkScore = Math.min(1, source.linkCount / 50); // 50 links = 1
  const richnessScore = (textScore + linkScore) / 2;
  score += richnessScore * WEIGHTS.contentRichness;

  // Recency (more dates suggest more current content)
  const recencyScore = Math.min(1, source.dateCount / 10); // 10 dates = 1
  score += recencyScore * WEIGHTS.recency;

  return score;
}

async function main() {
  try {
    console.log('Starting poller sources review...');

    // Step 1: Run export script
    await runExportScript();

    // Step 2: Load CSV
    console.log('Loading CSV...');
    const sources = await loadCSV();
    console.log(`Loaded ${sources.length} sources`);

    // Step 3: Scrape each source with rate limiting
    console.log('Scraping sources...');
    const results = [];
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      console.log(`Scraping ${i + 1}/${sources.length}: ${source.url}`);
      const result = await scrapeSource(source);
      results.push(result);

      // Rate limiting
      if (i < sources.length - 1) {
        await sleep(REQUEST_DELAY);
      }
    }

    // Step 4: Calculate scores and rank
    console.log('Calculating scores...');
    const scoredResults = results.map(result => ({
      ...result,
      score: calculateScore(result)
    }));

    scoredResults.sort((a, b) => b.score - a.score);

    // Step 5: Generate report
    const report = {
      timestamp: new Date().toISOString(),
      totalSources: sources.length,
      scrapedSources: results.length,
      averageScore: scoredResults.reduce((sum, r) => sum + r.score, 0) / scoredResults.length,
      topSources: scoredResults.slice(0, 20), // Top 20
      failedSources: results.filter(r => !r.accessible),
      summary: {
        accessibleCount: results.filter(r => r.accessible).length,
        averageResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
        totalTextLength: results.reduce((sum, r) => sum + r.textLength, 0),
        totalLinks: results.reduce((sum, r) => sum + r.linkCount, 0),
        totalDates: results.reduce((sum, r) => sum + r.dateCount, 0)
      }
    };

    // Save report
    fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
    console.log(`Report saved to ${REPORT_FILE}`);

    // Print summary
    console.log('\n=== REVIEW SUMMARY ===');
    console.log(`Total sources: ${report.totalSources}`);
    console.log(`Accessible: ${report.summary.accessibleCount}`);
    console.log(`Average score: ${report.averageScore.toFixed(3)}`);
    console.log(`Average response time: ${report.summary.averageResponseTime.toFixed(0)}ms`);
    console.log('\nTop 5 sources:');
    report.topSources.slice(0, 5).forEach((source, i) => {
      console.log(`${i + 1}. ${source.agencyName} (${source.state}) - Score: ${source.score.toFixed(3)}`);
    });

  } catch (error) {
    console.error('Error during review:', error);
    process.exit(1);
  }
}

main();