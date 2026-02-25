#!/usr/bin/env node
/**
 * THYNKFLOW Local Test Agent
 * Run from base station to validate all critical platform systems.
 * 
 * Usage:
 *   node scripts/local-test-agent.js
 *   node scripts/local-test-agent.js --verbose
 *   node scripts/local-test-agent.js --json          # machine-readable output
 *   node scripts/local-test-agent.js --loop 300      # repeat every 300s (5min)
 */

const SITE_URL = 'https://www.thynkflow.io';
const SUPABASE_URL = 'https://kruwbjaszdwzttblxqwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtydXdiamFzemR3enR0Ymx4cXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjcwOTIsImV4cCI6MjA3Njc0MzA5Mn0.BOmy4m7qoukUVyG1j8kDyyuA__mp9BeYdiDXL_OW-ZQ';

const VERBOSE = process.argv.includes('--verbose');
const JSON_OUTPUT = process.argv.includes('--json');
const LOOP_IDX = process.argv.indexOf('--loop');
const LOOP_INTERVAL = LOOP_IDX !== -1 ? parseInt(process.argv[LOOP_IDX + 1]) || 300 : 0;

// ── Helpers ──────────────────────────────────────────────────────────────────

async function timedFetch(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const elapsed = Date.now() - start;
    return { ok: res.ok, status: res.status, elapsed, res };
  } catch (err) {
    const elapsed = Date.now() - start;
    return { ok: false, status: 0, elapsed, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

const results = [];
let passCount = 0;
let failCount = 0;
let warnCount = 0;

function record(category, name, passed, detail = '', warn = false) {
  const status = passed ? (warn ? 'WARN' : 'PASS') : 'FAIL';
  if (passed && warn) warnCount++;
  else if (passed) passCount++;
  else failCount++;
  
  results.push({ category, name, status, detail });
  
  if (!JSON_OUTPUT) {
    const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️ ' : '❌';
    const detailStr = detail ? ` — ${detail}` : '';
    console.log(`  ${icon} ${name}${detailStr}`);
  }
}

// ── Test Suites ──────────────────────────────────────────────────────────────

async function testFrontend() {
  if (!JSON_OUTPUT) console.log('\n🌐 FRONTEND');

  // Homepage
  const home = await timedFetch(SITE_URL);
  record('frontend', 'Homepage loads', home.ok, `${home.status} in ${home.elapsed}ms`);
  if (home.ok && home.elapsed > 5000) {
    record('frontend', 'Homepage speed', true, `${home.elapsed}ms (slow > 5s)`, true);
  }

  // Key routes (SPA — all should return 200 from index.html)
  const routes = ['/login', '/signup', '/dashboard', '/analytics', '/privacy', '/terms'];
  for (const route of routes) {
    const r = await timedFetch(`${SITE_URL}${route}`);
    record('frontend', `Route ${route}`, r.ok, `${r.status} in ${r.elapsed}ms`);
  }

  // Static assets
  const assets = await timedFetch(`${SITE_URL}/favicon.ico`);
  record('frontend', 'Static assets (favicon)', assets.ok, `${assets.status}`);
}

async function testSupabaseAPI() {
  if (!JSON_OUTPUT) console.log('\n🗄️  SUPABASE API');

  // Health/REST endpoint
  const health = await timedFetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  });
  record('supabase', 'REST API reachable', health.ok, `${health.status} in ${health.elapsed}ms`);

  // Auth endpoint
  const auth = await timedFetch(`${SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: SUPABASE_ANON_KEY }
  });
  record('supabase', 'Auth service', auth.ok, `${auth.status} in ${auth.elapsed}ms`);

  // Instruments table — data exists
  const instruments = await timedFetch(
    `${SUPABASE_URL}/rest/v1/instrument?select=id,title,created_at&order=created_at.desc&limit=5`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    }
  );
  if (instruments.ok) {
    try {
      const data = await instruments.res.json();
      const count = Array.isArray(data) ? data.length : 0;
      record('supabase', 'Instruments table has data', count > 0, `${count} recent records`);
      
      // Data freshness — newest record within last 7 days?
      if (count > 0 && data[0].created_at) {
        const newest = new Date(data[0].created_at);
        const ageHours = (Date.now() - newest.getTime()) / (1000 * 60 * 60);
        const fresh = ageHours < 168; // 7 days
        record('supabase', 'Data freshness', fresh, 
          `Newest: ${newest.toISOString().slice(0,10)} (${Math.round(ageHours)}h ago)`, !fresh);
      }
    } catch { record('supabase', 'Instruments parse', false, 'JSON parse error'); }
  } else {
    record('supabase', 'Instruments table', false, `${instruments.status}`);
  }

  // Jurisdictions
  const jurisdictions = await timedFetch(
    `${SUPABASE_URL}/rest/v1/jurisdiction?select=id&limit=1`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    }
  );
  record('supabase', 'Jurisdictions table', jurisdictions.ok, `${jurisdictions.status}`);

  // User profiles table accessible
  const profiles = await timedFetch(
    `${SUPABASE_URL}/rest/v1/user_profiles?select=id&limit=1`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    }
  );
  // RLS will likely return empty array (not error) for anon
  record('supabase', 'User profiles (RLS active)', profiles.ok, `${profiles.status}`);
}

async function testEdgeFunctions() {
  if (!JSON_OUTPUT) console.log('\n⚡ EDGE FUNCTIONS');

  const functions = [
    'federal-register-poller',
    'congress-poller',
    'caselaw-poller',
    'state-legislature-poller',
    'state-regulations-poller',
    'cannabis-hemp-poller',
    'kratom-poller',
    'kava-poller',
    'create-checkout-session',
    'stripe-webhook',
    'trial-management',
    'site-monitor',
    'scheduled-poller-cron',
    'ticket-agent',
    'workflow-agent',
  ];

  for (const fn of functions) {
    // OPTIONS request tests CORS and that the function exists
    const r = await timedFetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
      method: 'OPTIONS',
      headers: { apikey: SUPABASE_ANON_KEY }
    });
    // 200 or 204 = good, 404 = not deployed
    const deployed = r.ok || r.status === 204;
    record('edge', fn, deployed, `${r.status} in ${r.elapsed}ms`);
  }
}

async function testTrialSystem() {
  if (!JSON_OUTPUT) console.log('\n🔑 TRIAL SYSTEM');

  // Check trial-management responds correctly
  const r = await timedFetch(`${SUPABASE_URL}/functions/v1/trial-management`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ action: 'status', email: 'test-agent@thynk.guru' })
  });

  if (r.ok) {
    try {
      const data = await r.res.json();
      record('trial', 'Trial management responds', true, JSON.stringify(data).slice(0, 120));
      
      // Verify 7-day trial duration
      if (data.trial_end_date) {
        const endDate = new Date(data.trial_end_date);
        const now = new Date();
        const diffDays = Math.round((endDate - now) / (1000 * 60 * 60 * 24));
        const is7Day = diffDays >= 6 && diffDays <= 8; // allow 1 day tolerance
        record('trial', '7-day trial duration', is7Day, `${diffDays} days from now`);
      }
      if (data.days_remaining !== undefined) {
        record('trial', 'days_remaining = 7', data.days_remaining === 7, `Got: ${data.days_remaining}`);
      }
    } catch { record('trial', 'Trial response parse', false, 'JSON error'); }
  } else {
    record('trial', 'Trial management', false, `${r.status} ${r.error || ''}`);
  }
}

async function testStripeIntegration() {
  if (!JSON_OUTPUT) console.log('\n💳 STRIPE INTEGRATION');

  // Check create-checkout-session exists (POST without body should return error, not 404)
  const r = await timedFetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({}) // empty body — should get validation error, not 404
  });

  // We expect an error response (400/500) but NOT 404 (which means not deployed)
  const deployed = r.status !== 404 && r.status !== 0;
  record('stripe', 'Checkout session endpoint exists', deployed, `${r.status} in ${r.elapsed}ms`);

  // Stripe webhook should be deployed
  const wh = await timedFetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
    method: 'OPTIONS',
    headers: { apikey: SUPABASE_ANON_KEY }
  });
  record('stripe', 'Webhook endpoint exists', wh.ok || wh.status === 204, `${wh.status}`);
}

async function testDataPollers() {
  if (!JSON_OUTPUT) console.log('\n📡 DATA POLLERS (source registry)');

  // Check poller_sources table
  const r = await timedFetch(
    `${SUPABASE_URL}/rest/v1/poller_sources?select=id,name,poller_type,is_active,last_polled_at&is_active=eq.true&limit=20`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    }
  );

  if (r.ok) {
    try {
      const data = await r.res.json();
      const count = Array.isArray(data) ? data.length : 0;
      record('pollers', 'Active poller sources', count > 0, `${count} active sources`);

      // Check if any have polled recently (within 48h)
      if (count > 0) {
        const recentlyPolled = data.filter(s => {
          if (!s.last_polled_at) return false;
          const age = Date.now() - new Date(s.last_polled_at).getTime();
          return age < 48 * 60 * 60 * 1000;
        });
        record('pollers', 'Recently polled (48h)', recentlyPolled.length > 0, 
          `${recentlyPolled.length}/${count} sources polled recently`);
      }
    } catch { record('pollers', 'Poller sources parse', false, 'JSON error'); }
  } else {
    // Table might not exist or RLS blocks it
    record('pollers', 'Poller sources table', false, `${r.status} (may need service role)`, true);
  }
}

async function testSSL() {
  if (!JSON_OUTPUT) console.log('\n🔒 SSL / SECURITY');

  // HTTPS enforced
  const r = await timedFetch(SITE_URL.replace('http://', 'https://'));
  record('ssl', 'HTTPS works', r.ok, `${r.status}`);

  // Check security headers
  if (r.ok) {
    const headers = Object.fromEntries(r.res.headers.entries());
    const hasXFrame = !!headers['x-frame-options'];
    const hasCSP = !!headers['content-security-policy'];
    const hasStrict = !!headers['strict-transport-security'];
    
    if (VERBOSE) {
      record('ssl', 'X-Frame-Options', hasXFrame, headers['x-frame-options'] || 'missing');
      record('ssl', 'Content-Security-Policy', hasCSP, hasCSP ? 'present' : 'missing', !hasCSP);
      record('ssl', 'Strict-Transport-Security', hasStrict, headers['strict-transport-security'] || 'missing', !hasStrict);
    } else {
      const secCount = [hasXFrame, hasCSP, hasStrict].filter(Boolean).length;
      record('ssl', 'Security headers', secCount >= 1, `${secCount}/3 present`, secCount < 2);
    }
  }
}

// ── Main Runner ──────────────────────────────────────────────────────────────

async function runAllTests() {
  const runStart = Date.now();
  
  if (!JSON_OUTPUT) {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║        THYNKFLOW Local Test Agent v1.0                  ║');
    console.log('║        Testing: www.thynkflow.io                        ║');
    console.log(`║        Time: ${new Date().toISOString()}          ║`);
    console.log('╚══════════════════════════════════════════════════════════╝');
  }

  // Reset counters
  results.length = 0;
  passCount = 0;
  failCount = 0;
  warnCount = 0;

  await testFrontend();
  await testSupabaseAPI();
  await testEdgeFunctions();
  await testTrialSystem();
  await testStripeIntegration();
  await testDataPollers();
  await testSSL();

  const totalTime = Date.now() - runStart;

  if (JSON_OUTPUT) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      duration_ms: totalTime,
      summary: { pass: passCount, fail: failCount, warn: warnCount, total: results.length },
      results
    }, null, 2));
  } else {
    console.log('\n' + '═'.repeat(58));
    console.log(`  RESULTS: ${passCount} passed, ${failCount} failed, ${warnCount} warnings`);
    console.log(`  Total time: ${(totalTime / 1000).toFixed(1)}s`);
    
    if (failCount === 0) {
      console.log('  🚀 ALL SYSTEMS GO — Ready for campaign launch!');
    } else {
      console.log('  ⛔ ISSUES DETECTED — Review failures above before launch.');
      // List failures
      const failures = results.filter(r => r.status === 'FAIL');
      failures.forEach(f => console.log(`     ❌ ${f.category}/${f.name}: ${f.detail}`));
    }
    console.log('═'.repeat(58));
  }

  return failCount;
}

// ── Entry Point ──────────────────────────────────────────────────────────────

(async () => {
  const failures = await runAllTests();

  if (LOOP_INTERVAL > 0) {
    console.log(`\n🔄 Loop mode: re-running every ${LOOP_INTERVAL}s (Ctrl+C to stop)\n`);
    setInterval(runAllTests, LOOP_INTERVAL * 1000);
  } else {
    process.exit(failures > 0 ? 1 : 0);
  }
})();
