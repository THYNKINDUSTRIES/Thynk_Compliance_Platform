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
      const [summaryRes, functionsRes, volumeRes] = await Promise.all([
        supabase.rpc('get_api_metrics_summary', { time_range_hours: timeRangeHours }),
        supabase.rpc('get_metrics_by_function', { time_range_hours: timeRangeHours }),
        supabase.rpc('get_hourly_request_volume', { hours_back: timeRangeHours })
      ]);

      if (summaryRes.data?.[0]) setSummary(summaryRes.data[0]);
      if (functionsRes.data) setFunctionMetrics(functionsRes.data);
      if (volumeRes.data) setHourlyVolume(volumeRes.data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [timeRangeHours]);

  return { summary, functionMetrics, hourlyVolume, loading, refetch: fetchMetrics };
}
