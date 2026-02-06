// THYNKFLOW Trial System - Client-side Integration
// Include this in your signup and dashboard pages

// Type declarations for global libraries
declare global {
  interface Window {
    ThynkTrial: {
      handleTrialSignup: (email: string, selectedJurisdiction: string) => Promise<void>;
      checkTrialStatus: () => Promise<any>;
      applyTrialRestrictions: (data: any, trialStatus: any) => any[];
      checkExportPermission: (trialStatus: any) => boolean;
    };
  }

  const FingerprintJS: any;
  const Stripe: any;
  const supabaseAuthToken: string;
  function showError(message: string): void;
}

// Initialize FingerprintJS
let fingerprintVisitorId: string | null = null;

async function initFingerprint() {
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    fingerprintVisitorId = result.visitorId;
    console.log('Fingerprint visitor ID:', fingerprintVisitorId);
    return fingerprintVisitorId;
  } catch (error) {
    console.error('FingerprintJS error:', error);
    return null;
  }
}

// 2. Stripe Elements Integration
// Initialize Stripe (add your publishable key)
const stripePublishableKey = (import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key';
const stripe = Stripe(stripePublishableKey);
let elements: any;
let paymentElement: any;

function initializeStripeElements() {
  elements = stripe.elements();
  paymentElement = elements.create('payment', {
    layout: 'tabs'
  });

  paymentElement.mount('#payment-element');
}

// 3. Trial Signup Flow
async function handleTrialSignup(email: string, selectedJurisdiction: string) {
  try {
    // Ensure fingerprint is loaded
    if (!fingerprintVisitorId) {
      await initFingerprint();
    }

    // Create SetupIntent for $0 card verification
    const setupIntentResponse = await fetch('/api/create-setup-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const { client_secret } = await setupIntentResponse.json();

    // Confirm the SetupIntent
    const { setupIntent, error } = await stripe.confirmSetup({
      elements,
      clientSecret: client_secret,
      redirect: 'if_required'
    });

    if (error) {
      throw error;
    }

    // Call trial signup endpoint
    const signupResponse = await fetch('/functions/v1/trial-management/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAuthToken}` // Get from Supabase auth
      },
      body: JSON.stringify({
        email,
        fingerprint_visitor_id: fingerprintVisitorId,
        payment_method_id: setupIntent.payment_method,
        selected_jurisdiction: selectedJurisdiction,
        ip_address: await getUserIP()
      })
    });

    const result = await signupResponse.json();

    if (!signupResponse.ok) {
      if (result.contact_sales) {
        showSalesContactPrompt(result.reason);
        return;
      }
      throw new Error(result.error);
    }

    // Success - redirect to dashboard
    window.location.href = '/app';

  } catch (error) {
    console.error('Signup error:', error);
    showError('Signup failed: ' + (error instanceof Error ? error.message : String(error)));
  }
}

// Get user's IP address (approximate)
async function getUserIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}

// 4. Trial Status Checking
async function checkTrialStatus() {
  try {
    const response = await fetch('/functions/v1/trial-management/status', {
      headers: {
        'Authorization': `Bearer ${supabaseAuthToken}`
      }
    });

    const status = await response.json();
    return status;
  } catch (error) {
    console.error('Status check error:', error);
    return null;
  }
}

// 5. UI Helpers
function showSalesContactPrompt(reason: string) {
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-2">Trial Access Restricted</h3>
        <p class="text-gray-600 mb-4">${reason}</p>
        <p class="text-sm text-gray-500 mb-4">
          For enterprise access or to discuss your specific needs, please contact our sales team.
        </p>
        <div class="flex gap-2">
          <button onclick="this.closest('.fixed').remove()"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
            Close
          </button>
          <a href="mailto:sales@thynkflow.io"
             class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center">
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function showTrialTeaser() {
  const teasers = document.querySelectorAll('[data-trial-teaser]');
  teasers.forEach(el => {
    el.innerHTML = `
      <div class="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
        <div class="flex items-center gap-2 mb-2">
          <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
          <span class="font-medium text-blue-800">Live regulatory updates activate with a paid subscription.</span>
        </div>
        <p class="text-sm text-blue-600">
          THYNKFLOW trial access is intentionally limited to protect proprietary compliance methodologies.
        </p>
      </div>
    `;
  });
}

// 6. Data Filtering for Trial Users
function applyTrialRestrictions(data: any, trialStatus: any) {
  if (!trialStatus.is_trial_active || trialStatus.is_authorized_domain) {
    return data; // Full access
  }

  return data.filter((item: any) => {
    // Filter by selected jurisdiction
    if (item.jurisdiction_code !== trialStatus.selected_jurisdiction) {
      return false;
    }

    // Filter by delayed data (24+ hours old)
    const itemDate = new Date(item.updated_at);
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24);

    return itemDate <= cutoffDate;
  }).map((item: any) => ({
    ...item,
    full_text: undefined, // Hide full text
    change_log: undefined, // Hide change log
    summary: item.summary || 'Summary not available in trial mode'
  }));
}

// 7. Export Blocking
function checkExportPermission(trialStatus: any) {
  if (trialStatus.is_trial_active && !trialStatus.is_authorized_domain) {
    showError('Export functionality requires a paid subscription.');
    return false;
  }
  return true;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await initFingerprint();

  // Initialize Stripe if on signup page
  if (document.getElementById('payment-element')) {
    initializeStripeElements();
  }

  // Check trial status and apply restrictions
  const trialStatus = await checkTrialStatus();
  if (trialStatus?.is_trial_active) {
    showTrialTeaser();
  }
});

// Export functions for global use
window.ThynkTrial = {
  handleTrialSignup,
  checkTrialStatus,
  applyTrialRestrictions,
  checkExportPermission
};

// ES6 exports for module imports
export { initFingerprint, handleTrialSignup, checkTrialStatus, applyTrialRestrictions, checkExportPermission };