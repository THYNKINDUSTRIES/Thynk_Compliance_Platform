# Deployment Automation System

## Overview
A complete deployment automation system for Supabase Edge Functions with version control, rollback capabilities, and monitoring - **NO external secrets required**.

## Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
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
  status TEXT DEFAULT 'pending', -- pending, deployed, failed, rolled_back
  UNIQUE(function_name, version)
);

-- Deployment logs table
CREATE TABLE IF NOT EXISTS deployment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_version_id UUID REFERENCES edge_function_versions(id),
  action TEXT NOT NULL, -- deploy, rollback, test
  status TEXT NOT NULL, -- success, failed, in_progress
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Function health checks
CREATE TABLE IF NOT EXISTS function_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  status TEXT NOT NULL, -- healthy, unhealthy, unknown
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
```

## How It Works

### 1. Version Management
- Store edge function code versions in the database
- Track who deployed what and when
- Maintain deployment history

### 2. Manual Deployment Process
Since Supabase Edge Functions require CLI or Dashboard deployment:
1. User uploads/pastes function code in the UI
2. System saves as new version in database
3. System generates deployment instructions
4. User copies code and deploys via Supabase Dashboard
5. User confirms deployment in UI
6. System marks version as active

### 3. Rollback System
- View all previous versions
- Select a version to rollback to
- Get deployment instructions for that version
- Confirm rollback in UI

### 4. Health Monitoring
- Test edge functions via HTTP requests
- Track response times
- Log errors and failures
- Alert on unhealthy functions

## UI Features

1. **Function List** - View all edge functions and their status
2. **Version History** - See all versions of each function
3. **Code Editor** - Edit and save new versions
4. **Deployment Instructions** - Copy-paste ready code
5. **Rollback Interface** - One-click rollback to previous versions
6. **Health Dashboard** - Monitor function performance
7. **Deployment Logs** - Audit trail of all changes

## Usage

1. Navigate to `/deployment` page
2. Select a function or create new one
3. Edit code in the built-in editor
4. Save as new version
5. Follow deployment instructions
6. Confirm deployment
7. Monitor health status

## Benefits

- No external dependencies or secrets needed
- Full version control and audit trail
- Easy rollback to any previous version
- Real-time health monitoring
- User-friendly interface
- Works with existing Supabase auth
