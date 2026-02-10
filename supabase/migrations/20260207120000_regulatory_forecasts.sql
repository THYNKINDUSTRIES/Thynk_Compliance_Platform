-- Regulatory Forecasts table for AI-powered predictive analysis
CREATE TABLE IF NOT EXISTS regulatory_forecasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jurisdiction_id UUID REFERENCES jurisdiction(id),
  product TEXT NOT NULL,                     -- cannabis, hemp, kratom, kava, nicotine, psychedelics
  prediction_type TEXT NOT NULL DEFAULT 'regulatory_change', -- regulatory_change, ban_risk, legalization, rescheduling, enforcement
  direction TEXT NOT NULL DEFAULT 'restrictive',  -- restrictive, permissive, neutral, deregulation
  confidence NUMERIC(5,2) NOT NULL DEFAULT 50.0, -- 0-100 confidence score
  predicted_quarter TEXT,                    -- e.g. "Q3 2026"
  predicted_date DATE,                       -- optional specific predicted date
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  rationale TEXT,                             -- AI reasoning for the prediction
  risk_level TEXT DEFAULT 'medium',          -- low, medium, high, critical
  recommended_actions JSONB DEFAULT '[]'::jsonb,  -- array of suggested hedges/actions
  supporting_signals JSONB DEFAULT '[]'::jsonb,   -- array of evidence (regulation IDs, bill numbers)
  model_version TEXT DEFAULT 'gpt-4o-mini-v1',
  data_points_analyzed INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,                    -- when this prediction should be re-evaluated
  status TEXT DEFAULT 'active',              -- active, expired, confirmed, invalidated
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_forecasts_product ON regulatory_forecasts(product);
CREATE INDEX IF NOT EXISTS idx_forecasts_jurisdiction ON regulatory_forecasts(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_confidence ON regulatory_forecasts(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_forecasts_status ON regulatory_forecasts(status);
CREATE INDEX IF NOT EXISTS idx_forecasts_risk ON regulatory_forecasts(risk_level);
CREATE INDEX IF NOT EXISTS idx_forecasts_created ON regulatory_forecasts(created_at DESC);

-- RLS
ALTER TABLE regulatory_forecasts ENABLE ROW LEVEL SECURITY;

-- Everyone can read forecasts
CREATE POLICY "Anyone can read forecasts"
  ON regulatory_forecasts FOR SELECT
  USING (true);

-- Only service role can insert/update (Edge Functions)
CREATE POLICY "Service role can manage forecasts"
  ON regulatory_forecasts FOR ALL
  USING (auth.role() = 'service_role');

-- What-if scenarios table for user-generated scenarios
CREATE TABLE IF NOT EXISTS forecast_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { product, jurisdiction, timeframe, assumption }
  result JSONB,                               -- cached AI response
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE forecast_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scenarios"
  ON forecast_scenarios FOR ALL
  USING (auth.uid() = user_id);
