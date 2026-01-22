-- Create user_alerts table for storing user notification preferences
-- This table stores custom alert configurations for users

CREATE TABLE IF NOT EXISTS user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  frequency VARCHAR(50) DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly'
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_is_active ON user_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_user_alerts_user_active ON user_alerts(user_id, is_active);

-- Enable Row Level Security
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and manage their own alerts
CREATE POLICY "Users can view their own alerts"
  ON user_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts"
  ON user_alerts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON user_alerts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON user_alerts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_alerts_updated_at
  BEFORE UPDATE ON user_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_alerts_updated_at();

-- Add comment for documentation
COMMENT ON TABLE user_alerts IS 'Stores user custom alert configurations for regulatory notifications';
COMMENT ON COLUMN user_alerts.criteria IS 'JSON object containing filter criteria: jurisdictions, product_categories, keywords, etc.';
COMMENT ON COLUMN user_alerts.frequency IS 'How often to send alerts: immediate, daily, or weekly';
