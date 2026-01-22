import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Admin Client
 * 
 * IMPORTANT: This client uses the service_role key and bypasses RLS.
 * Only use this for:
 * - Server-side operations (Edge Functions, API routes)
 * - Admin operations that require elevated privileges
 * - Background jobs and scheduled tasks
 * 
 * NEVER expose this client to the browser/frontend!
 */

const supabaseUrl = process.env.SUPABASE_URL || 'https://kruwbjaszdwzttblxqwr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Validate service role key is available
if (!supabaseServiceKey && typeof window === 'undefined') {
  console.warn(
    '[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY not found. ' +
    'Admin operations will fail. Set this in your environment variables.'
  );
}

/**
 * Create admin client with service_role key
 * This bypasses Row Level Security (RLS)
 */
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    // Disable realtime for admin client
    realtime: {
      params: {
        eventsPerSecond: 0,
      },
    },
  }
);

/**
 * Helper to check if admin client is properly configured
 */
export function isAdminClientConfigured(): boolean {
  return Boolean(supabaseServiceKey);
}

/**
 * Safe admin operation wrapper
 * Ensures service_role key is available before executing
 */
export async function withAdminClient<T>(
  operation: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  if (!isAdminClientConfigured()) {
    throw new Error(
      'Admin client not configured. Set SUPABASE_SERVICE_ROLE_KEY environment variable.'
    );
  }
  return operation(supabaseAdmin);
}

/**
 * Polling-specific admin operations
 * Uses service_role to bypass RLS for write operations
 */
export const pollingAdmin = {
  /**
   * Insert new regulations from polling
   */
  async insertRegulations(regulations: Array<{
    title: string;
    jurisdiction: string;
    agency: string;
    status: string;
    source_url: string;
    content_hash?: string;
    raw_content?: string;
  }>) {
    return withAdminClient(async (client) => {
      const { data, error } = await client
        .from('regulations')
        .upsert(regulations, {
          onConflict: 'source_url',
          ignoreDuplicates: false,
        })
        .select();

      if (error) throw error;
      return data;
    });
  },

  /**
   * Update regulation status
   */
  async updateRegulationStatus(
    regulationId: string,
    status: string,
    metadata?: Record<string, unknown>
  ) {
    return withAdminClient(async (client) => {
      const { data, error } = await client
        .from('regulations')
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...(metadata && { metadata }),
        })
        .eq('id', regulationId)
        .select()
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    });
  },


  /**
   * Log polling activity
   */
  async logPollingActivity(activity: {
    source: string;
    status: 'success' | 'error' | 'partial';
    records_processed: number;
    error_message?: string;
    duration_ms?: number;
  }) {
    return withAdminClient(async (client) => {
      const { error } = await client
        .from('polling_logs')
        .insert({
          ...activity,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('[pollingAdmin] Failed to log activity:', error);
      }
    });
  },

  /**
   * Update URL validation results
   */
  async updateURLValidation(
    regulationId: string,
    validationResult: {
      is_valid: boolean;
      http_status?: number;
      error_message?: string;
      last_checked: string;
    }
  ) {
    return withAdminClient(async (client) => {
      const { error } = await client
        .from('url_validation_log')
        .insert({
          regulation_id: regulationId,
          ...validationResult,
        });

      if (error) throw error;
    });
  },
};

export default supabaseAdmin;
