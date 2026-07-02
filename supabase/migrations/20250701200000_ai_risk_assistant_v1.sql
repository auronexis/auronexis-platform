-- AI Risk Assistant V1 — persisted risk analysis results

CREATE TABLE IF NOT EXISTS public.risk_ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  risk_id UUID NOT NULL REFERENCES public.client_risks (id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  summary TEXT,
  risk_reasoning TEXT,
  mitigation_plan TEXT,
  recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  predicted_severity TEXT,
  predicted_score INTEGER,
  confidence NUMERIC,
  tokens_used INTEGER,
  latency_ms INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_ai_analysis_org_risk
  ON public.risk_ai_analysis (organization_id, risk_id);

CREATE INDEX IF NOT EXISTS idx_risk_ai_analysis_org_created
  ON public.risk_ai_analysis (organization_id, created_at DESC);

DROP TRIGGER IF EXISTS risk_ai_analysis_set_updated_at ON public.risk_ai_analysis;

CREATE TRIGGER risk_ai_analysis_set_updated_at
  BEFORE UPDATE ON public.risk_ai_analysis
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.risk_ai_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS risk_ai_analysis_select_own_org ON public.risk_ai_analysis;
CREATE POLICY risk_ai_analysis_select_own_org
  ON public.risk_ai_analysis
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS risk_ai_analysis_insert_own_org ON public.risk_ai_analysis;
CREATE POLICY risk_ai_analysis_insert_own_org
  ON public.risk_ai_analysis
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.current_organization_id());

GRANT SELECT, INSERT ON public.risk_ai_analysis TO authenticated;
GRANT ALL ON TABLE public.risk_ai_analysis TO service_role;
