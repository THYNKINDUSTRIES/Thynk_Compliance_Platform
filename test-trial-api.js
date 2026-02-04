#!/usr/bin/env node

/**
 * Trial System API Test
 * Tests the deployed trial system functions
 */

const SUPABASE_URL = 'https://kruwbjaszdwzttblxqwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtydXdiamFzemR3enR0Ymx4cXdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE2NzA5MiwiZXhwIjoyMDc2NzQzMDkyfQ.Kwq-p_oKXM3JXRKxVqvDYWoN3z5oM2BVq_rY61KoOaY';

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
      },
      body: JSON.stringify({
        action: 'status',
        email: 'test@example.com'
      })
    });

    const statusResult = await statusResponse.json();
    console.log(`   Status: ${statusResponse.status}`);
    console.log(`   Response:`, JSON.stringify(statusResult, null, 2));
    console.log('');

  } catch (error) {
    console.log('❌ API Test failed:', error.message);
  }
}

testTrialAPI();