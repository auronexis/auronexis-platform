-- Phase 4 Sprint 4 — Integration delivery logs and runtime tracking

CREATE TABLE IF NOT EXISTS public.integration_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES public.automation_workflows (id) ON DELETE SET NULL,
  workflow_execution_id UUID REFERENCES public.automation_executions (id) ON DELETE SET NULL,
  action_id TEXT,
  provider_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN (
      'queued',
      'sending',
      'delivered',
      'failed',
      'rate_limited',
      'retrying',
      'dead_letter'
    )
  ),
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  max_retries INTEGER NOT NULL DEFAULT 4 CHECK (max_retries >= 0),
  last_retry_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  failure_reason TEXT,
  response_code INTEGER,
  latency_ms INTEGER CHECK (latency_ms IS NULL OR latency_ms >= 0),
  delivery_id TEXT,
  provider_message_id TEXT,
  request_method TEXT,
  request_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_delivery_logs_org_created
  ON public.integration_delivery_logs (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_delivery_logs_org_status
  ON public.integration_delivery_logs (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_integration_delivery_logs_org_provider
  ON public.integration_delivery_logs (organization_id, provider_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_delivery_logs_next_retry
  ON public.integration_delivery_logs (organization_id, next_retry_at)
  WHERE next_retry_at IS NOT NULL AND status = 'retrying';

DROP TRIGGER IF EXISTS integration_delivery_logs_set_updated_at ON public.integration_delivery_logs;

CREATE TRIGGER integration_delivery_logs_set_updated_at
  BEFORE UPDATE ON public.integration_delivery_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.integration_delivery_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS integration_delivery_logs_select_owner_admin ON public.integration_delivery_logs;
CREATE POLICY integration_delivery_logs_select_owner_admin
  ON public.integration_delivery_logs FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS integration_delivery_logs_insert_staff_plus ON public.integration_delivery_logs;
CREATE POLICY integration_delivery_logs_insert_staff_plus
  ON public.integration_delivery_logs FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin', 'staff')
  );

DROP POLICY IF EXISTS integration_delivery_logs_update_staff_plus ON public.integration_delivery_logs;
CREATE POLICY integration_delivery_logs_update_staff_plus
  ON public.integration_delivery_logs FOR UPDATE TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin', 'staff')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin', 'staff')
  );

GRANT SELECT, INSERT, UPDATE ON public.integration_delivery_logs TO authenticated;
GRANT ALL ON TABLE public.integration_delivery_logs TO service_role;
