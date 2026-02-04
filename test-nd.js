#!/usr/bin/env node

/**
 * Quick test of ND sources
 */

async function testSource(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Test/1.0)',
      },
      timeout: 10000,
    });

    return {
      url,
      status: response.status,
      ok: response.ok,
      error: null
    };
  } catch (error) {
    return {
      url,
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function main() {
  const ndSources = [
    'https://www.ndda.nd.gov/news',
    'https://www.ndda.nd.gov/industrial-hemp',
    'https://www.ndda.nd.gov/industrial-hemp/regulations',
    'https://www.nd.gov/laws-regulations/hemp'
  ];

  console.log('Testing ND sources...\n');

  for (const url of ndSources) {
    console.log(`Testing: ${url}`);
    const result = await testSource(url);
    console.log(`  Status: ${result.status}, OK: ${result.ok}`);
    if (!result.ok) console.log(`  Error: ${result.error}`);
    console.log();
  }
}

main();