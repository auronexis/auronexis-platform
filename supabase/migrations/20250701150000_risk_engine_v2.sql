-- Risk Engine V2 — scoring columns, mitigation fields, risk_activity audit trail

ALTER TABLE public.client_risks
  ADD COLUMN IF NOT EXISTS likelihood INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS impact_score INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS risk_score INTEGER NOT NULL DEFAULT 9,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mitigation_plan TEXT;

-- V1 kept narrative impact in `impact` (TEXT). impact_score is the 1–5 scoring dimension.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_risks_likelihood_range'
  ) THEN
    ALTER TABLE public.client_risks
      ADD CONSTRAINT client_risks_likelihood_range CHECK (likelihood BETWEEN 1 AND 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_risks_impact_score_range'
  ) THEN
    ALTER TABLE public.client_risks
      ADD CONSTRAINT client_risks_impact_score_range CHECK (impact_score BETWEEN 1 AND 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_risks_risk_score_range'
  ) THEN
    ALTER TABLE public.client_risks
      ADD CONSTRAINT client_risks_risk_score_range CHECK (risk_score BETWEEN 1 AND 25);
  END IF;
END $$;

UPDATE public.client_risks
SET
  likelihood = COALESCE(likelihood, 3),
  impact_score = COALESCE(
    impact_score,
    CASE severity
      WHEN 'critical' THEN 5
      WHEN 'high' THEN 4
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 2
      ELSE 3
    END
  ),
  risk_score = COALESCE(likelihood, 3) * COALESCE(
    impact_score,
    CASE severity
      WHEN 'critical' THEN 5
      WHEN 'high' THEN 4
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 2
      ELSE 3
    END
  )
WHERE risk_score IS NULL OR risk_score = 9;

CREATE INDEX IF NOT EXISTS idx_client_risks_org_risk_score
  ON public.client_risks (organization_id, risk_score DESC);

CREATE INDEX IF NOT EXISTS idx_client_risks_org_category
  ON public.client_risks (organization_id, category);

CREATE INDEX IF NOT EXISTS idx_client_risks_org_owner
  ON public.client_risks (organization_id, owner_user_id);

CREATE TABLE IF NOT EXISTS public.risk_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  risk_id UUID NOT NULL REFERENCES public.client_risks (id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'risk.created',
      'risk.updated',
      'risk.assigned',
      'risk.score_changed',
      'risk.status_changed',
      'risk.accepted',
      'risk.resolved',
      'risk.dismissed',
      'risk.deleted',
      'risk.acknowledged',
      'risk.mitigated',
      'risk.detected'
    )
  ),
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_activity_org_risk
  ON public.risk_activity (organization_id, risk_id);

CREATE INDEX IF NOT EXISTS idx_risk_activity_org_created
  ON public.risk_activity (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_risk_activity_risk_created
  ON public.risk_activity (risk_id, created_at DESC);

ALTER TABLE public.risk_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS risk_activity_select_org ON public.risk_activity;
CREATE POLICY risk_activity_select_org
  ON public.risk_activity
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS risk_activity_insert_org ON public.risk_activity;
CREATE POLICY risk_activity_insert_org
  ON public.risk_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.current_organization_id());

GRANT SELECT, INSERT ON public.risk_activity TO authenticated;
GRANT ALL ON TABLE public.risk_activity TO service_role;
