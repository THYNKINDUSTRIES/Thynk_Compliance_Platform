-- Fix: Add authenticated role SELECT policies to core data tables
-- Previously only 'anon' had SELECT, so logged-in users saw zero data

CREATE POLICY "Authenticated can read instrument" ON public.instrument
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read jurisdiction" ON public.jurisdiction
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read ingestion_log" ON public.ingestion_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read api_metrics" ON public.api_metrics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read job_execution_log" ON public.job_execution_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read search_queries" ON public.search_queries
  FOR SELECT TO authenticated USING (true);

-- Also add missing user_profiles write policies
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
