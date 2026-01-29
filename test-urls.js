#!/usr/bin/env node

/**
 * Script to test agency URLs from the CSV and identify failing links
 * that would cause "error fetches" in the pollers.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, 'agency_links_to_test.csv');
const outputCsvPath = path.join(__dirname, 'error_fetches_report.csv');

async function testUrls() {
  console.log('🔍 Testing agency URLs for failures...');

  // Read CSV
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    records.push(record);
  }

  console.log(`📊 Testing ${records.length} URLs...`);

  const results = [];
  let tested = 0;
  let errors = 0;

  // Test URLs in batches to avoid overwhelming
  for (const record of records) {
    try {
      const result = await testUrl(record.url);
      record.status_code = result.statusCode;
      record.last_tested = new Date().toISOString();
      record.notes = result.error || '';

      if (result.isError) {
        errors++;
        console.log(`❌ ${record.state_code} ${record.url_type}: ${result.statusCode} - ${record.url}`);
      }

      results.push(record);
      tested++;

      // Progress update
      if (tested % 20 === 0) {
        console.log(`⏳ Tested ${tested}/${records.length} URLs (${errors} errors found)`);
      }

      // Small delay to be respectful to servers
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (err) {
      console.error(`Error testing ${record.url}:`, err.message);
      record.status_code = 'ERROR';
      record.last_tested = new Date().toISOString();
      record.notes = `Test failed: ${err.message}`;
      results.push(record);
      errors++;
    }
  }

  // Export results
  exportToCSV(results, outputCsvPath);

  console.log(`\n✅ Testing complete!`);
  console.log(`📊 Results exported to ${outputCsvPath}`);
  console.log(`🚨 Found ${errors} failing URLs out of ${tested} tested`);

  // Print summary of errors
  printErrorSummary(results);
}

async function testUrl(url) {
  try {
    // Use curl to test the URL
    const command = `curl -s -o /dev/null -w "%{http_code}" --max-time 10 --connect-timeout 5 -L "${url}"`;
    const output = execSync(command, { encoding: 'utf8' }).trim();

    const statusCode = parseInt(output);

    // Consider these as errors (failing fetches)
    const isError = statusCode >= 400 || statusCode === 0;

    return {
      statusCode: statusCode || 'TIMEOUT',
      isError,
      error: isError ? `HTTP ${statusCode}` : ''
    };

  } catch (err) {
    return {
      statusCode: 'ERROR',
      isError: true,
      error: err.message
    };
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  result.push(current);

  return result;
}

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

function printErrorSummary(records) {
  const errors = records.filter(r => r.status_code && (parseInt(r.status_code) >= 400 || r.status_code === 'ERROR' || r.status_code === 'TIMEOUT'));

  console.log('\n📈 Error Summary:');

  // Group by status code
  const byStatus = errors.reduce((acc, r) => {
    const status = r.status_code || 'UNKNOWN';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  console.log('By HTTP Status Code:');
  Object.entries(byStatus)
    .sort(([,a], [,b]) => b - a)
    .forEach(([status, count]) => {
    console.log(`  ${status}: ${count} URLs`);
  });

  // Group by state
  const byState = errors.reduce((acc, r) => {
    const state = r.state_code || 'UNKNOWN';
    acc[state] = (acc[state] || 0) + 1;
    return acc;
  }, {});

  console.log('\nBy State (failing URLs):');
  Object.entries(byState)
    .sort(([,a], [,b]) => b - a)
    .forEach(([state, count]) => {
    console.log(`  ${state}: ${count} failing URLs`);
  });

  // Show some examples
  console.log('\n🔍 Sample failing URLs:');
  errors.slice(0, 10).forEach(error => {
    console.log(`  ${error.state_code} ${error.url_type}: ${error.status_code} - ${error.url}`);
  });

  if (errors.length > 10) {
    console.log(`  ... and ${errors.length - 10} more`);
  }
}

// Run the testing
testUrls().catch(console.error);