import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Configuration
 * 
 * Uses environment variables for configuration:
 * - VITE_SUPABASE_URL: Your Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Public anon key for client-side operations
 * - VITE_SUPABASE_SERVICE_ROLE_KEY: Service role key (ONLY for preview/admin mode)
 * 
 * SECURITY NOTE: 
 * - In production, always use the anon key for client-side code
 * - Service role key bypasses RLS and should only be used in trusted environments
 */

// Supabase project configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kruwbjaszdwzttblxqwr.supabase.co';

// Determine which key to use based on environment
const isPreviewMode = import.meta.env.MODE === 'preview' || import.meta.env.VITE_PREVIEW_MODE === 'true';
const useServiceRole = isPreviewMode && import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabaseKey = useServiceRole
  ? import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  : (import.meta.env.VITE_SUPABASE_ANON_KEY || '');

// Log configuration (without exposing keys)
if (import.meta.env.DEV) {
  console.log('[Supabase] Initializing client:', {
    url: supabaseUrl,
    mode: import.meta.env.MODE,
    isPreviewMode,
    usingServiceRole: useServiceRole ? 'YES (service_role)' : 'NO (anon)',
  });
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  // Global configuration
  global: {
    headers: {
      'x-client-info': 'hemp-compliance-tracker',
    },
  },
});

// Export client and configuration helpers
export { supabase };

// Helper to check if using service role (for conditional logic)
export const isUsingServiceRole = (): boolean => Boolean(useServiceRole);

// Helper to check connection status
export const checkConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('instrument').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};

// Export configuration for debugging
export const getSupabaseConfig = () => ({
  url: supabaseUrl,
  mode: import.meta.env.MODE,
  isPreviewMode,
  usingServiceRole: Boolean(useServiceRole),
});
