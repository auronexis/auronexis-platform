-- Predictive Intelligence V1 — snapshots + activity (idempotent)

CREATE TABLE IF NOT EXISTS public.predictive_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients (id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  health_score INTEGER,
  risk_score INTEGER,
  incident_count INTEGER,
  breach_count INTEGER,
  monitoring_failures INTEGER,
  engagement_score INTEGER,
  predicted_health INTEGER,
  predicted_risk INTEGER,
  predicted_incidents INTEGER,
  confidence NUMERIC,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictive_snapshots_org_date
  ON public.predictive_snapshots (organization_id, snapshot_date);

CREATE INDEX IF NOT EXISTS idx_predictive_snapshots_org_client
  ON public.predictive_snapshots (organization_id, client_id);

CREATE INDEX IF NOT EXISTS idx_predictive_snapshots_org_created
  ON public.predictive_snapshots (organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.predictive_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictive_activity_org_created
  ON public.predictive_activity (organization_id, created_at DESC);

ALTER TABLE public.predictive_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS predictive_snapshots_select_own_org ON public.predictive_snapshots;
CREATE POLICY predictive_snapshots_select_own_org
  ON public.predictive_snapshots
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS predictive_snapshots_insert_own_org ON public.predictive_snapshots;
CREATE POLICY predictive_snapshots_insert_own_org
  ON public.predictive_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS predictive_activity_select_own_org ON public.predictive_activity;
CREATE POLICY predictive_activity_select_own_org
  ON public.predictive_activity
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS predictive_activity_insert_own_org ON public.predictive_activity;
CREATE POLICY predictive_activity_insert_own_org
  ON public.predictive_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.current_organization_id());

GRANT SELECT, INSERT ON public.predictive_snapshots TO authenticated;
GRANT SELECT, INSERT ON public.predictive_activity TO authenticated;
GRANT ALL ON TABLE public.predictive_snapshots TO service_role;
GRANT ALL ON TABLE public.predictive_activity TO service_role;
