#!/usr/bin/env node

/**
 * Source Quality Checker Agent
 *
 * This script runs every 3 days to:
 * 1. Update the poller sources CSV
 * 2. Check each source URL for quality and recency
 * 3. Score sources to determine "best routes"
 * 4. Generate a quality report
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// import pkg from 'csv-parser';
// const { parse } = pkg;
import * as cheerio from 'cheerio';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  csvPath: path.join(__dirname, 'all-poller-sources.csv'),
  reportPath: path.join(__dirname, 'source-quality-report.json'),
  maxConcurrent: 5, // Max concurrent requests
  delayBetweenRequests: 1000, // 1 second between requests
  timeout: 15000, // 15 second timeout
  maxRetries: 2
};

// Scoring weights
const WEIGHTS = {
  httpStatus: 0.2,
  responseTime: 0.2,
  contentLength: 0.1,
  hasRecentContent: 0.3,
  hasRegulatoryKeywords: 0.2
};

/**
 * Run the export script to update the CSV
 */
function updateSourcesCSV() {
  console.log('🔄 Updating poller sources CSV...');
  try {
    execSync('node export-poller-sources.js', { stdio: 'inherit' });
    console.log('✅ CSV updated successfully');
  } catch (error) {
    console.error('❌ Failed to update CSV:', error.message);
    throw error;
  }
}

/**
 * Read and parse the CSV file (simple parser)
 */
function readSourcesCSV() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CONFIG.csvPath)) {
      reject(new Error(`CSV file not found: ${CONFIG.csvPath}`));
      return;
    }

    const content = fs.readFileSync(CONFIG.csvPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      reject(new Error('CSV file appears to be empty or malformed'));
      return;
    }

    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    const sources = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
      if (values.length === headers.length) {
        const source = {};
        headers.forEach((header, index) => {
          source[header] = values[index];
        });
        sources.push(source);
      }
    }

    console.log(`📊 Loaded ${sources.length} sources from CSV`);
    resolve(sources);
  });
}

/**
 * Fetch URL with retry logic and rate limiting
 */
async function fetchWithRetry(url, retries = CONFIG.maxRetries) {
  for (let i = 0; i <= retries; i++) {
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const content = await response.text();
        return {
          success: true,
          status: response.status,
          responseTime,
          contentLength: content.length,
          content,
          contentType: response.headers.get('content-type') || ''
        };
      }

      return {
        success: false,
        status: response.status,
        responseTime,
        error: `HTTP ${response.status}`
      };

    } catch (error) {
      console.log(`⚠️  Fetch attempt ${i + 1} failed for ${url}: ${error.message}`);
      if (i === retries) {
        return {
          success: false,
          status: 0,
          responseTime: CONFIG.timeout,
          error: error.message
        };
      }
      // Wait before retry
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

/**
 * Analyze content for quality indicators
 */
function analyzeContent(content, contentType) {
  if (!content) return { hasRecentContent: false, hasRegulatoryKeywords: false };

  const $ = cheerio.load(content);
  const text = $.text().toLowerCase();

  // Check for recent dates (last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const datePatterns = [
    /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, // MM/DD/YYYY
    /\b(\d{4})-(\d{2})-(\d{2})\b/g, // YYYY-MM-DD
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi
  ];

  let hasRecentContent = false;
  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      let date;
      if (match[3]) { // MM/DD/YYYY or YYYY-MM-DD
        if (match[1].length === 4) { // YYYY-MM-DD
          date = new Date(`${match[1]}-${match[2]}-${match[3]}`);
        } else { // MM/DD/YYYY
          date = new Date(`${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`);
        }
      } else { // Month DD, YYYY
        const monthNames = {
          january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
          july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
        };
        const month = monthNames[match[1].toLowerCase()];
        date = new Date(match[3], month, match[2]);
      }

      if (date >= thirtyDaysAgo && date <= now) {
        hasRecentContent = true;
        break;
      }
    }
    if (hasRecentContent) break;
  }

  // Check for regulatory keywords
  const regulatoryKeywords = [
    'regulation', 'regulatory', 'compliance', 'law', 'statute', 'rule',
    'cannabis', 'hemp', 'cbd', 'marijuana', 'license', 'permit',
    'guidance', 'policy', 'amendment', 'update'
  ];

  const hasRegulatoryKeywords = regulatoryKeywords.some(keyword =>
    text.includes(keyword)
  );

  return { hasRecentContent, hasRegulatoryKeywords };
}

/**
 * Calculate quality score for a source
 */
