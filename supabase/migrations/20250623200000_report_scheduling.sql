-- Report Scheduling v1 — recurring report schedules per client

CREATE TABLE IF NOT EXISTS public.report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients (id) ON DELETE CASCADE,
  title_template TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly')),
  day_of_month INTEGER,
  assigned_user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  next_run_at DATE,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (frequency = 'monthly' AND day_of_month IS NOT NULL AND day_of_month BETWEEN 1 AND 28)
    OR (frequency = 'quarterly')
  ),
  CHECK (day_of_month IS NULL OR day_of_month BETWEEN 1 AND 28)
);

CREATE INDEX IF NOT EXISTS idx_report_schedules_organization_id
  ON public.report_schedules (organization_id);

CREATE INDEX IF NOT EXISTS idx_report_schedules_client_id
  ON public.report_schedules (organization_id, client_id);

CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run_at
  ON public.report_schedules (organization_id, next_run_at);

CREATE TRIGGER report_schedules_set_updated_at
  BEFORE UPDATE ON public.report_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY report_schedules_select_own_org
  ON public.report_schedules
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

CREATE POLICY report_schedules_insert_owner_admin
  ON public.report_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY report_schedules_update_owner_admin
  ON public.report_schedules
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

GRANT SELECT, INSERT, UPDATE ON public.report_schedules TO authenticated;
GRANT ALL ON TABLE public.report_schedules TO service_role;
