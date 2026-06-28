-- Enterprise Workflow Persistence Foundation — Phase 4 Sprint 0

CREATE TABLE IF NOT EXISTS public.automation_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'active', 'paused', 'disabled', 'archived')
  ),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  workflow_json JSONB NOT NULL,
  created_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_workflows_organization_id
  ON public.automation_workflows (organization_id);

CREATE INDEX IF NOT EXISTS idx_automation_workflows_org_status
  ON public.automation_workflows (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_automation_workflows_org_updated
  ON public.automation_workflows (organization_id, updated_at DESC);

DROP TRIGGER IF EXISTS automation_workflows_set_updated_at ON public.automation_workflows;

CREATE TRIGGER automation_workflows_set_updated_at
  BEFORE UPDATE ON public.automation_workflows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.automation_workflow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.automation_workflows (id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version >= 1),
  workflow_json JSONB NOT NULL,
  created_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workflow_id, version)
);

CREATE INDEX IF NOT EXISTS idx_automation_workflow_versions_workflow_id
  ON public.automation_workflow_versions (workflow_id, version DESC);

CREATE TABLE IF NOT EXISTS public.automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.automation_workflows (id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  trigger TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('running', 'completed', 'failed', 'cancelled', 'simulation', 'partial')
  ),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  execution_log JSONB NOT NULL DEFAULT '{}'::JSONB,
  simulated BOOLEAN NOT NULL DEFAULT FALSE,
  initiated_by TEXT NOT NULL DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_automation_executions_organization_id
  ON public.automation_executions (organization_id);

CREATE INDEX IF NOT EXISTS idx_automation_executions_workflow_id
  ON public.automation_executions (workflow_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_executions_org_started
  ON public.automation_executions (organization_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.automation_execution_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES public.automation_executions (id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL CHECK (order_index >= 0),
  action TEXT NOT NULL,
  result JSONB NOT NULL DEFAULT '{}'::JSONB,
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0)
);

CREATE INDEX IF NOT EXISTS idx_automation_execution_steps_execution_id
  ON public.automation_execution_steps (execution_id, order_index);

CREATE TABLE IF NOT EXISTS public.automation_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  secret TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_webhooks_organization_id
  ON public.automation_webhooks (organization_id);

CREATE TABLE IF NOT EXISTS public.automation_org_state (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations (id) ON DELETE CASCADE,
  local_storage_migrated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS automation_org_state_set_updated_at ON public.automation_org_state;

CREATE TRIGGER automation_org_state_set_updated_at
  BEFORE UPDATE ON public.automation_org_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: automation_workflows
ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS automation_workflows_select_own_org ON public.automation_workflows;
CREATE POLICY automation_workflows_select_own_org
  ON public.automation_workflows FOR SELECT TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS automation_workflows_insert_staff_plus ON public.automation_workflows;
CREATE POLICY automation_workflows_insert_staff_plus
  ON public.automation_workflows FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin', 'staff')
  );

DROP POLICY IF EXISTS automation_workflows_update_staff_plus ON public.automation_workflows;
CREATE POLICY automation_workflows_update_staff_plus
  ON public.automation_workflows FOR UPDATE TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin', 'staff')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin', 'staff')
  );

DROP POLICY IF EXISTS automation_workflows_delete_owner_admin ON public.automation_workflows;
CREATE POLICY automation_workflows_delete_owner_admin
  ON public.automation_workflows FOR DELETE TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

-- RLS: automation_workflow_versions (via workflow org)
ALTER TABLE public.automation_workflow_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS automation_workflow_versions_select_own_org ON public.automation_workflow_versions;
CREATE POLICY automation_workflow_versions_select_own_org
  ON public.automation_workflow_versions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_workflows w
      WHERE w.id = workflow_id
        AND w.organization_id = public.current_organization_id()
    )
  );

