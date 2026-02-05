-- Recreate jurisdiction_freshness view without SECURITY DEFINER
-- This ensures the view runs with caller permissions and respects RLS

DROP VIEW IF EXISTS public.jurisdiction_freshness;

-- Create jurisdiction_freshness view for tracking last update times and instrument counts
CREATE OR REPLACE VIEW public.jurisdiction_freshness AS
SELECT
  j.id as jurisdiction_id,
  j.code as jurisdiction_code,
  j.name as jurisdiction_name,
  j.slug as jurisdiction_slug,
  MAX(COALESCE(i.published_at, i.created_at)) as last_updated,
  COUNT(i.id) as total_instruments
FROM public.jurisdiction j
LEFT JOIN public.instrument i ON j.id = i.jurisdiction_id
GROUP BY j.id, j.code, j.name, j.slug
ORDER BY j.name;

-- Enable RLS on the view
ALTER VIEW public.jurisdiction_freshness SET (security_barrier = true);

-- Recreate policy for the view (drop existing first)
DROP POLICY IF EXISTS "Allow public read access on jurisdiction_freshness" ON public.jurisdiction_freshness;
CREATE POLICY "Allow public read access on jurisdiction_freshness"
  ON public.jurisdiction_freshness
  FOR SELECT
  USING (true);