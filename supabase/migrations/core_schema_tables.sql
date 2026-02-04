-- Core schema tables for poller functionality
-- This migration creates the essential tables that the cannabis-hemp-poller expects

BEGIN;

-- Create jurisdiction table (with all required columns)
CREATE TABLE IF NOT EXISTS public.jurisdiction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT,
  type TEXT NOT NULL DEFAULT 'state',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add slug column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jurisdiction' AND column_name = 'slug') THEN
    ALTER TABLE public.jurisdiction ADD COLUMN slug TEXT;
    -- Create unique index for slug
    CREATE UNIQUE INDEX IF NOT EXISTS idx_jurisdiction_slug ON public.jurisdiction(slug);
  END IF;
END $$;

-- Create instrument table (regulations/documents)
CREATE TABLE IF NOT EXISTS public.instrument (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID REFERENCES public.jurisdiction(id),
  external_id TEXT,
  title TEXT NOT NULL,
  document_type TEXT,
  effective_date DATE,
  published_at TIMESTAMPTZ,
  url TEXT,
  content TEXT,
  source TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to instrument table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instrument' AND column_name = 'published_at') THEN
    ALTER TABLE public.instrument ADD COLUMN published_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instrument' AND column_name = 'source') THEN
    ALTER TABLE public.instrument ADD COLUMN source TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instrument' AND column_name = 'status') THEN
    ALTER TABLE public.instrument ADD COLUMN status TEXT DEFAULT 'Active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instrument' AND column_name = 'impact') THEN
    ALTER TABLE public.instrument ADD COLUMN impact TEXT DEFAULT 'Medium';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instrument' AND column_name = 'effective_at') THEN
    ALTER TABLE public.instrument ADD COLUMN effective_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create instrument table (regulations/documents)
CREATE TABLE IF NOT EXISTS public.instrument (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID REFERENCES public.jurisdiction(id),
  external_id TEXT,
  title TEXT NOT NULL,
  document_type TEXT,
  effective_date DATE,
  published_at TIMESTAMPTZ,
  url TEXT,
  content TEXT,
  source TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create search_queries table
CREATE TABLE IF NOT EXISTS public.search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL UNIQUE,
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create api_metrics table
CREATE TABLE IF NOT EXISTS public.api_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  user_agent TEXT,
  ip_address INET,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job_execution_log table
CREATE TABLE IF NOT EXISTS public.job_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create public_comments table for user comment tracking
CREATE TABLE IF NOT EXISTS public.public_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  regulation_id TEXT,
  regulation_title TEXT NOT NULL,
  regulation_type TEXT,
  jurisdiction_code TEXT,
  agency_name TEXT NOT NULL,
  agency_contact_email TEXT,
  comment_period_end DATE,
  comment_title TEXT NOT NULL,
  comment_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  submission_date TIMESTAMPTZ,
  submission_method TEXT,
  confirmation_number TEXT,
  regulation_url TEXT,
  submission_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jurisdiction_code ON public.jurisdiction(code);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_slug ON public.jurisdiction(slug);
CREATE INDEX IF NOT EXISTS idx_instrument_jurisdiction ON public.instrument(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_instrument_external_id ON public.instrument(external_id);
CREATE INDEX IF NOT EXISTS idx_instrument_published_at ON public.instrument(published_at);
CREATE INDEX IF NOT EXISTS idx_instrument_effective_at ON public.instrument(effective_at);
CREATE INDEX IF NOT EXISTS idx_instrument_status ON public.instrument(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_log_session ON public.ingestion_log(session_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_log_status ON public.ingestion_log(status);
CREATE INDEX IF NOT EXISTS idx_search_queries_query ON public.search_queries(query);
CREATE INDEX IF NOT EXISTS idx_search_queries_count ON public.search_queries(search_count);
CREATE INDEX IF NOT EXISTS idx_api_metrics_timestamp ON public.api_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint ON public.api_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_job_execution_log_status ON public.job_execution_log(status);
CREATE INDEX IF NOT EXISTS idx_job_execution_log_completed_at ON public.job_execution_log(completed_at);

-- Enable RLS
ALTER TABLE public.jurisdiction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instrument ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_execution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing service role and anon for testing) - only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jurisdiction' AND policyname = 'Service role can do anything on jurisdiction') THEN
    EXECUTE 'CREATE POLICY "Service role can do anything on jurisdiction" ON public.jurisdiction FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jurisdiction' AND policyname = 'Anon can read jurisdiction') THEN
    EXECUTE 'CREATE POLICY "Anon can read jurisdiction" ON public.jurisdiction FOR SELECT TO anon USING (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'instrument' AND policyname = 'Service role can do anything on instrument') THEN
    EXECUTE 'CREATE POLICY "Service role can do anything on instrument" ON public.instrument FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'instrument' AND policyname = 'Anon can read instrument') THEN
    EXECUTE 'CREATE POLICY "Anon can read instrument" ON public.instrument FOR SELECT TO anon USING (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ingestion_log' AND policyname = 'Service role can do anything on ingestion_log') THEN
    EXECUTE 'CREATE POLICY "Service role can do anything on ingestion_log" ON public.ingestion_log FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ingestion_log' AND policyname = 'Anon can read ingestion_log') THEN
    EXECUTE 'CREATE POLICY "Anon can read ingestion_log" ON public.ingestion_log FOR SELECT TO anon USING (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_queries' AND policyname = 'Service role can do anything on search_queries') THEN
    EXECUTE 'CREATE POLICY "Service role can do anything on search_queries" ON public.search_queries FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_queries' AND policyname = 'Anon can read search_queries') THEN
    EXECUTE 'CREATE POLICY "Anon can read search_queries" ON public.search_queries FOR SELECT TO anon USING (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_metrics' AND policyname = 'Service role can do anything on api_metrics') THEN
    EXECUTE 'CREATE POLICY "Service role can do anything on api_metrics" ON public.api_metrics FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_metrics' AND policyname = 'Anon can read api_metrics') THEN
    EXECUTE 'CREATE POLICY "Anon can read api_metrics" ON public.api_metrics FOR SELECT TO anon USING (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_execution_log' AND policyname = 'Service role can do anything on job_execution_log') THEN
    EXECUTE 'CREATE POLICY "Service role can do anything on job_execution_log" ON public.job_execution_log FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_execution_log' AND policyname = 'Anon can read job_execution_log') THEN
    EXECUTE 'CREATE POLICY "Anon can read job_execution_log" ON public.job_execution_log FOR SELECT TO anon USING (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'public_comments' AND policyname = 'Users can manage their own comments') THEN
    EXECUTE 'CREATE POLICY "Users can manage their own comments" ON public.public_comments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'public_comments' AND policyname = 'Service role can do anything on public_comments') THEN
    EXECUTE 'CREATE POLICY "Service role can do anything on public_comments" ON public.public_comments FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Insert some basic jurisdiction data (update existing or insert new)
