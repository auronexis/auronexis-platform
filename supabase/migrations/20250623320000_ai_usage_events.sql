-- AI usage events — server-side metering for report assistant (v1)

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  feature TEXT NOT NULL DEFAULT 'ai_report_assistant',
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_organization_id
  ON public.ai_usage_events (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_org_month
  ON public.ai_usage_events (organization_id, created_at);

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_usage_events_select_owner_admin
  ON public.ai_usage_events
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT ON public.ai_usage_events TO authenticated;
GRANT ALL ON TABLE public.ai_usage_events TO service_role;
