/**
 * Regulation Type Definition
 * 
 * NOTE: All mock data has been removed. This file now only contains
 * the type definition for regulations. All data is fetched from
 * the live Supabase database.
 * 
 * For the Regulation interface used throughout the app, see:
 * src/hooks/useRegulations.ts
 */

export interface Regulation {
  id: string;
  title: string;
  summary: string;
  jurisdiction: string;
  authority: string;
  status: string;
  products: string[];
  stages: string[];
  instrumentType: string;
  publishedAt: string;
  effectiveAt?: string;
  citation?: string;
  url: string;
  impact: 'high' | 'medium' | 'low';
}

// DEPRECATED: Mock data has been removed
// All data is now fetched from Supabase
// See src/hooks/useRegulations.ts for data fetching
export const MOCK_REGULATIONS: Regulation[] = [];
