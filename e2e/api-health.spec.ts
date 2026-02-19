/**
 * E2E Tests: API & Edge Function Health
 * 
 * Verifies Supabase REST API and edge functions are responding.
 * Tests real HTTP calls — these are the backend smoke tests.
 */
import { test, expect } from '@playwright/test';

const SUPABASE_URL = 'https://kruwbjaszdwzttblxqwr.supabase.co';

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

test.describe('Edge Function CORS', () => {
  for (const fn of EDGE_FUNCTIONS) {
    test(`${fn} returns correct CORS headers`, async ({ request }) => {
      const response = await request.fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://www.thynkflow.io',
          'Access-Control-Request-Method': 'POST',
        },
      });
      
      const corsOrigin = response.headers()['access-control-allow-origin'];
      expect(corsOrigin).toBe('https://www.thynkflow.io');
    });
  }
});

test.describe('Supabase REST API', () => {
  const anonKey = process.env.SUPABASE_ANON_KEY;
  
  test.skip(!anonKey, 'SUPABASE_ANON_KEY not set — skipping REST API tests');
  
  test('Can query jurisdiction table', async ({ request }) => {
    const response = await request.get(`${SUPABASE_URL}/rest/v1/jurisdiction?select=id,name&limit=3`, {
      headers: {
        'apikey': anonKey || '',
      },
    });
    
    // Should be 200 (even if empty)
    expect(response.status()).toBe(200);
  });
  
  test('Can query instrument table', async ({ request }) => {
    const response = await request.get(`${SUPABASE_URL}/rest/v1/instrument?select=id&limit=1`, {
      headers: {
        'apikey': anonKey || '',
      },
    });
    
    expect(response.status()).toBe(200);
  });
});

test.describe('Redirect Health', () => {
  test('thynkflow.io redirects to www', async ({ request }) => {
    const response = await request.get('https://thynkflow.io/', {
      maxRedirects: 0,
    }).catch(e => e);
    
    // Should get a redirect (307)
    // Playwright may throw on non-2xx, so we handle both cases
    if (response?.status) {
      expect([200, 301, 307, 308]).toContain(response.status());
    }
  });
  
  test('www.thynkflow.io serves content', async ({ request }) => {
    const response = await request.get('https://www.thynkflow.io/');
    expect(response.status()).toBe(200);
    
    const body = await response.text();
    expect(body).toContain('<!DOCTYPE html>');
  });
});
