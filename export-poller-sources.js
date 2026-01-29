#!/usr/bin/env node

/**
 * Export all poller sources to CSV format
 * This script extracts sources from all poller functions and exports them to CSV files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to extract agency contacts from the data file
function extractAgencyContacts() {
  const contactsPath = path.join(__dirname, 'src', 'data', 'agencyContacts.ts');

  if (!fs.existsSync(contactsPath)) {
    console.log('Agency contacts file not found, skipping...');
    return [];
  }

  const content = fs.readFileSync(contactsPath, 'utf8');

  // Extract federal agency contacts
  const federalMatch = content.match(/export const federalAgencyContacts: AgencyContact\[\] = \[([\s\S]*?)\];/);
  const stateMatch = content.match(/export const stateAgencyContacts: AgencyContact\[\] = \[([\s\S]*?)\];/);

  const contacts = [];

  if (federalMatch) {
    const federalContacts = parseContactsArray(federalMatch[1], 'federal');
    contacts.push(...federalContacts);
  }

  if (stateMatch) {
    const stateContacts = parseContactsArray(stateMatch[1], 'state');
    contacts.push(...stateContacts);
  }

  return contacts;
}

function parseContactsArray(arrayText, type) {
  const contacts = [];
  // Simple regex to extract contact objects
  const contactMatches = arrayText.match(/\{\s*id: '([^']*)',\s*name: '([^']*)',[\s\S]*?website: '([^']*)',[\s\S]*?\}/g);

  if (contactMatches) {
    contactMatches.forEach(match => {
      const idMatch = match.match(/id: '([^']*)'/);
      const nameMatch = match.match(/name: '([^']*)'/);
      const websiteMatch = match.match(/website: '([^']*)'/);

      if (idMatch && nameMatch && websiteMatch) {
        contacts.push({
          id: idMatch[1],
          name: nameMatch[2],
          website: websiteMatch[1],
          type: type
        });
      }
    });
  }

  return contacts;
}

// Function to extract STATE_CANNABIS_SOURCES from the cannabis-hemp-poller
function extractCannabisHempSources() {
  const pollerPath = path.join(__dirname, 'supabase', 'functions', 'cannabis-hemp-poller', 'index.ts');

  if (!fs.existsSync(pollerPath)) {
    console.error('Cannabis-hemp-poller not found at:', pollerPath);
    return [];
  }

  const content = fs.readFileSync(pollerPath, 'utf8');

  // Extract the STATE_CANNABIS_SOURCES object
  const sourcesMatch = content.match(/const STATE_CANNABIS_SOURCES: Record<string, \{[\s\S]*?\}> = \{([\s\S]*?)\};/);

  if (!sourcesMatch) {
    console.error('Could not find STATE_CANNABIS_SOURCES in the poller file');
    return [];
  }

  const sourcesText = sourcesMatch[1];

  // Parse the sources object
  const sources = [];
  const stateMatches = sourcesText.matchAll(/'([A-Z]{2})': \{\s*agency: '([^']*)',\s*agencyName: '([^']*)',\s*rssFeeds: (\[[^\]]*\]),\s*newsPages: (\[[^\]]*\]),\s*regulationPages: (\[[^\]]*\])\s*\}/g);

  for (const match of stateMatches) {
    const [_, stateCode, agency, agencyName, rssFeedsStr, newsPagesStr, regulationPagesStr] = match;

    // Parse arrays
    const rssFeeds = rssFeedsStr === '[]' ? [] : rssFeedsStr.slice(1, -1).split(',').map(s => s.trim().replace(/'/g, ''));
    const newsPages = newsPagesStr === '[]' ? [] : newsPagesStr.slice(1, -1).split(',').map(s => s.trim().replace(/'/g, ''));
    const regulationPages = regulationPagesStr === '[]' ? [] : regulationPagesStr.slice(1, -1).split(',').map(s => s.trim().replace(/'/g, ''));

    sources.push({
      stateCode,
      agency,
      agencyName,
      rssFeeds,
      newsPages,
      regulationPages
    });
  }

  return sources;
}

// Function to flatten sources into CSV rows
function flattenSourcesToCSV(sources) {
  const rows = [];

  sources.forEach(source => {
    const { stateCode, agency, agencyName, rssFeeds, newsPages, regulationPages } = source;

    // Add RSS feeds
    rssFeeds.forEach(url => {
      if (url) {
        rows.push({
          poller: 'cannabis-hemp-poller',
          state: stateCode,
          agency: agency,
          agencyName: agencyName,
          sourceType: 'rss',
          url: url,
          category: 'news'
        });
      }
    });

    // Add news pages
    newsPages.forEach(url => {
      if (url) {
        rows.push({
          poller: 'cannabis-hemp-poller',
          state: stateCode,
          agency: agency,
          agencyName: agencyName,
          sourceType: 'webpage',
          url: url,
          category: 'news'
        });
      }
    });

    // Add regulation pages
    regulationPages.forEach(url => {
      if (url) {
        rows.push({
          poller: 'cannabis-hemp-poller',
          state: stateCode,
          agency: agency,
          agencyName: agencyName,
          sourceType: 'webpage',
          url: url,
          category: 'regulations'
        });
      }
    });
  });

  return rows;
}

// Function to convert rows to CSV
function rowsToCSV(rows) {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const csvRows = [headers.join(',')];

  rows.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape quotes and wrap in quotes if contains comma or quote
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

// Main execution
function main() {
  console.log('🔍 Extracting poller sources...');

  // Extract cannabis-hemp sources
  const cannabisSources = extractCannabisHempSources();
  console.log(`📊 Found ${cannabisSources.length} states in cannabis-hemp-poller`);

  // Extract agency contacts
  const agencyContacts = extractAgencyContacts();
  console.log(`📞 Found ${agencyContacts.length} agency contacts`);

  if (cannabisSources.length === 0 && agencyContacts.length === 0) {
    console.error('No sources found. Exiting.');
    process.exit(1);
  }

  // Flatten cannabis sources to CSV rows
  const cannabisRows = flattenSourcesToCSV(cannabisSources);

  // Convert agency contacts to CSV rows
  const contactRows = agencyContacts.map(contact => ({
    poller: 'agency-contacts',
    state: contact.type === 'federal' ? 'FEDERAL' : contact.id.split('-')[0].toUpperCase(),
    agency: contact.website,
    agencyName: contact.name,
    sourceType: 'contact',
    url: contact.website,
    category: contact.type
  }));

  // Combine all rows
  const allRows = [...cannabisRows, ...contactRows];
  console.log(`📋 Generated ${allRows.length} total CSV rows`);

  // Convert to CSV
  const csv = rowsToCSV(allRows);

  // Write combined CSV
  const outputPath = path.join(__dirname, 'all-poller-sources.csv');
  fs.writeFileSync(outputPath, csv, 'utf8');
  console.log(`✅ Combined CSV exported to: ${outputPath}`);

  // Write separate CSV files for each poller
  const pollers = [...new Set(allRows.map(r => r.poller))];
  pollers.forEach(poller => {
    const pollerRows = allRows.filter(r => r.poller === poller);
    const pollerCsv = rowsToCSV(pollerRows);
    const pollerPath = path.join(__dirname, `${poller}-sources.csv`);
    fs.writeFileSync(pollerPath, pollerCsv, 'utf8');
    console.log(`✅ ${poller} CSV exported to: ${pollerPath} (${pollerRows.length} rows)`);
  });

  // Print summary
  const stats = {
    totalSources: allRows.length,
    states: [...new Set(allRows.map(r => r.state))].length,
    cannabisSources: cannabisRows.length,
    contactSources: contactRows.length,
    rssFeeds: allRows.filter(r => r.sourceType === 'rss').length,
    webpages: allRows.filter(r => r.sourceType === 'webpage').length,
    contacts: allRows.filter(r => r.sourceType === 'contact').length,
    newsSources: allRows.filter(r => r.category === 'news').length,
    regulationSources: allRows.filter(r => r.category === 'regulations').length,
    federalSources: allRows.filter(r => r.category === 'federal').length,
    stateSources: allRows.filter(r => r.category === 'state').length
  };

  console.log('\n📈 Summary:');
  console.log(`   States: ${stats.states}`);
  console.log(`   Total Sources: ${stats.totalSources}`);
  console.log(`   Cannabis Poller Sources: ${stats.cannabisSources}`);
  console.log(`   Agency Contacts: ${stats.contactSources}`);
  console.log(`   RSS Feeds: ${stats.rssFeeds}`);
  console.log(`   Webpages: ${stats.webpages}`);
  console.log(`   Contact Pages: ${stats.contacts}`);
  console.log(`   News Sources: ${stats.newsSources}`);
  console.log(`   Regulation Sources: ${stats.regulationSources}`);
  console.log(`   Federal Sources: ${stats.federalSources}`);
  console.log(`   State Sources: ${stats.stateSources}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { extractCannabisHempSources, flattenSourcesToCSV, rowsToCSV };