INSERT INTO public.jurisdiction (code, name, slug, type) VALUES
  ('FEDERAL', 'Federal Government', 'federal', 'federal'),
  ('AL', 'Alabama', 'alabama', 'state'),
  ('AK', 'Alaska', 'alaska', 'state'),
  ('AZ', 'Arizona', 'arizona', 'state'),
  ('AR', 'Arkansas', 'arkansas', 'state'),
  ('CA', 'California', 'california', 'state'),
  ('CO', 'Colorado', 'colorado', 'state'),
  ('CT', 'Connecticut', 'connecticut', 'state'),
  ('DE', 'Delaware', 'delaware', 'state'),
  ('FL', 'Florida', 'florida', 'state'),
  ('GA', 'Georgia', 'georgia', 'state'),
  ('HI', 'Hawaii', 'hawaii', 'state'),
  ('ID', 'Idaho', 'idaho', 'state'),
  ('IL', 'Illinois', 'illinois', 'state'),
  ('IN', 'Indiana', 'indiana', 'state'),
  ('IA', 'Iowa', 'iowa', 'state'),
  ('KS', 'Kansas', 'kansas', 'state'),
  ('KY', 'Kentucky', 'kentucky', 'state'),
  ('LA', 'Louisiana', 'louisiana', 'state'),
  ('ME', 'Maine', 'maine', 'state'),
  ('MD', 'Maryland', 'maryland', 'state'),
  ('MA', 'Massachusetts', 'massachusetts', 'state'),
  ('MI', 'Michigan', 'michigan', 'state'),
  ('MN', 'Minnesota', 'minnesota', 'state'),
  ('MS', 'Mississippi', 'mississippi', 'state'),
  ('MO', 'Missouri', 'missouri', 'state'),
  ('MT', 'Montana', 'montana', 'state'),
  ('NE', 'Nebraska', 'nebraska', 'state'),
  ('NV', 'Nevada', 'nevada', 'state'),
  ('NH', 'New Hampshire', 'new-hampshire', 'state'),
  ('NJ', 'New Jersey', 'new-jersey', 'state'),
  ('NM', 'New Mexico', 'new-mexico', 'state'),
  ('NY', 'New York', 'new-york', 'state'),
  ('NC', 'North Carolina', 'north-carolina', 'state'),
  ('ND', 'North Dakota', 'north-dakota', 'state'),
  ('OH', 'Ohio', 'ohio', 'state'),
  ('OK', 'Oklahoma', 'oklahoma', 'state'),
  ('OR', 'Oregon', 'oregon', 'state'),
  ('PA', 'Pennsylvania', 'pennsylvania', 'state'),
  ('RI', 'Rhode Island', 'rhode-island', 'state'),
  ('SC', 'South Carolina', 'south-carolina', 'state'),
  ('SD', 'South Dakota', 'south-dakota', 'state'),
  ('TN', 'Tennessee', 'tennessee', 'state'),
  ('TX', 'Texas', 'texas', 'state'),
  ('UT', 'Utah', 'utah', 'state'),
  ('VT', 'Vermont', 'vermont', 'state'),
  ('VA', 'Virginia', 'virginia', 'state'),
  ('WA', 'Washington', 'washington', 'state'),
  ('WV', 'West Virginia', 'west-virginia', 'state'),
  ('WI', 'Wisconsin', 'wisconsin', 'state'),
  ('WY', 'Wyoming', 'wyoming', 'state')
