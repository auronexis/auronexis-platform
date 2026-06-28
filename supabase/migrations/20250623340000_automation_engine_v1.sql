-- Enterprise Workflow Engine v1 — execution metadata and extended statuses

ALTER TABLE public.automation_executions
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS event_id TEXT,
  ADD COLUMN IF NOT EXISTS trigger_hash TEXT;

ALTER TABLE public.automation_execution_steps
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'success' CHECK (
    status IN ('pending', 'running', 'success', 'failed', 'skipped')
  );

ALTER TABLE public.automation_executions
  DROP CONSTRAINT IF EXISTS automation_executions_status_check;

ALTER TABLE public.automation_executions
  ADD CONSTRAINT automation_executions_status_check
  CHECK (
    status IN (
      'pending',
      'running',
      'completed',
      'failed',
      'partial',
      'cancelled',
      'simulation',
      'skipped'
    )
  );

CREATE INDEX IF NOT EXISTS idx_automation_executions_trigger_hash
  ON public.automation_executions (organization_id, workflow_id, trigger_hash)
  WHERE trigger_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_automation_executions_org_started_today
  ON public.automation_executions (organization_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_workflows_org_active_trigger
  ON public.automation_workflows (organization_id, status)
  WHERE status = 'active';
