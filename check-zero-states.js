import fs from 'fs';
import https from 'https';

// States that showed 0% accessibility in the last check
const PROBLEMATIC_STATES = ['CO', 'FL', 'ID', 'IL', 'KS', 'KY', 'MD', 'MI', 'MT', 'NE', 'OK', 'OR', 'TN', 'VA', 'WA', 'WV'];

async function checkUrl(url, timeout = 10000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ url, accessible: false, error: 'Timeout' });
    }, timeout);

    try {
      const req = https.request(new URL(url), { method: 'HEAD' }, (res) => {
        clearTimeout(timer);
        resolve({
          url,
          accessible: res.statusCode >= 200 && res.statusCode < 400,
          statusCode: res.statusCode
        });
      });

      req.on('error', (err) => {
        clearTimeout(timer);
        resolve({ url, accessible: false, error: err.message });
      });

      req.end();
    } catch (err) {
      clearTimeout(timer);
      resolve({ url, accessible: false, error: err.message });
    }
  });
}

async function checkStateSources(state) {
  console.log(`\n🔍 Checking ${state} sources...`);

  // Read the poller config
  const configPath = 'supabase/functions/cannabis-hemp-poller/index.ts';
  const configContent = fs.readFileSync(configPath, 'utf8');

  // Extract state sources
  const stateRegex = new RegExp(`'${state}':\\s*\\{([\\s\\S]*?)\\},`, 'm');
  const match = configContent.match(stateRegex);

  if (!match) {
    console.log(`❌ No configuration found for ${state}`);
    return { state, total: 0, accessible: 0, sources: [] };
  }

  const stateConfig = match[1];

  // Extract URLs from newsPages and regulationPages
  const urlRegex = /'([^']+)'/g;
  const urls = [];
  let urlMatch;
  while ((urlMatch = urlRegex.exec(stateConfig)) !== null) {
    const url = urlMatch[1];
    if (url.startsWith('http')) {
      urls.push(url);
    }
  }

  console.log(`📊 Found ${urls.length} URLs for ${state}`);

  // Check accessibility
  const results = [];
  for (const url of urls) {
    const result = await checkUrl(url);
    results.push(result);
    console.log(`${result.accessible ? '✅' : '❌'} ${url}`);
  }

  const accessible = results.filter(r => r.accessible).length;

  return {
    state,
    total: urls.length,
    accessible,
    accuracy: urls.length > 0 ? (accessible / urls.length * 100).toFixed(1) : 0,
    sources: results
  };
}

async function main() {
  console.log('🎯 Checking problematic states with 0% accessibility...\n');

  const results = [];

  for (const state of PROBLEMATIC_STATES) {
    const result = await checkStateSources(state);
    results.push(result);
  }

  console.log('\n📈 SUMMARY:');
  console.log('='.repeat(50));

  results.forEach(result => {
    console.log(`${result.state}: ${result.accessible}/${result.total} (${result.accuracy}%)`);
  });

  // Find states with truly 0 accessible sources
  const zeroStates = results.filter(r => r.accessible === 0);

  console.log(`\n🚨 States with 0 accessible sources: ${zeroStates.map(r => r.state).join(', ')}`);

  if (zeroStates.length > 0) {
    console.log('\n🔧 These states need verified sources added:');
    zeroStates.forEach(state => {
      console.log(`- ${state}: ${state.total} total sources, all inaccessible`);
    });
  } else {
    console.log('\n✅ All problematic states now have at least one accessible source!');
  }
}

main().catch(console.error);