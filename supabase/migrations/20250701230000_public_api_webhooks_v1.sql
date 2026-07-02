-- Sprint 20 — Public API + Outbound Webhooks V1

CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON public.api_keys (key_prefix);

CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, url)
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_organization_active
  ON public.webhook_endpoints (organization_id, active);

DROP TRIGGER IF EXISTS webhook_endpoints_set_updated_at ON public.webhook_endpoints;
CREATE TRIGGER webhook_endpoints_set_updated_at
  BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS webhook_endpoints_select_owner_admin ON public.webhook_endpoints;
CREATE POLICY webhook_endpoints_select_owner_admin
  ON public.webhook_endpoints FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS webhook_endpoints_mutate_owner_admin ON public.webhook_endpoints;
CREATE POLICY webhook_endpoints_mutate_owner_admin
  ON public.webhook_endpoints FOR ALL TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_endpoints TO authenticated;

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  endpoint_id UUID NOT NULL REFERENCES public.webhook_endpoints (id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  response_status INTEGER,
  response_body TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_organization_endpoint
  ON public.webhook_deliveries (organization_id, endpoint_id);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status_next_retry
  ON public.webhook_deliveries (status, next_retry_at)
  WHERE status IN ('pending', 'retrying');

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_org_created
  ON public.webhook_deliveries (organization_id, created_at DESC);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS webhook_deliveries_select_owner_admin ON public.webhook_deliveries;
CREATE POLICY webhook_deliveries_select_owner_admin
  ON public.webhook_deliveries FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT ON public.webhook_deliveries TO authenticated;

-- Backfill from legacy api_webhook_* tables when present
INSERT INTO public.webhook_endpoints (
  id,
  organization_id,
  name,
  url,
  secret,
  events,
  active,
  created_at,
  updated_at
)
SELECT
  e.id,
  e.organization_id,
  COALESCE(NULLIF(e.description, ''), 'Webhook endpoint'),
  e.url,
  e.signing_secret_encrypted,
  e.events,
  e.status = 'active',
  e.created_at,
  e.updated_at
FROM public.api_webhook_endpoints e
WHERE NOT EXISTS (
  SELECT 1 FROM public.webhook_endpoints w WHERE w.id = e.id
);

INSERT INTO public.webhook_deliveries (
  id,
  organization_id,
  endpoint_id,
  event_type,
  payload,
  status,
  response_status,
  response_body,
  attempts,
  next_retry_at,
  delivered_at,
  created_at
)
SELECT
  d.id,
  d.organization_id,
  d.endpoint_id,
  d.event_type,
  d.payload,
  CASE d.status
    WHEN 'delivered' THEN 'delivered'
    WHEN 'retrying' THEN 'retrying'
    WHEN 'dead_letter' THEN 'failed'
    ELSE d.status
  END,
  d.response_status,
  d.error_message,
  d.attempts,
  d.next_retry_at,
  d.delivered_at,
  d.created_at
FROM public.api_webhook_deliveries d
WHERE EXISTS (SELECT 1 FROM public.webhook_endpoints w WHERE w.id = d.endpoint_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.webhook_deliveries wd WHERE wd.id = d.id
  );
