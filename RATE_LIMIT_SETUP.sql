-- Create rate_limits table to track signup and verification attempts
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  email TEXT,
  action_type TEXT NOT NULL, -- 'signup', 'email_verification', 'password_reset'
  attempt_count INTEGER DEFAULT 1,
  first_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON rate_limits(ip_address, action_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_email ON rate_limits(email, action_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy to allow the service role to manage rate limits
CREATE POLICY "Service role can manage rate limits"
  ON rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to clean up expired rate limit records
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE reset_at < NOW() - INTERVAL '24 hours';
END;
$$;

COMMENT ON TABLE rate_limits IS 'Tracks rate limiting for signup, email verification, and other sensitive actions';
