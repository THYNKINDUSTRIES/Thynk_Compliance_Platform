/**
 * Site Monitor Edge Function
 * 
 * Runs automated health checks across the entire platform:
 * - Frontend availability (www.thynkflow.io)
 * - All edge function health
 * - Database connectivity & data freshness
 * - SSL certificate validity
 * 
 * Results are stored in the site_health_checks table for the monitoring dashboard.
 * Can be triggered manually or via cron.
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://kruwbjaszdwzttblxqwr.supabase.co';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const ALLOWED_ORIGINS = [
  'https://thynkflow.io',
  'https://www.thynkflow.io',
  'https://thynk-compliance-platform-77nsei26a.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

function buildCors(req?: Request) {
  const origin = req?.headers?.get('origin') || '';
  const allowed = ALLOWED_ORIGINS.find(o => o === origin) || ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };
}

// Edge functions to check
const EDGE_FUNCTIONS = [
  'cannabis-hemp-poller',
  'caselaw-poller',
  'congress-poller',
  'federal-register-poller',
  'kava-poller',
  'kratom-poller',
  'regulatory-forecast',
  'state-legislature-poller',
  'state-regulations-poller',
  'create-checkout-session',
  'stripe-webhook',
  'trial-management',
];

// Critical pages to check
const CRITICAL_PAGES = [
  { url: 'https://www.thynkflow.io/', name: 'Homepage' },
  { url: 'https://www.thynkflow.io/app', name: 'Platform' },
  { url: 'https://www.thynkflow.io/login', name: 'Login' },
  { url: 'https://www.thynkflow.io/dashboard', name: 'Dashboard' },
  { url: 'https://www.thynkflow.io/analytics', name: 'Analytics' },
  { url: 'https://www.thynkflow.io/legislature-bills', name: 'Bills' },
];

interface HealthCheck {
  check_type: string;
  check_name: string;
  status: 'pass' | 'fail' | 'warn';
  response_time_ms: number;
  details: Record<string, unknown>;
  checked_at: string;
}

async function checkPage(url: string, name: string): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'ThynkSiteMonitor/1.0' },
      redirect: 'follow',
    });
    const elapsed = Date.now() - start;
    const status = res.ok ? 'pass' : (res.status < 500 ? 'warn' : 'fail');
    return {
      check_type: 'page',
      check_name: name,
      status,
      response_time_ms: elapsed,
      details: {
        url,
        http_status: res.status,
        content_type: res.headers.get('content-type'),
        has_hsts: !!res.headers.get('strict-transport-security'),
      },
      checked_at: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      check_type: 'page',
      check_name: name,
      status: 'fail',
      response_time_ms: Date.now() - start,
      details: { url, error: err.message },
      checked_at: new Date().toISOString(),
    };
  }
}

async function checkEdgeFunction(fnName: string): Promise<HealthCheck> {
  const start = Date.now();
  const url = `${SUPABASE_URL}/functions/v1/${fnName}`;
  try {
    // OPTIONS preflight is the lightest check — doesn't trigger actual execution
    const res = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://www.thynkflow.io',
        'Access-Control-Request-Method': 'POST',
      },
    });
    const elapsed = Date.now() - start;
    const corsHeader = res.headers.get('access-control-allow-origin');
    const corsOk = corsHeader === 'https://www.thynkflow.io';
    return {
      check_type: 'edge_function',
      check_name: fnName,
      status: res.ok && corsOk ? 'pass' : 'warn',
      response_time_ms: elapsed,
      details: {
        http_status: res.status,
        cors_origin: corsHeader,
        cors_valid: corsOk,
      },
      checked_at: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      check_type: 'edge_function',
      check_name: fnName,
      status: 'fail',
      response_time_ms: Date.now() - start,
      details: { error: err.message },
      checked_at: new Date().toISOString(),
    };
  }
}

async function checkDatabase(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];
  const headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };

  // Check 1: Basic connectivity
  const start1 = Date.now();
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/jurisdiction?select=id&limit=1`, { headers });
    const elapsed = Date.now() - start1;
    checks.push({
      check_type: 'database',
      check_name: 'connectivity',
      status: res.ok ? 'pass' : 'fail',
      response_time_ms: elapsed,
      details: { http_status: res.status },
      checked_at: new Date().toISOString(),
    });
  } catch (err: any) {
    checks.push({
      check_type: 'database',
      check_name: 'connectivity',
      status: 'fail',
      response_time_ms: Date.now() - start1,
      details: { error: err.message },
      checked_at: new Date().toISOString(),
    });
  }

  // Check 2: Data freshness — are there instruments updated in last 24h?
  const start2 = Date.now();
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/instrument?select=id&created_at=gte.${yesterday}&limit=1`,
      { headers }
    );
    const data = await res.json();
    const elapsed = Date.now() - start2;
    const hasFreshData = Array.isArray(data) && data.length > 0;
    checks.push({
      check_type: 'database',
      check_name: 'data_freshness_24h',
      status: hasFreshData ? 'pass' : 'warn',
      response_time_ms: elapsed,
      details: { has_recent_data: hasFreshData },
      checked_at: new Date().toISOString(),
    });
  } catch (err: any) {
    checks.push({
      check_type: 'database',
      check_name: 'data_freshness_24h',
      status: 'fail',
      response_time_ms: Date.now() - start2,
      details: { error: err.message },
      checked_at: new Date().toISOString(),
    });
  }

  // Check 3: Total instrument count (sanity check)
  const start3 = Date.now();
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/instrument?select=id&limit=1`,
      { ...{ headers }, method: 'HEAD' }
    );
    // Use HEAD with Prefer: count=exact for count
    const resCount = await fetch(
      `${SUPABASE_URL}/rest/v1/instrument?select=id`,
      { headers: { ...headers, 'Prefer': 'count=exact', 'Range': '0-0' } }
    );
    const contentRange = resCount.headers.get('content-range');
    const totalMatch = contentRange?.match(/\/(\d+)/);
    const total = totalMatch ? parseInt(totalMatch[1]) : 0;
    const elapsed = Date.now() - start3;
    checks.push({
      check_type: 'database',
      check_name: 'instrument_count',
      status: total > 0 ? 'pass' : 'warn',
      response_time_ms: elapsed,
      details: { total_instruments: total },
      checked_at: new Date().toISOString(),
    });
  } catch (err: any) {
    checks.push({
      check_type: 'database',
      check_name: 'instrument_count',
      status: 'fail',
      response_time_ms: Date.now() - start3,
      details: { error: err.message },
      checked_at: new Date().toISOString(),
    });
  }

  return checks;
}

async function checkSSL(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const res = await fetch('https://www.thynkflow.io/', { method: 'HEAD' });
    const hsts = res.headers.get('strict-transport-security');
    const elapsed = Date.now() - start;
    return {
      check_type: 'ssl',
      check_name: 'certificate',
      status: hsts ? 'pass' : 'warn',
      response_time_ms: elapsed,
      details: {
        hsts_header: hsts,
        protocol: 'https',
      },
      checked_at: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      check_type: 'ssl',
      check_name: 'certificate',
      status: 'fail',
      response_time_ms: Date.now() - start,
      details: { error: err.message },
      checked_at: new Date().toISOString(),
    };
  }
}

async function storeResults(checks: HealthCheck[]) {
  if (!SUPABASE_SERVICE_KEY) {
    console.warn('No service key — skipping DB storage');
    return;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/site_health_checks`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(checks),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn('Failed to store health checks:', text);
    }
  } catch (err) {
    console.warn('Error storing health checks:', err);
  }
}

Deno.serve(async (req) => {
  const corsHeaders = buildCors(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const allChecks: HealthCheck[] = [];

  // Run all checks in parallel for speed
  const [pageResults, edgeFnResults, dbResults, sslResult] = await Promise.all([
    // Pages
    Promise.all(CRITICAL_PAGES.map(p => checkPage(p.url, p.name))),
    // Edge functions
    Promise.all(EDGE_FUNCTIONS.map(fn => checkEdgeFunction(fn))),
    // Database
    checkDatabase(),
    // SSL
    checkSSL(),
  ]);

  allChecks.push(...pageResults, ...edgeFnResults, ...dbResults, sslResult);

  // Stamp ALL checks with the same batch timestamp so the dashboard can group them
  const batchTimestamp = new Date().toISOString();
  for (const check of allChecks) {
    check.checked_at = batchTimestamp;
  }

  // Store results in DB
  await storeResults(allChecks);

  // Compute summary
  const total = allChecks.length;
  const passed = allChecks.filter(c => c.status === 'pass').length;
  const warned = allChecks.filter(c => c.status === 'warn').length;
  const failed = allChecks.filter(c => c.status === 'fail').length;
  const overallStatus = failed > 0 ? 'degraded' : warned > 0 ? 'warning' : 'healthy';
  const totalTime = Date.now() - startTime;

  const summary = {
    status: overallStatus,
    score: Math.round((passed / total) * 100),
    total_checks: total,
    passed,
    warnings: warned,
    failures: failed,
    execution_time_ms: totalTime,
    checked_at: new Date().toISOString(),
    checks: allChecks,
  };

  return new Response(JSON.stringify(summary, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
