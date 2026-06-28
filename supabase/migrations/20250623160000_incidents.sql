-- Incidents module v1 — organization-scoped operational incidents linked to clients and optionally risks

CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients (id) ON DELETE CASCADE,
  risk_id UUID REFERENCES public.risks (id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'archived')),
  assigned_user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at TIMESTAMPTZ,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_organization_id ON public.incidents (organization_id);
CREATE INDEX IF NOT EXISTS idx_incidents_client_id ON public.incidents (client_id);
CREATE INDEX IF NOT EXISTS idx_incidents_risk_id ON public.incidents (risk_id);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_user_id ON public.incidents (assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_org_status ON public.incidents (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_org_severity ON public.incidents (organization_id, severity);

CREATE TRIGGER incidents_set_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY incidents_select_own_org
  ON public.incidents
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

CREATE POLICY incidents_insert_owner_admin
  ON public.incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY incidents_insert_staff
  ON public.incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() = 'staff'
    AND assigned_user_id = public.current_app_user_id()
  );

CREATE POLICY incidents_update_owner_admin
  ON public.incidents
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

CREATE POLICY incidents_update_staff
  ON public.incidents
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() = 'staff'
    AND assigned_user_id = public.current_app_user_id()
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() = 'staff'
    AND assigned_user_id = public.current_app_user_id()
  );

GRANT SELECT, INSERT, UPDATE ON public.incidents TO authenticated;
GRANT ALL ON TABLE public.incidents TO service_role;
