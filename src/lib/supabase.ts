import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Configuration
 * 
 * The anon key is a public key — safe to embed in client-side code.
 * RLS policies on the database protect data, not this key.
 */

// Supabase project configuration (public values, safe to hardcode)
const supabaseUrl = 'https://kruwbjaszdwzttblxqwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtydXdiamFzemR3enR0Ymx4cXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjcwOTIsImV4cCI6MjA3Njc0MzA5Mn0.BOmy4m7qoukUVyG1j8kDyyuA__mp9BeYdiDXL_OW-ZQ';

const supabaseKey = supabaseAnonKey;

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