ON CONFLICT (code) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  type = EXCLUDED.type;

-- Create the data_population_progress table for tracking poller progress
CREATE TABLE IF NOT EXISTS public.data_population_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  records_fetched INTEGER DEFAULT 0,
  total_estimated INTEGER,
  current_page INTEGER DEFAULT 0,
  total_pages INTEGER,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on data_population_progress
ALTER TABLE public.data_population_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data_population_progress
CREATE POLICY "Allow public read access on data_population_progress" 
  ON public.data_population_progress 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow anon insert on data_population_progress" 
  ON public.data_population_progress 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

CREATE POLICY "Allow anon update on data_population_progress" 
  ON public.data_population_progress 
  FOR UPDATE 
  TO anon 
  USING (true);

-- Create unique index for data_population_progress
CREATE UNIQUE INDEX IF NOT EXISTS uq_data_population_progress_session_source ON public.data_population_progress (session_id, source_name);

-- Create updated_at trigger for data_population_progress
CREATE OR REPLACE FUNCTION update_data_population_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER data_population_progress_updated_at
  BEFORE UPDATE ON public.data_population_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_data_population_progress_updated_at();

-- Create the providers table for compliance service providers
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  categories TEXT[] DEFAULT '{}',
  tier TEXT CHECK (tier IN ('VIP', 'Vetted', 'Standard')) DEFAULT 'Standard',
  website_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  services TEXT[],
  states_covered TEXT[],
  pricing_tier TEXT CHECK (pricing_tier IN ('Budget', 'Mid-Range', 'Premium', 'Enterprise')),
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on providers
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for providers
CREATE POLICY "Allow public read access on providers" 
  ON public.providers 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated insert on providers" 
  ON public.providers 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on providers" 
  ON public.providers 
  FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated delete on providers" 
  ON public.providers 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Create indexes for providers
CREATE INDEX IF NOT EXISTS idx_providers_tier ON public.providers(tier);
CREATE INDEX IF NOT EXISTS idx_providers_categories ON public.providers USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_providers_states ON public.providers USING GIN(states_covered);
CREATE INDEX IF NOT EXISTS idx_providers_featured ON public.providers(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_providers_verified ON public.providers(verified) WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_providers_rating ON public.providers(rating DESC);

-- Create updated_at trigger for providers
CREATE OR REPLACE FUNCTION update_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER providers_updated_at
  BEFORE UPDATE ON public.providers
  FOR EACH ROW
  EXECUTE FUNCTION update_providers_updated_at();

-- Seed providers table with sample data
INSERT INTO public.providers (name, description, categories, tier, services, states_covered, pricing_tier, rating, review_count, verified, featured)
VALUES
  ('ComplianceForge', 'Industry-leading compliance automation platform', ARRAY['Compliance Software', 'Regulatory Tracking'], 'VIP', ARRAY['Compliance Automation', 'Regulatory Alerts'], ARRAY['CA', 'CO', 'WA'], 'Enterprise', 4.9, 287, true, true),
  ('GreenTrack Solutions', 'Comprehensive seed-to-sale tracking', ARRAY['Seed-to-Sale', 'Inventory Management'], 'VIP', ARRAY['Seed-to-Sale Tracking', 'METRC Integration'], ARRAY['CA', 'CO', 'WA'], 'Premium', 4.8, 412, true, true),
  ('CannaSafe Labs', 'ISO-certified testing laboratory', ARRAY['Testing', 'Laboratory Services'], 'VIP', ARRAY['Potency Testing', 'Contaminant Screening'], ARRAY['CA', 'CO', 'WA'], 'Premium', 4.9, 523, true, true)
ON CONFLICT (name) DO NOTHING;

COMMIT;