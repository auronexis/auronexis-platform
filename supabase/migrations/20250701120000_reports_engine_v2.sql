-- Reports Engine V2 — versioning, metrics, and status lifecycle (idempotent)

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS root_report_id UUID REFERENCES public.reports (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS health_score INTEGER,
  ADD COLUMN IF NOT EXISTS sla_score INTEGER;

UPDATE public.reports
SET root_report_id = id
WHERE root_report_id IS NULL;

UPDATE public.reports
SET published_at = COALESCE(published_at, updated_at)
WHERE status IN ('published', 'sent')
  AND published_at IS NULL;

UPDATE public.reports
SET status = 'generated'
WHERE status = 'ready';

UPDATE public.reports
SET status = 'published'
WHERE status = 'sent';

ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_status_check;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_status_check
  CHECK (status IN ('draft', 'generated', 'published', 'archived'));

ALTER TABLE public.reports
  ALTER COLUMN status SET DEFAULT 'draft';

CREATE INDEX IF NOT EXISTS idx_reports_org_status
  ON public.reports (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_reports_org_published_at
  ON public.reports (organization_id, published_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_reports_org_client
  ON public.reports (organization_id, client_id);

CREATE INDEX IF NOT EXISTS idx_reports_root_version
  ON public.reports (root_report_id, version DESC);

DROP POLICY IF EXISTS reports_select_portal_client ON public.reports;

CREATE POLICY reports_select_portal_client
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (
    client_id = public.current_portal_client_id()
    AND status = 'published'
    AND public.current_portal_client_id() IS NOT NULL
  );

DROP POLICY IF EXISTS reports_delete_org ON public.reports;

CREATE POLICY reports_delete_org
  ON public.reports
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );
