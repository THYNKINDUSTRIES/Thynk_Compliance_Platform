/**
 * Shared CORS utility for ALL Supabase Edge Functions.
 *
 * ONE place to maintain allowed origins. Every function imports from here.
 *
 * Origin matching rules:
 *   1. Exact match for production domains (thynkflow.io, www.thynkflow.io)
 *   2. Pattern match for ANY *.vercel.app preview URL
 *   3. Localhost dev servers (3000, 5173, 5174)
 *   4. Additional origins from ALLOWED_CORS_ORIGINS env var (comma-separated)
 */

const EXACT_ORIGINS = [
  'https://thynkflow.io',
  'https://www.thynkflow.io',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
];

// @ts-ignore - Deno global
const envOrigins = (Deno.env.get('ALLOWED_CORS_ORIGINS') || '')
  .split(',')
  .map((o: string) => o.trim())
  .filter(Boolean);

const ALL_EXACT = new Set([...EXACT_ORIGINS, ...envOrigins]);

/** Returns true if the origin should be allowed through CORS */
function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  // Exact match (production, localhost, env overrides)
  if (ALL_EXACT.has(origin)) return true;
  // Any Vercel preview/production deployment
  if (/^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) return true;
  return false;
}

const DEFAULT_ORIGIN = EXACT_ORIGINS[0]; // thynkflow.io

const BASE_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

/**
 * Build CORS headers reflecting the request's Origin when allowed.
 * Call with the incoming Request to get dynamic origin matching,
 * or call with no args for a safe default (thynkflow.io).
 */
export function buildCors(req?: Request): Record<string, string> {
  const origin = req?.headers?.get('origin') || '';
  return {
    ...BASE_HEADERS,
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : DEFAULT_ORIGIN,
  };
}

/** Default headers (for module-level exports that can't pass a Request yet) */
export const corsHeaders = buildCors();
