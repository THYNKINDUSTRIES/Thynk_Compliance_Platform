#!/usr/bin/env node

/**
 * Script to extract agency URLs from cannabis-hemp-poller and federal-register-poller
 * and create a CSV for testing which links are failing.
 *
 * Since we don't have database access, this script extracts URLs from the source code
 * that the pollers attempt to fetch from.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the cannabis-hemp-poller source
const pollerPath = path.join(__dirname, 'supabase/functions/cannabis-hemp-poller/index.ts');
const pollerContent = fs.readFileSync(pollerPath, 'utf8');

// Extract STATE_CANNABIS_SOURCES
const sourcesMatch = pollerContent.match(/const STATE_CANNABIS_SOURCES: Record<string, \{[\s\S]*?\}> = \{([\s\S]*?)\};/);
if (!sourcesMatch) {
  console.error('Could not find STATE_CANNABIS_SOURCES in poller');
  process.exit(1);
}

const sourcesText = sourcesMatch[1];
const stateMatches = sourcesText.matchAll(/'([A-Z]{2})': \{\s*agency: '([^']+)',\s*agencyName: '([^']+)',[\s\S]*?newsPages: \[([^\]]+)\],[\s\S]*?regulationPages: \[([^\]]+)\]/g);

const agencyRecords = [];

for (const match of stateMatches) {
  const [, stateCode, agencyUrl, agencyName, newsPagesStr, regulationPagesStr] = match;

  // Parse news pages
  const newsPages = newsPagesStr.match(/'([^']+)'/g)?.map(s => s.slice(1, -1)) || [];

  // Parse regulation pages
  const regulationPages = regulationPagesStr.match(/'([^']+)'/g)?.map(s => s.slice(1, -1)) || [];

  // Add main agency URL
  agencyRecords.push({
    state_code: stateCode,
    agency_name: agencyName,
    url: agencyUrl,
    url_type: 'agency_main',
    source: 'cannabis-hemp-poller'
  });

  // Add news pages
  newsPages.forEach(url => {
    agencyRecords.push({
      state_code: stateCode,
      agency_name: agencyName,
      url: url,
      url_type: 'news_page',
      source: 'cannabis-hemp-poller'
    });
  });

  // Add regulation pages
  regulationPages.forEach(url => {
    agencyRecords.push({
      state_code: stateCode,
      agency_name: agencyName,
      url: url,
      url_type: 'regulation_page',
      source: 'cannabis-hemp-poller'
    });
  });
}

// Add federal register URLs
agencyRecords.push({
  state_code: 'FED',
  agency_name: 'Federal Register',
  url: 'https://www.federalregister.gov/api/v1/documents.json',
  url_type: 'api_endpoint',
  source: 'federal-register-poller'
});

// Export to CSV
const csvPath = path.join(__dirname, 'agency_links_to_test.csv');
exportToCSV(agencyRecords, csvPath);

console.log(`✅ Exported ${agencyRecords.length} agency links to ${csvPath}`);
console.log('\n📊 Summary by state:');

const byState = agencyRecords.reduce((acc, r) => {
  acc[r.state_code] = (acc[r.state_code] || 0) + 1;
  return acc;
}, {});

Object.entries(byState)
  .sort(([,a], [,b]) => b - a)
  .forEach(([state, count]) => {
    console.log(`  ${state}: ${count} URLs`);
  });

console.log('\n🔍 To test these URLs, you can run:');
console.log('curl -s -o /dev/null -w "%{http_code} %{url_effective}\\n" -L <URL>');

function exportToCSV(records, filePath) {
  if (records.length === 0) {
    console.log('⚠️  No records to export');
    return;
  }

  const headers = [
    'state_code',
    'agency_name',
    'url_type',
    'url',
    'source',
    'status_code',
    'last_tested',
    'notes'
  ];

  const csvContent = [
    headers.join(','),
    ...records.map(record =>
      headers.map(header => {
        const value = record[header] || '';
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  fs.writeFileSync(filePath, csvContent, 'utf8');
}