-- Risks Engine V1 — client_risks table (idempotent)

CREATE TABLE IF NOT EXISTS public.client_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'mitigated', 'resolved', 'dismissed')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'health_engine', 'sla', 'report', 'activity', 'portal')),
  category TEXT,
  impact TEXT,
  recommendation TEXT,
  owner_user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_risks_org_client
  ON public.client_risks (organization_id, client_id);

CREATE INDEX IF NOT EXISTS idx_client_risks_org_status
  ON public.client_risks (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_client_risks_org_severity
  ON public.client_risks (organization_id, severity);

CREATE INDEX IF NOT EXISTS idx_client_risks_org_detected
  ON public.client_risks (organization_id, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_risks_client_status
  ON public.client_risks (client_id, status);

CREATE INDEX IF NOT EXISTS idx_client_risks_open_dedupe
  ON public.client_risks (organization_id, client_id, source, category)
  WHERE status IN ('open', 'acknowledged', 'mitigated');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'client_risks_set_updated_at'
  ) THEN
    CREATE TRIGGER client_risks_set_updated_at
      BEFORE UPDATE ON public.client_risks
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

ALTER TABLE public.client_risks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_risks_select_org ON public.client_risks;
CREATE POLICY client_risks_select_org
  ON public.client_risks
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS client_risks_insert_org ON public.client_risks;
CREATE POLICY client_risks_insert_org
  ON public.client_risks
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS client_risks_update_org ON public.client_risks;
CREATE POLICY client_risks_update_org
  ON public.client_risks
  FOR UPDATE
  TO authenticated
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS client_risks_delete_org ON public.client_risks;
CREATE POLICY client_risks_delete_org
  ON public.client_risks
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_risks TO authenticated;
GRANT ALL ON TABLE public.client_risks TO service_role;