function calculateScore(fetchResult, analysis) {
  let score = 0;

  // HTTP status score (0-1)
  const statusScore = fetchResult.success ? 1 : 0;
  score += statusScore * WEIGHTS.httpStatus;

  // Response time score (faster is better, max 10 seconds = 0, instant = 1)
  const timeScore = Math.max(0, 1 - (fetchResult.responseTime / 10000));
  score += timeScore * WEIGHTS.responseTime;

  // Content length score (more content is generally better, up to 100KB = 1)
  const contentLength = fetchResult.contentLength || 0;
  const lengthScore = Math.min(1, contentLength / 100000);
  score += lengthScore * WEIGHTS.contentLength;

  // Recent content score
  score += (analysis.hasRecentContent ? 1 : 0) * WEIGHTS.hasRecentContent;

  // Regulatory keywords score
  score += (analysis.hasRegulatoryKeywords ? 1 : 0) * WEIGHTS.hasRegulatoryKeywords;

  return {
    total: Math.round(score * 100) / 100,
    breakdown: {
      status: Math.round(statusScore * 100) / 100,
      responseTime: Math.round(timeScore * 100) / 100,
      contentLength: Math.round(lengthScore * 100) / 100,
      recentContent: analysis.hasRecentContent ? 1 : 0,
      regulatoryKeywords: analysis.hasRegulatoryKeywords ? 1 : 0
    }
  };
}

/**
 * Process sources in batches with rate limiting
 */
async function processSources(sources) {
  const results = [];
  const batches = [];

  // Create batches
  for (let i = 0; i < sources.length; i += CONFIG.maxConcurrent) {
    batches.push(sources.slice(i, i + CONFIG.maxConcurrent));
  }

  console.log(`🚀 Processing ${sources.length} sources in ${batches.length} batches...`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} sources)`);

    const batchPromises = batch.map(async (source) => {
      console.log(`🔍 Checking ${source.url} (${source.state} - ${source.category})`);

      const fetchResult = await fetchWithRetry(source.url);

      let analysis = { hasRecentContent: false, hasRegulatoryKeywords: false };
      if (fetchResult.success && fetchResult.content) {
        analysis = analyzeContent(fetchResult.content, fetchResult.contentType);
      }

      const score = calculateScore(fetchResult, analysis);

      return {
        ...source,
        checkedAt: new Date().toISOString(),
        fetchResult,
        analysis,
        score
      };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Rate limiting between batches
    if (i < batches.length - 1) {
      await new Promise(r => setTimeout(r, CONFIG.delayBetweenRequests));
    }
  }

  return results;
}

/**
 * Generate and save quality report
 */
function generateReport(results) {
  // Sort by score descending
  const sortedResults = results.sort((a, b) => b.score.total - a.score.total);

  // Group by state and category
  const byState = {};
  const byCategory = {};

  results.forEach(result => {
    // By state
    if (!byState[result.state]) byState[result.state] = [];
    byState[result.state].push(result);

    // By category
    if (!byCategory[result.category]) byCategory[result.category] = [];
    byCategory[result.category].push(result);
  });

  // Calculate averages
  const stateAverages = {};
  Object.keys(byState).forEach(state => {
    const stateResults = byState[state];
    const avgScore = stateResults.reduce((sum, r) => sum + r.score.total, 0) / stateResults.length;
    const successRate = stateResults.filter(r => r.fetchResult.success).length / stateResults.length;

    stateAverages[state] = {
      averageScore: Math.round(avgScore * 100) / 100,
      successRate: Math.round(successRate * 100),
      totalSources: stateResults.length,
      topSources: stateResults
        .filter(r => r.score.total > 0.5)
        .sort((a, b) => b.score.total - a.score.total)
        .slice(0, 3)
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalSources: results.length,
      successfulFetches: results.filter(r => r.fetchResult.success).length,
      averageScore: Math.round(results.reduce((sum, r) => sum + r.score.total, 0) / results.length * 100) / 100,
      topSources: sortedResults.slice(0, 10),
      worstSources: sortedResults.slice(-10).reverse()
    },
    byState: stateAverages,
    byCategory,
    allResults: sortedResults
  };

  // Save report
  fs.writeFileSync(CONFIG.reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Report saved to: ${CONFIG.reportPath}`);

  // Print summary
  console.log('\n📊 Quality Check Summary:');
  console.log(`   Total Sources: ${report.summary.totalSources}`);
  console.log(`   Successful Fetches: ${report.summary.successfulFetches} (${Math.round(report.summary.successfulFetches / report.summary.totalSources * 100)}%)`);
  console.log(`   Average Score: ${report.summary.averageScore}/1.0`);
  console.log(`   Top State: ${Object.keys(stateAverages).reduce((a, b) => stateAverages[a].averageScore > stateAverages[b].averageScore ? a : b)}`);
  console.log(`   Best Source: ${report.summary.topSources[0]?.url} (Score: ${report.summary.topSources[0]?.score.total})`);

  return report;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🎯 Starting Source Quality Checker Agent\n');

    // Step 1: Update CSV
    updateSourcesCSV();

    // Step 2: Read sources
    const allSources = await readSourcesCSV();
    const sources = allSources.slice(0, 5); // Limit to first 5 for testing

    // Step 3: Process sources
    const results = await processSources(sources);

    // Step 4: Generate report
    const report = generateReport(results);

    console.log('\n✅ Quality check completed successfully!');

  } catch (error) {
    console.error('❌ Error during quality check:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as runQualityCheck };