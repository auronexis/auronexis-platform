-- Executive Reports V3 — persisted executive deliverable snapshots

CREATE TABLE IF NOT EXISTS public.executive_report_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.reports (id) ON DELETE SET NULL,
  executive_summary TEXT,
  risk_summary TEXT,
  incident_summary TEXT,
  sla_summary TEXT,
  monitoring_summary TEXT,
  ai_summary TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_executive_report_snapshots_org_report
  ON public.executive_report_snapshots (organization_id, report_id);

CREATE INDEX IF NOT EXISTS idx_executive_report_snapshots_org_generated
  ON public.executive_report_snapshots (organization_id, generated_at DESC);

ALTER TABLE public.executive_report_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS executive_report_snapshots_select_own_org ON public.executive_report_snapshots;
CREATE POLICY executive_report_snapshots_select_own_org
  ON public.executive_report_snapshots
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS executive_report_snapshots_insert_own_org ON public.executive_report_snapshots;
CREATE POLICY executive_report_snapshots_insert_own_org
  ON public.executive_report_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.current_organization_id());

GRANT SELECT, INSERT ON public.executive_report_snapshots TO authenticated;
GRANT ALL ON TABLE public.executive_report_snapshots TO service_role;

DROP POLICY IF EXISTS executive_report_snapshots_select_portal ON public.executive_report_snapshots;
CREATE POLICY executive_report_snapshots_select_portal
  ON public.executive_report_snapshots
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.current_portal_organization_id()
    AND public.current_portal_client_id() IS NOT NULL
    AND report_id IN (
      SELECT id
      FROM public.reports
      WHERE client_id = public.current_portal_client_id()
        AND status = 'published'
    )
  );
