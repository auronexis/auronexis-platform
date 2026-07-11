-- Phase 25 — Executive intelligence briefing history (additive)

CREATE TABLE IF NOT EXISTS public.executive_intelligence_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  period_key TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  comparison_start TIMESTAMPTZ NOT NULL,
  comparison_end TIMESTAMPTZ NOT NULL,
  snapshot JSONB NOT NULL,
  deterministic_narrative TEXT NOT NULL,
  ai_narrative TEXT,
  generated_by TEXT NOT NULL,
  generated_by_user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  provider TEXT,
  model TEXT,
  status TEXT NOT NULL DEFAULT 'generated',
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT executive_intelligence_briefings_status_check
    CHECK (status IN ('generated', 'fallback', 'failed', 'archived')),
  CONSTRAINT executive_intelligence_briefings_generated_by_check
    CHECK (generated_by IN ('deterministic', 'ai_assisted'))
);

CREATE INDEX IF NOT EXISTS idx_ei_briefings_org
  ON public.executive_intelligence_briefings (organization_id);

CREATE INDEX IF NOT EXISTS idx_ei_briefings_org_period
  ON public.executive_intelligence_briefings (organization_id, period_key);

CREATE INDEX IF NOT EXISTS idx_ei_briefings_org_created
  ON public.executive_intelligence_briefings (organization_id, created_at DESC);

CREATE TRIGGER executive_intelligence_briefings_set_updated_at
  BEFORE UPDATE ON public.executive_intelligence_briefings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.executive_intelligence_briefings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ei_briefings_select_member ON public.executive_intelligence_briefings;
CREATE POLICY ei_briefings_select_member
  ON public.executive_intelligence_briefings
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS ei_briefings_insert_manager ON public.executive_intelligence_briefings;
CREATE POLICY ei_briefings_insert_manager
  ON public.executive_intelligence_briefings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.auth_user_id = auth.uid()
        AND users.organization_id = executive_intelligence_briefings.organization_id
        AND users.is_disabled = FALSE
        AND users.role IN ('owner', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS ei_briefings_update_manager ON public.executive_intelligence_briefings;
CREATE POLICY ei_briefings_update_manager
  ON public.executive_intelligence_briefings
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.auth_user_id = auth.uid()
        AND users.organization_id = executive_intelligence_briefings.organization_id
        AND users.is_disabled = FALSE
        AND users.role IN ('owner', 'admin', 'manager')
    )
  )
  WITH CHECK (organization_id = public.current_organization_id());

GRANT SELECT, INSERT, UPDATE ON public.executive_intelligence_briefings TO authenticated;
GRANT ALL ON TABLE public.executive_intelligence_briefings TO service_role;
