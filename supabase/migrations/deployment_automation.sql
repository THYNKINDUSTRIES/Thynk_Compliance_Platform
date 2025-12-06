-- Edge function versions table
CREATE TABLE IF NOT EXISTS edge_function_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  version INTEGER NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  deployed_by UUID REFERENCES auth.users(id),
  deployed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  UNIQUE(function_name, version)
);

-- Deployment logs table
CREATE TABLE IF NOT EXISTS deployment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_version_id UUID REFERENCES edge_function_versions(id),
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Function health checks
CREATE TABLE IF NOT EXISTS function_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  status TEXT NOT NULL,
  response_time_ms INTEGER,
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT
);

-- Enable RLS
ALTER TABLE edge_function_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE function_health_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view function versions"
  ON edge_function_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert function versions"
  ON edge_function_versions FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@admin.%' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update function versions"
  ON edge_function_versions FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@admin.%' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view deployment logs"
  ON deployment_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert deployment logs"
  ON deployment_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view function health"
  ON function_health_checks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert health checks"
  ON function_health_checks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_function_versions_name ON edge_function_versions(function_name);
CREATE INDEX idx_function_versions_active ON edge_function_versions(is_active);
CREATE INDEX idx_deployment_logs_version ON deployment_logs(function_version_id);
CREATE INDEX idx_health_checks_name ON function_health_checks(function_name);
