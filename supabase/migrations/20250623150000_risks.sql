-- Risks module v1 — organization-scoped operational risks linked to clients

CREATE TABLE IF NOT EXISTS public.risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'archived')),
  owner_user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  due_date DATE,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risks_organization_id ON public.risks (organization_id);
CREATE INDEX IF NOT EXISTS idx_risks_client_id ON public.risks (client_id);
CREATE INDEX IF NOT EXISTS idx_risks_owner_user_id ON public.risks (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_risks_org_status ON public.risks (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_risks_org_severity ON public.risks (organization_id, severity);

CREATE TRIGGER risks_set_updated_at
  BEFORE UPDATE ON public.risks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;

-- All org members can read risks in their organization.
CREATE POLICY risks_select_own_org
  ON public.risks
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

-- Owner/Admin can create risks for the organization.
CREATE POLICY risks_insert_owner_admin
  ON public.risks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

-- Staff can create risks only when assigned to themselves.
CREATE POLICY risks_insert_staff
  ON public.risks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() = 'staff'
    AND owner_user_id = public.current_app_user_id()
  );

-- Owner/Admin can update any risk in the organization.
CREATE POLICY risks_update_owner_admin
  ON public.risks
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

-- Staff can update only risks assigned to them.
CREATE POLICY risks_update_staff
  ON public.risks
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() = 'staff'
    AND owner_user_id = public.current_app_user_id()
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() = 'staff'
    AND owner_user_id = public.current_app_user_id()
  );

GRANT SELECT, INSERT, UPDATE ON public.risks TO authenticated;
GRANT ALL ON TABLE public.risks TO service_role;
