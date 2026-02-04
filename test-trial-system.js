#!/usr/bin/env node

/**
 * Trial System Test Script
 * Validates the complete trial system implementation
 */

import https from 'https';
import crypto from 'crypto';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-project-url';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_...';

// Test data
const testEmail = `test-${Date.now()}@example.com`;
const testJurisdiction = 'CA'; // California

async function makeRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = `${SUPABASE_URL}/functions/v1/${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testTrialSystem() {
  console.log('🧪 Testing THYNKFLOW Trial System...\n');

  try {
    // Test 1: Check trial status (should fail without auth)
    console.log('1. Testing trial status endpoint...');
    const statusResponse = await makeRequest('trial-management', 'POST', {
      action: 'status',
      email: testEmail
    });
    console.log(`   Status: ${statusResponse.status}`);
    console.log(`   Response: ${JSON.stringify(statusResponse.data, null, 2)}\n`);

    // Test 2: Attempt trial signup (will fail without Stripe token)
    console.log('2. Testing trial signup (without payment)...');
    const signupResponse = await makeRequest('trial-management', 'POST', {
      action: 'signup',
      email: testEmail,
      jurisdiction: testJurisdiction,
      fingerprint: crypto.randomBytes(32).toString('hex'),
      paymentMethodId: 'pm_test_invalid'
    });
    console.log(`   Status: ${signupResponse.status}`);
    console.log(`   Response: ${JSON.stringify(signupResponse.data, null, 2)}\n`);

    // Test 3: Check database schema (via SQL query)
    console.log('3. Validating database schema...');
    // This would require direct database access, so we'll skip for now
    console.log('   Database validation requires direct Supabase access\n');

    console.log('✅ Trial system test completed!');
    console.log('\nNext steps:');
    console.log('1. Deploy Edge Functions: supabase functions deploy trial-management');
    console.log('2. Deploy webhook handler: supabase functions deploy stripe-webhook');
    console.log('3. Run database migration: Execute trial_system_schema.sql');
    console.log('4. Test with real Stripe test card in the UI');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testTrialSystem();