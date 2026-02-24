import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface MetricsSummary {
  total_requests: number;
  success_rate: number;
  avg_response_time: number;
  error_count: number;
  slow_query_count: number;
}

interface FunctionMetric {
  function_name: string;
  request_count: number;
  avg_response_time: number;
  error_rate: number;
}

interface HourlyVolume {
  hour: string;
  request_count: number;
  success_count: number;
  error_count: number;
}

export function useAPIMetrics(timeRangeHours = 24) {
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [functionMetrics, setFunctionMetrics] = useState<FunctionMetric[]>([]);
  const [hourlyVolume, setHourlyVolume] = useState<HourlyVolume[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      // Try RPC functions first; gracefully fall back to raw table queries
      const [summaryRes, functionsRes, volumeRes] = await Promise.allSettled([
        supabase.rpc('get_api_metrics_summary', { time_range_hours: timeRangeHours }),
        supabase.rpc('get_metrics_by_function', { time_range_hours: timeRangeHours }),
        supabase.rpc('get_hourly_request_volume', { hours_back: timeRangeHours })
      ]);

      // Safely extract data — if RPC doesn't exist (404) we get null
      const summaryData = summaryRes.status === 'fulfilled' && !summaryRes.value.error ? summaryRes.value.data : null;
      const functionsData = functionsRes.status === 'fulfilled' && !functionsRes.value.error ? functionsRes.value.data : null;
      const volumeData = volumeRes.status === 'fulfilled' && !volumeRes.value.error ? volumeRes.value.data : null;

      if (summaryData?.[0]) {
        setSummary(summaryData[0]);
      } else {
        // Fallback: compute basic summary from api_metrics table directly
        const cutoff = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000).toISOString();
        const { data: rawMetrics } = await supabase
          .from('api_metrics')
          .select('status_code, response_time_ms')
          .gte('timestamp', cutoff);

        if (rawMetrics && rawMetrics.length > 0) {
          const total = rawMetrics.length;
          const errors = rawMetrics.filter(r => r.status_code >= 400).length;
          const avgTime = Math.round(rawMetrics.reduce((s, r) => s + (r.response_time_ms || 0), 0) / total);
          const slow = rawMetrics.filter(r => (r.response_time_ms || 0) > 2000).length;
          setSummary({
            total_requests: total,
            success_rate: Math.round(((total - errors) / total) * 100),
            avg_response_time: avgTime,
            error_count: errors,
            slow_query_count: slow
          });
        }
      }

      if (functionsData) setFunctionMetrics(functionsData);
      if (volumeData) setHourlyVolume(volumeData);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every 60s (was 30s)
    return () => clearInterval(interval);
  }, [timeRangeHours]);

  return { summary, functionMetrics, hourlyVolume, loading, refetch: fetchMetrics };
}
