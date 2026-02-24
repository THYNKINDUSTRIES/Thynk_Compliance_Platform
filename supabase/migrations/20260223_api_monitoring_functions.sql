-- Migration: Create api_alerts table and API metrics RPC functions
-- These are required by the API Monitoring page (src/pages/APIMonitoring.tsx)

-- ═══════════════════════════════════════════════════════════════════
-- 1. api_alerts table
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.api_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL DEFAULT 'error',        -- 'error', 'slow', 'down', 'rate_limit'
  severity TEXT NOT NULL DEFAULT 'warning',         -- 'info', 'warning', 'critical'
  endpoint TEXT,
  function_name TEXT,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_alerts_resolved ON public.api_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_api_alerts_created_at ON public.api_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_alerts_severity ON public.api_alerts(severity);

ALTER TABLE public.api_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read api_alerts"
  ON public.api_alerts FOR SELECT TO anon USING (true);

CREATE POLICY "Authenticated can read api_alerts"
  ON public.api_alerts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role full access on api_alerts"
  ON public.api_alerts FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════════════
-- 2. get_api_metrics_summary(time_range_hours)
-- Returns a single row with aggregated metrics for the time window.
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_api_metrics_summary(time_range_hours INTEGER DEFAULT 24)
RETURNS TABLE (
  total_requests BIGINT,
  success_rate NUMERIC,
  avg_response_time NUMERIC,
  error_count BIGINT,
  slow_query_count BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    COUNT(*)::BIGINT AS total_requests,
    CASE WHEN COUNT(*) > 0
      THEN ROUND(COUNT(*) FILTER (WHERE status_code < 400)::NUMERIC / COUNT(*)::NUMERIC * 100, 1)
      ELSE 100
    END AS success_rate,
    COALESCE(ROUND(AVG(response_time_ms)::NUMERIC, 0), 0) AS avg_response_time,
    COUNT(*) FILTER (WHERE status_code >= 400)::BIGINT AS error_count,
    COUNT(*) FILTER (WHERE response_time_ms > 2000)::BIGINT AS slow_query_count
  FROM public.api_metrics
  WHERE timestamp >= NOW() - (time_range_hours || ' hours')::INTERVAL;
$$;


-- ═══════════════════════════════════════════════════════════════════
-- 3. get_metrics_by_function(time_range_hours)
-- Returns per-endpoint breakdown for the bar chart.
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_metrics_by_function(time_range_hours INTEGER DEFAULT 24)
RETURNS TABLE (
  function_name TEXT,
  request_count BIGINT,
  avg_response_time NUMERIC,
  error_rate NUMERIC
)
LANGUAGE sql STABLE
AS $$
  SELECT
    endpoint AS function_name,
    COUNT(*)::BIGINT AS request_count,
    ROUND(AVG(response_time_ms)::NUMERIC, 0) AS avg_response_time,
    CASE WHEN COUNT(*) > 0
      THEN ROUND(COUNT(*) FILTER (WHERE status_code >= 400)::NUMERIC / COUNT(*)::NUMERIC * 100, 1)
      ELSE 0
    END AS error_rate
  FROM public.api_metrics
  WHERE timestamp >= NOW() - (time_range_hours || ' hours')::INTERVAL
  GROUP BY endpoint
  ORDER BY request_count DESC;
$$;


-- ═══════════════════════════════════════════════════════════════════
-- 4. get_hourly_request_volume(hours_back)
-- Returns hourly buckets for the line chart.
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_hourly_request_volume(hours_back INTEGER DEFAULT 24)
RETURNS TABLE (
  hour TIMESTAMPTZ,
  request_count BIGINT,
  success_count BIGINT,
  error_count BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    date_trunc('hour', timestamp) AS hour,
    COUNT(*)::BIGINT AS request_count,
    COUNT(*) FILTER (WHERE status_code < 400)::BIGINT AS success_count,
    COUNT(*) FILTER (WHERE status_code >= 400)::BIGINT AS error_count
  FROM public.api_metrics
  WHERE timestamp >= NOW() - (hours_back || ' hours')::INTERVAL
  GROUP BY date_trunc('hour', timestamp)
  ORDER BY hour DESC;
$$;