DROP POLICY IF EXISTS automation_workflow_versions_insert_staff_plus ON public.automation_workflow_versions;
CREATE POLICY automation_workflow_versions_insert_staff_plus
  ON public.automation_workflow_versions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.automation_workflows w
      WHERE w.id = workflow_id
        AND w.organization_id = public.current_organization_id()
        AND public.current_user_role() IN ('owner', 'admin', 'staff')
    )
  );

-- RLS: automation_executions
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS automation_executions_select_own_org ON public.automation_executions;
CREATE POLICY automation_executions_select_own_org
  ON public.automation_executions FOR SELECT TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS automation_executions_insert_staff_plus ON public.automation_executions;
CREATE POLICY automation_executions_insert_staff_plus
  ON public.automation_executions FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin', 'staff')
  );

DROP POLICY IF EXISTS automation_executions_update_staff_plus ON public.automation_executions;
CREATE POLICY automation_executions_update_staff_plus
  ON public.automation_executions FOR UPDATE TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin', 'staff')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin', 'staff')
  );

-- RLS: automation_execution_steps
ALTER TABLE public.automation_execution_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS automation_execution_steps_select_own_org ON public.automation_execution_steps;
CREATE POLICY automation_execution_steps_select_own_org
  ON public.automation_execution_steps FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_executions e
      WHERE e.id = execution_id
        AND e.organization_id = public.current_organization_id()
    )
  );

DROP POLICY IF EXISTS automation_execution_steps_insert_staff_plus ON public.automation_execution_steps;
CREATE POLICY automation_execution_steps_insert_staff_plus
  ON public.automation_execution_steps FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.automation_executions e
      WHERE e.id = execution_id
        AND e.organization_id = public.current_organization_id()
        AND public.current_user_role() IN ('owner', 'admin', 'staff')
    )
  );

-- RLS: automation_webhooks
ALTER TABLE public.automation_webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS automation_webhooks_select_own_org ON public.automation_webhooks;
CREATE POLICY automation_webhooks_select_own_org
  ON public.automation_webhooks FOR SELECT TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS automation_webhooks_insert_owner_admin ON public.automation_webhooks;
CREATE POLICY automation_webhooks_insert_owner_admin
  ON public.automation_webhooks FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS automation_webhooks_update_owner_admin ON public.automation_webhooks;
CREATE POLICY automation_webhooks_update_owner_admin
  ON public.automation_webhooks FOR UPDATE TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS automation_webhooks_delete_owner_admin ON public.automation_webhooks;
CREATE POLICY automation_webhooks_delete_owner_admin
  ON public.automation_webhooks FOR DELETE TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

-- RLS: automation_org_state
ALTER TABLE public.automation_org_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS automation_org_state_select_own_org ON public.automation_org_state;
CREATE POLICY automation_org_state_select_own_org
  ON public.automation_org_state FOR SELECT TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS automation_org_state_insert_owner_admin ON public.automation_org_state;
CREATE POLICY automation_org_state_insert_owner_admin
  ON public.automation_org_state FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin', 'staff')
  );

DROP POLICY IF EXISTS automation_org_state_update_owner_admin ON public.automation_org_state;
CREATE POLICY automation_org_state_update_owner_admin
  ON public.automation_org_state FOR UPDATE TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin', 'staff')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin', 'staff')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_workflows TO authenticated;
GRANT SELECT, INSERT ON public.automation_workflow_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.automation_executions TO authenticated;
GRANT SELECT, INSERT ON public.automation_execution_steps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_webhooks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.automation_org_state TO authenticated;

GRANT ALL ON TABLE public.automation_workflows TO service_role;
GRANT ALL ON TABLE public.automation_workflow_versions TO service_role;
GRANT ALL ON TABLE public.automation_executions TO service_role;
GRANT ALL ON TABLE public.automation_execution_steps TO service_role;
GRANT ALL ON TABLE public.automation_webhooks TO service_role;
GRANT ALL ON TABLE public.automation_org_state TO service_role;
