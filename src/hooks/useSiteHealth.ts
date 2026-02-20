import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface HealthCheck {
  id: string;
  check_type: 'page' | 'edge_function' | 'database' | 'ssl';
  check_name: string;
  status: 'pass' | 'warn' | 'fail';
  response_time_ms: number;
  details: Record<string, unknown>;
  checked_at: string;
  created_at: string;
}

export interface Remediation {
  id: string;
  issue: string;
  action: string;
  status: 'triggered' | 'success' | 'failed' | 'skipped';
  details: Record<string, unknown>;
  triggered_at: string;
  created_at: string;
}

export interface HealthSummary {
  overall: 'healthy' | 'warning' | 'degraded' | 'unknown';
  score: number;
  totalChecks: number;
  passed: number;
  warnings: number;
  failures: number;
  healed: number;
  lastChecked: string | null;
}

export interface HealthChecksByType {
  page: HealthCheck[];
  edge_function: HealthCheck[];
  database: HealthCheck[];
  ssl: HealthCheck[];
}

export function useSiteHealth() {
  const [latestChecks, setLatestChecks] = useState<HealthCheck[]>([]);
  const [history, setHistory] = useState<HealthCheck[]>([]);
  const [remediations, setRemediations] = useState<Remediation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<HealthSummary>({
    overall: 'unknown',
    score: 0,
    totalChecks: 0,
    passed: 0,
    warnings: 0,
    failures: 0,
    healed: 0,
    lastChecked: null,
  });

  const fetchLatest = useCallback(async () => {
    try {
      // Get the most recent check run timestamp
      const { data: recentCheck, error: rcErr } = await supabase
        .from('site_health_checks')
        .select('checked_at')
        .order('checked_at', { ascending: false })
        .limit(1)
        .single();

      if (rcErr || !recentCheck) {
        setLatestChecks([]);
        return;
      }

      // Get all checks within 10 seconds of the latest (same batch)
      const batchStart = new Date(new Date(recentCheck.checked_at).getTime() - 10000).toISOString();
      const { data, error: fetchErr } = await supabase
        .from('site_health_checks')
        .select('*')
        .gte('checked_at', batchStart)
        .lte('checked_at', recentCheck.checked_at)
        .order('check_type', { ascending: true });

      if (fetchErr) throw fetchErr;

      const checks = (data || []) as HealthCheck[];
      setLatestChecks(checks);

      // Compute summary
      const total = checks.length;
      const passed = checks.filter(c => c.status === 'pass').length;
      const warnings = checks.filter(c => c.status === 'warn').length;
      const failures = checks.filter(c => c.status === 'fail').length;
      const healed = checks.filter(c => c.details?.healed).length;
      const overall = failures > 0 ? 'degraded' : warnings > 0 ? 'warning' : total > 0 ? 'healthy' : 'unknown';

      setSummary({
        overall,
        score: total > 0 ? Math.round((passed / total) * 100) : 0,
        totalChecks: total,
        passed,
        warnings,
        failures,
        healed,
        lastChecked: recentCheck.checked_at,
      });
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const fetchHistory = useCallback(async (hours = 24) => {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      const { data, error: fetchErr } = await supabase
        .from('site_health_checks')
        .select('*')
        .gte('checked_at', since)
        .order('checked_at', { ascending: false })
        .limit(500);

      if (fetchErr) throw fetchErr;
      setHistory((data || []) as HealthCheck[]);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const fetchRemediations = useCallback(async (hours = 72) => {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      const { data, error: fetchErr } = await supabase
        .from('site_health_remediations')
        .select('*')
        .gte('triggered_at', since)
        .order('triggered_at', { ascending: false })
        .limit(100);

      if (fetchErr) {
        // Table may not exist yet — don't error out
        console.warn('Remediations fetch:', fetchErr.message);
        return;
      }
      setRemediations((data || []) as Remediation[]);
    } catch (err: any) {
      console.warn('Remediations fetch error:', err.message);
    }
  }, []);

  const triggerCheck = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/site-monitor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
          },
        }
      );
      if (!res.ok) throw new Error(`Site monitor returned ${res.status}`);
      const result = await res.json();
      // Refresh data after trigger
      await fetchLatest();
      await fetchHistory();
      await fetchRemediations();
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchLatest, fetchHistory, fetchRemediations]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchLatest();
      await fetchHistory();
      await fetchRemediations();
      setLoading(false);
    };
    init();
  }, [fetchLatest, fetchHistory, fetchRemediations]);

  // Group latest checks by type
  const checksByType: HealthChecksByType = {
    page: latestChecks.filter(c => c.check_type === 'page'),
    edge_function: latestChecks.filter(c => c.check_type === 'edge_function'),
    database: latestChecks.filter(c => c.check_type === 'database'),
    ssl: latestChecks.filter(c => c.check_type === 'ssl'),
  };

  return {
    latestChecks,
    checksByType,
    history,
    remediations,
    summary,
    loading,
    error,
    triggerCheck,
    refresh: async () => {
      await fetchLatest();
      await fetchHistory();
      await fetchRemediations();
    },
  };
}
