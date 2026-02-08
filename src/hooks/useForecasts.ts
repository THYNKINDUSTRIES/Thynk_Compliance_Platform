import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://kruwbjaszdwzttblxqwr.supabase.co';

export interface Forecast {
  id: string;
  jurisdiction_id: string | null;
  jurisdiction?: { name: string; slug: string } | null;
  product: string;
  prediction_type: string;
  direction: string;
  confidence: number;
  predicted_quarter: string | null;
  predicted_date: string | null;
  title: string;
  summary: string;
  rationale: string | null;
  risk_level: string;
  recommended_actions: string[];
  supporting_signals: string[];
  model_version: string;
  data_points_analyzed: number;
  expires_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ScenarioResult {
  likelihood: number;
  timeline: string;
  analysis: string;
  cascading_effects: string[];
  recommended_actions: string[];
  risk_factors: string[];
  confidence_reasoning: string;
}

export interface ForecastFilters {
  product?: string;
  jurisdiction_id?: string;
  risk_level?: string;
}

async function invokeForecastFunction(body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/regulatory-forecast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || 'Forecast request failed');
  }
  return res.json();
}

/**
 * Hook to fetch cached forecasts from the database.
 * Falls back to the Edge Function if the table doesn't exist yet.
 */
export function useForecasts(filters: ForecastFilters = {}) {
  return useQuery<Forecast[]>({
    queryKey: ['forecasts', filters],
    queryFn: async () => {
      // Try direct DB query first (faster, no cold-start)
      let query = supabase
        .from('regulatory_forecasts')
        .select('*, jurisdiction:jurisdiction_id(name, slug)')
        .eq('status', 'active')
        .order('confidence', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters.product) query = query.eq('product', filters.product);
      if (filters.jurisdiction_id) query = query.eq('jurisdiction_id', filters.jurisdiction_id);
      if (filters.risk_level) query = query.eq('risk_level', filters.risk_level);

      const { data, error } = await query;

      if (error) {
        // Table might not exist — try Edge Function
        if (error.code === 'PGRST205' || error.message.includes('schema cache')) {
          const result = await invokeForecastFunction({ action: 'get', ...filters });
          return result.forecasts || [];
        }
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to generate fresh forecasts via the Edge Function.
 */
export function useGenerateForecasts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return invokeForecastFunction({ action: 'generate' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forecasts'] });
    },
  });
}

/**
 * Hook to run a what-if scenario.
 */
export function useRunScenario() {
  const [result, setResult] = useState<ScenarioResult | null>(null);

  const runScenario = useCallback(async (params: {
    product: string;
    jurisdiction?: string;
    assumption: string;
    timeframe?: string;
  }) => {
    const data = await invokeForecastFunction({ action: 'scenario', ...params });
    const scenarioResult = data.scenario as ScenarioResult;
    setResult(scenarioResult);
    return scenarioResult;
  }, []);

  const clearScenario = useCallback(() => setResult(null), []);

  return { result, runScenario, clearScenario };
}
