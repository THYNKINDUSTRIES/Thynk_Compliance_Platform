-- Create URL Validation Log Table
CREATE TABLE IF NOT EXISTS url_validation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id UUID REFERENCES instrument(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status_code INTEGER,
  is_valid BOOLEAN NOT NULL,
  error_message TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_url_validation_log_instrument ON url_validation_log(instrument_id);
CREATE INDEX IF NOT EXISTS idx_url_validation_log_checked_at ON url_validation_log(checked_at);
CREATE INDEX IF NOT EXISTS idx_url_validation_log_is_valid ON url_validation_log(is_valid);

-- Enable RLS
ALTER TABLE url_validation_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read url validation logs" ON url_validation_log;
DROP POLICY IF EXISTS "Allow service role to insert url validation logs" ON url_validation_log;

-- Create RLS Policies
CREATE POLICY "Allow authenticated users to read url validation logs"
  ON url_validation_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role to insert url validation logs"
  ON url_validation_log FOR INSERT
  TO service_role
  WITH CHECK (true);
