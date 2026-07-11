-- Phase 24 — Customer success playbook instances and tasks (additive)

CREATE TABLE IF NOT EXISTS public.customer_success_playbook_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients (id) ON DELETE CASCADE,
  playbook_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_to_user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  started_by_user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  trigger_code TEXT,
  trigger_snapshot JSONB,
  outcome TEXT,
  recovery_score_before INTEGER,
  recovery_score_after INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customer_success_playbook_instances_status_check
    CHECK (status IN ('suggested', 'active', 'paused', 'completed', 'cancelled')),
  CONSTRAINT customer_success_playbook_instances_priority_check
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

CREATE TABLE IF NOT EXISTS public.customer_success_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients (id) ON DELETE CASCADE,
  playbook_instance_id UUID NOT NULL REFERENCES public.customer_success_playbook_instances (id) ON DELETE CASCADE,
  task_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  required BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_to_user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by_user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customer_success_tasks_status_check
    CHECK (status IN ('open', 'in_progress', 'completed', 'skipped', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_cs_playbook_instances_org
  ON public.customer_success_playbook_instances (organization_id);

CREATE INDEX IF NOT EXISTS idx_cs_playbook_instances_client
  ON public.customer_success_playbook_instances (organization_id, client_id);

CREATE INDEX IF NOT EXISTS idx_cs_playbook_instances_status
  ON public.customer_success_playbook_instances (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_cs_playbook_instances_assigned
  ON public.customer_success_playbook_instances (assigned_to_user_id)
  WHERE assigned_to_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cs_playbook_instances_due
  ON public.customer_success_playbook_instances (organization_id, due_at)
  WHERE due_at IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cs_playbook_active_unique
  ON public.customer_success_playbook_instances (organization_id, client_id, playbook_key)
  WHERE status IN ('suggested', 'active', 'paused');

CREATE INDEX IF NOT EXISTS idx_cs_tasks_org
  ON public.customer_success_tasks (organization_id);

CREATE INDEX IF NOT EXISTS idx_cs_tasks_client
  ON public.customer_success_tasks (organization_id, client_id);

CREATE INDEX IF NOT EXISTS idx_cs_tasks_playbook
  ON public.customer_success_tasks (playbook_instance_id);

CREATE INDEX IF NOT EXISTS idx_cs_tasks_status
  ON public.customer_success_tasks (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_cs_tasks_assigned
  ON public.customer_success_tasks (assigned_to_user_id)
  WHERE assigned_to_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cs_tasks_due
  ON public.customer_success_tasks (organization_id, due_at)
  WHERE due_at IS NOT NULL;

CREATE TRIGGER customer_success_playbook_instances_set_updated_at
  BEFORE UPDATE ON public.customer_success_playbook_instances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER customer_success_tasks_set_updated_at
  BEFORE UPDATE ON public.customer_success_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.customer_success_playbook_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_success_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_playbook_instances_select_member ON public.customer_success_playbook_instances;
CREATE POLICY cs_playbook_instances_select_member
  ON public.customer_success_playbook_instances
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS cs_playbook_instances_insert_manager ON public.customer_success_playbook_instances;
CREATE POLICY cs_playbook_instances_insert_manager
  ON public.customer_success_playbook_instances
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.auth_user_id = auth.uid()
        AND users.organization_id = customer_success_playbook_instances.organization_id
        AND users.is_disabled = FALSE
        AND users.role IN ('owner', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS cs_playbook_instances_update_manager ON public.customer_success_playbook_instances;
CREATE POLICY cs_playbook_instances_update_manager
  ON public.customer_success_playbook_instances
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.auth_user_id = auth.uid()
        AND users.organization_id = customer_success_playbook_instances.organization_id
        AND users.is_disabled = FALSE
        AND (
          users.role IN ('owner', 'admin', 'manager')
          OR customer_success_playbook_instances.assigned_to_user_id = users.id
        )
    )
  )
  WITH CHECK (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS cs_tasks_select_member ON public.customer_success_tasks;
CREATE POLICY cs_tasks_select_member
  ON public.customer_success_tasks
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS cs_tasks_insert_manager ON public.customer_success_tasks;
CREATE POLICY cs_tasks_insert_manager
  ON public.customer_success_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.auth_user_id = auth.uid()
        AND users.organization_id = customer_success_tasks.organization_id
        AND users.is_disabled = FALSE
        AND users.role IN ('owner', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS cs_tasks_update_assignee ON public.customer_success_tasks;
CREATE POLICY cs_tasks_update_assignee
  ON public.customer_success_tasks
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.auth_user_id = auth.uid()
        AND users.organization_id = customer_success_tasks.organization_id
        AND users.is_disabled = FALSE
        AND (
          users.role IN ('owner', 'admin', 'manager')
          OR customer_success_tasks.assigned_to_user_id = users.id
        )
    )
  )
  WITH CHECK (organization_id = public.current_organization_id());

GRANT SELECT, INSERT, UPDATE ON public.customer_success_playbook_instances TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.customer_success_tasks TO authenticated;
GRANT ALL ON TABLE public.customer_success_playbook_instances TO service_role;
GRANT ALL ON TABLE public.customer_success_tasks TO service_role;
