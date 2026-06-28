-- Report Templates v1 — reusable report content templates per organization

CREATE TABLE IF NOT EXISTS public.report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  executive_summary_template TEXT,
  key_wins_template TEXT,
  key_risks_template TEXT,
  next_actions_template TEXT,
  created_by UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_templates_organization_id
  ON public.report_templates (organization_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_report_templates_one_default_per_org
  ON public.report_templates (organization_id)
  WHERE is_default = TRUE;

CREATE TRIGGER report_templates_set_updated_at
  BEFORE UPDATE ON public.report_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY report_templates_select_own_org
  ON public.report_templates
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

CREATE POLICY report_templates_insert_owner_admin
  ON public.report_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY report_templates_update_owner_admin
  ON public.report_templates
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

CREATE POLICY report_templates_delete_owner_admin
  ON public.report_templates
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_templates TO authenticated;
GRANT ALL ON TABLE public.report_templates TO service_role;

-- ---------------------------------------------------------------------------
-- Link schedules to optional report templates
-- ---------------------------------------------------------------------------
ALTER TABLE public.report_schedules
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.report_templates (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_report_schedules_template_id
  ON public.report_schedules (template_id)
  WHERE template_id IS NOT NULL;
