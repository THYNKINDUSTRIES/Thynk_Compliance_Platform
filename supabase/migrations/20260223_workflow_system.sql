-- ============================================================================
-- Workflow System — Complete database schema
-- Creates all tables needed for AI-powered compliance workflows
-- ============================================================================

-- ─── Core: workflow_instances ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_instances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id   UUID,                                        -- optional template ref
  instrument_id UUID REFERENCES instrument(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'completed', 'cancelled')),
  ai_analysis   JSONB,                                       -- full AI analysis payload
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Core: workflow_tasks ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_tasks (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  description          TEXT,
  task_type            TEXT NOT NULL DEFAULT 'review'
                         CHECK (task_type IN ('review', 'approval', 'implementation', 'documentation')),
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  priority             TEXT NOT NULL DEFAULT 'medium'
                         CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  due_date             TIMESTAMPTZ,
  completed_at         TIMESTAMPTZ,
  order_index          INTEGER NOT NULL DEFAULT 0,
  depends_on           UUID REFERENCES workflow_tasks(id),
  entity_id            UUID,                                 -- generic FK for related entities
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Supporting: task_assignments ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES workflow_tasks(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  assigned_by UUID REFERENCES auth.users(id),
  role        TEXT NOT NULL DEFAULT 'assignee'
                CHECK (role IN ('assignee', 'reviewer', 'approver')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Supporting: task_comments ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES workflow_tasks(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id),
  comment    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Supporting: workflow_approvals ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_approvals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES workflow_tasks(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES auth.users(id),
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  comments    TEXT,
  approved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Supporting: workflow_attachments ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_attachments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id              UUID REFERENCES workflow_tasks(id) ON DELETE CASCADE,
  workflow_instance_id UUID REFERENCES workflow_instances(id) ON DELETE CASCADE,
  filename             TEXT NOT NULL,
  file_url             TEXT NOT NULL,
  file_size            INTEGER,
  mime_type            TEXT,
  uploaded_by          UUID REFERENCES auth.users(id),
  uploaded_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_workflow_instances_created_by
  ON workflow_instances(created_by);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_instrument
  ON workflow_instances(instrument_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status
  ON workflow_instances(status);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_instance
  ON workflow_tasks(workflow_instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status
  ON workflow_tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task
  ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task
  ON task_comments(task_id);

-- ─── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE workflow_instances    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_approvals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_attachments  ENABLE ROW LEVEL SECURITY;

-- workflow_instances: users see own, admins see all
CREATE POLICY "Users view own workflows"
  ON workflow_instances FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Users create own workflows"
  ON workflow_instances FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users update own workflows"
  ON workflow_instances FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );

-- workflow_tasks: access through parent workflow
CREATE POLICY "Users view workflow tasks"
  ON workflow_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflow_instances wi
      WHERE wi.id = workflow_tasks.workflow_instance_id
        AND (
          wi.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
          )
        )
    )
  );

CREATE POLICY "Users manage workflow tasks"
  ON workflow_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workflow_instances wi
      WHERE wi.id = workflow_tasks.workflow_instance_id
        AND (
          wi.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
          )
        )
    )
  );

-- task_assignments: access through parent task → workflow
CREATE POLICY "Users view task assignments"
  ON task_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflow_tasks wt
      JOIN workflow_instances wi ON wi.id = wt.workflow_instance_id
      WHERE wt.id = task_assignments.task_id
        AND (wi.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
        ))
    )
  );

CREATE POLICY "Users manage task assignments"
  ON task_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workflow_tasks wt
      JOIN workflow_instances wi ON wi.id = wt.workflow_instance_id
      WHERE wt.id = task_assignments.task_id
        AND (wi.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
        ))
    )
  );

-- task_comments: access through parent task → workflow
CREATE POLICY "Users view task comments"
  ON task_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflow_tasks wt
      JOIN workflow_instances wi ON wi.id = wt.workflow_instance_id
      WHERE wt.id = task_comments.task_id
        AND (wi.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
        ))
    )
  );

CREATE POLICY "Users create task comments"
  ON task_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- workflow_approvals: access through parent task → workflow
CREATE POLICY "Users view approvals"
  ON workflow_approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflow_tasks wt
      JOIN workflow_instances wi ON wi.id = wt.workflow_instance_id
      WHERE wt.id = workflow_approvals.task_id
        AND (wi.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
        ))
    )
  );

CREATE POLICY "Users manage approvals"
  ON workflow_approvals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workflow_tasks wt
      JOIN workflow_instances wi ON wi.id = wt.workflow_instance_id
      WHERE wt.id = workflow_approvals.task_id
        AND (wi.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
        ))
    )
  );

-- workflow_attachments: access through parent workflow or task
CREATE POLICY "Users view attachments"
  ON workflow_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflow_instances wi
      WHERE wi.id = workflow_attachments.workflow_instance_id
        AND (wi.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
        ))
    )
    OR EXISTS (
      SELECT 1 FROM workflow_tasks wt
      JOIN workflow_instances wi ON wi.id = wt.workflow_instance_id
      WHERE wt.id = workflow_attachments.task_id
        AND (wi.created_by = auth.uid() OR EXISTS (
          SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
        ))
    )
  );

CREATE POLICY "Users manage attachments"
  ON workflow_attachments FOR ALL
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── Service role bypass for edge functions ──────────────────────────────────
-- The workflow-agent edge function uses service_role key which bypasses RLS,
-- so no additional policies needed for system inserts.

-- ─── Updated_at trigger ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_workflow_instances') THEN
    CREATE TRIGGER set_updated_at_workflow_instances
      BEFORE UPDATE ON workflow_instances
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_workflow_tasks') THEN
    CREATE TRIGGER set_updated_at_workflow_tasks
      BEFORE UPDATE ON workflow_tasks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;
