#!/usr/bin/env node

/**
 * Trial System Validation Script
 * Validates code structure and provides deployment checklist
 */

import fs from 'fs';
import path from 'path';

const files = [
  'supabase/functions/trial-management/index.ts',
  'supabase/functions/stripe-webhook/index.ts',
  'supabase/migrations/trial_system_schema.sql',
  'src/lib/trialSystem.ts',
  'src/components/TrialSignupForm.tsx',
  'TRIAL_SYSTEM_README.md'
];

const functionChecks = [
  { func: 'handleTrialSignup', file: 'src/lib/trialSystem.ts' },
  { func: 'checkAbuseSignals', file: 'supabase/functions/trial-management/index.ts' },
  { func: 'hashFingerprint', file: 'supabase/functions/trial-management/index.ts' },
  { func: 'applyTrialRestrictions', file: 'src/lib/trialSystem.ts' },
  { func: 'initFingerprint', file: 'src/lib/trialSystem.ts' },
  { func: 'initializeStripeElements', file: 'src/lib/trialSystem.ts' }
];

const requiredComponents = [
  'TrialSignupForm',
  'useState',
  'useEffect'
];

function validateFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    return { exists: false, error: `File not found: ${filePath}` };
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  return { exists: true, content, size: content.length };
}

function checkFunction(content, functionName) {
  const regex = new RegExp(`function ${functionName}|const ${functionName} =|export.*${functionName}`);
  return regex.test(content);
}

function checkComponent(content, componentName) {
  return content.includes(componentName);
}

console.log('🔍 Validating THYNKFLOW Trial System Implementation...\n');

let allValid = true;

console.log('📁 Checking Files:');
files.forEach(file => {
  const result = validateFile(file);
  if (result.exists) {
    console.log(`   ✅ ${file} (${result.size} bytes)`);
  } else {
    console.log(`   ❌ ${file} - ${result.error}`);
    allValid = false;
  }
});

console.log('\n🔧 Checking Functions:');
functionChecks.forEach(({ func, file }) => {
  const result = validateFile(file);
  if (result.exists && checkFunction(result.content, func)) {
    console.log(`   ✅ ${func} (${file})`);
  } else {
    console.log(`   ❌ ${func} - not found in ${file}`);
    allValid = false;
  }
});

console.log('\n🧩 Checking Components:');
requiredComponents.forEach(comp => {
  const file = 'src/components/TrialSignupForm.tsx';
  const result = validateFile(file);
  if (result.exists && checkComponent(result.content, comp)) {
    console.log(`   ✅ ${comp}`);
  } else {
    console.log(`   ❌ ${comp} - not found in ${file}`);
    allValid = false;
  }
});

console.log('\n📋 Deployment Checklist:');
const checklist = [
  'Deploy Edge Functions: supabase functions deploy trial-management',
  'Deploy webhook handler: supabase functions deploy stripe-webhook',
  'Run database migration: Execute trial_system_schema.sql in Supabase SQL Editor',
  'Set environment variables in Supabase Edge Functions',
  'Configure Stripe webhook endpoint and events',
  'Add FingerprintJS and Stripe scripts to HTML head',
  'Test trial signup with Stripe test card (4242 4242 4242 4242)',
  'Verify abuse detection with multiple signup attempts',
  'Test authorized domain bypass (@thynk.guru, @cultivalaw.com, @discountpharms.com)',
  'Validate trial restrictions (delayed data, single jurisdiction, no exports)'
];

checklist.forEach((item, index) => {
  console.log(`   ${index + 1}. ${item}`);
});

console.log('\n' + '='.repeat(60));
if (allValid) {
  console.log('✅ All components validated successfully!');
  console.log('🚀 Ready for deployment and testing.');
} else {
  console.log('❌ Some components are missing or invalid.');
  console.log('🔧 Please check the errors above and fix before deployment.');
}
console.log('='.repeat(60));