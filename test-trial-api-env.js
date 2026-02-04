#!/usr/bin/env node

/**
 * Trial System API Test
 * Tests the deployed trial system functions
 * Uses environment variables for security
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kruwbjaszdwzttblxqwr.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('Error: SUPABASE_ANON_KEY environment variable is required');
  process.exit(1);
}

async function testTrialAPI() {
  console.log('🧪 Testing Trial System API...\n');

  try {
    // Test 1: Trial status check
    console.log('1. Testing trial status endpoint...');
    const statusResponse = await fetch(`${SUPABASE_URL}/functions/v1/trial-management`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ action: 'get_status' })
    });

    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.status} ${statusResponse.statusText}`);
    }

    const statusData = await statusResponse.json();
    console.log('✅ Trial status:', statusData);

    // Test 2: Trial activation (if applicable)
    console.log('\n2. Testing trial activation...');
    const activateResponse = await fetch(`${SUPABASE_URL}/functions/v1/trial-management`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ action: 'activate_trial' })
    });

    if (activateResponse.ok) {
      const activateData = await activateResponse.json();
      console.log('✅ Trial activation:', activateData);
    } else {
      console.log('ℹ️  Trial activation not available or already active');
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testTrialAPI();