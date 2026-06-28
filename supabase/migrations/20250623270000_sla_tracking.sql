-- SLA Tracking v1 — response-time policies for incidents and risks

CREATE TABLE IF NOT EXISTS public.sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  incident_hours INTEGER CHECK (incident_hours IS NULL OR incident_hours > 0),
  risk_hours INTEGER CHECK (risk_hours IS NULL OR risk_hours > 0),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sla_policies_organization_id
  ON public.sla_policies (organization_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sla_policies_one_default_per_org
  ON public.sla_policies (organization_id)
  WHERE is_default = TRUE;

DROP TRIGGER IF EXISTS sla_policies_set_updated_at ON public.sla_policies;

CREATE TRIGGER sla_policies_set_updated_at
  BEFORE UPDATE ON public.sla_policies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sla_policies_select_own_org ON public.sla_policies;

CREATE POLICY sla_policies_select_own_org
  ON public.sla_policies
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS sla_policies_insert_owner_admin ON public.sla_policies;

CREATE POLICY sla_policies_insert_owner_admin
  ON public.sla_policies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS sla_policies_update_owner_admin ON public.sla_policies;

CREATE POLICY sla_policies_update_owner_admin
  ON public.sla_policies
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS sla_policies_delete_owner_admin ON public.sla_policies;

CREATE POLICY sla_policies_delete_owner_admin
  ON public.sla_policies
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sla_policies TO authenticated;
GRANT ALL ON TABLE public.sla_policies TO service_role;

-- Per-client SLA policy assignment
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS sla_policy_id UUID REFERENCES public.sla_policies (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clients_sla_policy_id
  ON public.clients (sla_policy_id);

-- Notification types for SLA alerts
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (
    type IN (
      'report_generated',
      'report_published',
      'report_sent',
      'critical_risk',
      'critical_incident',
      'portal_user_created',
      'report_email_failed',
      'sla_warning',
      'sla_breached'
    )
  );
