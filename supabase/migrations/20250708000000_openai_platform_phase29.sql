-- Phase 29 — Production OpenAI platform health and request logging

CREATE TABLE IF NOT EXISTS public.platform_openai_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ok BOOLEAN NOT NULL,
  model TEXT,
  latency_ms INTEGER,
  provider_request_id TEXT,
  error_code TEXT,
  sanitized_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_openai_health_checks_created
  ON public.platform_openai_health_checks (created_at DESC);

ALTER TABLE public.platform_openai_health_checks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ai_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients (id) ON DELETE SET NULL,
  report_id UUID REFERENCES public.reports (id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'openai',
  model TEXT NOT NULL,
  feature TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed')),
  prompt_version TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  latency_ms INTEGER,
  provider_request_id TEXT,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_request_logs_org_created
  ON public.ai_request_logs (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_request_logs_user_created
  ON public.ai_request_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_request_logs_feature_created
  ON public.ai_request_logs (organization_id, feature, created_at DESC);

ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_request_logs_select_owner_admin
  ON public.ai_request_logs
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT ON public.ai_request_logs TO authenticated;
GRANT ALL ON TABLE public.ai_request_logs TO service_role;
GRANT ALL ON TABLE public.platform_openai_health_checks TO service_role;
