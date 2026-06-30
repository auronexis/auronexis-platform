-- Health Engine V2 — client health snapshots (idempotent)

CREATE TABLE IF NOT EXISTS public.health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients (id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  status TEXT NOT NULL CHECK (status IN ('excellent', 'healthy', 'watch', 'critical')),
  delta INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_snapshots_org_client
  ON public.health_snapshots (organization_id, client_id);

CREATE INDEX IF NOT EXISTS idx_health_snapshots_org_calculated
  ON public.health_snapshots (organization_id, calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_snapshots_client_calculated
  ON public.health_snapshots (client_id, calculated_at DESC);

ALTER TABLE public.health_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS health_snapshots_select_own_org ON public.health_snapshots;

CREATE POLICY health_snapshots_select_own_org
  ON public.health_snapshots
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS health_snapshots_insert_own_org ON public.health_snapshots;

CREATE POLICY health_snapshots_insert_own_org
  ON public.health_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.current_organization_id());

GRANT SELECT, INSERT ON public.health_snapshots TO authenticated;
GRANT ALL ON TABLE public.health_snapshots TO service_role;
