-- Reports module v1 — organization-scoped client reports

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'sent', 'archived')),
  executive_summary TEXT,
  key_wins TEXT,
  key_risks TEXT,
  next_actions TEXT,
  assigned_user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (reporting_period_end >= reporting_period_start)
);

CREATE INDEX IF NOT EXISTS idx_reports_organization_id ON public.reports (organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_client_id ON public.reports (client_id);
CREATE INDEX IF NOT EXISTS idx_reports_assigned_user_id ON public.reports (assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_org_status ON public.reports (organization_id, status);

CREATE TRIGGER reports_set_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY reports_select_own_org
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

CREATE POLICY reports_insert_owner_admin
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY reports_insert_staff
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() = 'staff'
    AND assigned_user_id = public.current_app_user_id()
  );

CREATE POLICY reports_update_owner_admin
  ON public.reports
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

CREATE POLICY reports_update_staff
  ON public.reports
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

GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON TABLE public.reports TO service_role;
