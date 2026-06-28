-- Phase 4 Sprint 6 — Public API Platform v1

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  key_type TEXT NOT NULL CHECK (key_type IN ('personal', 'workspace')),
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_organization_id ON public.api_keys (organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_org_status ON public.api_keys (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys (key_hash);

DROP TRIGGER IF EXISTS api_keys_set_updated_at ON public.api_keys;
CREATE TRIGGER api_keys_set_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS api_keys_select_owner_admin ON public.api_keys;
CREATE POLICY api_keys_select_owner_admin
  ON public.api_keys FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS api_keys_insert_owner_admin ON public.api_keys;
CREATE POLICY api_keys_insert_owner_admin
  ON public.api_keys FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS api_keys_update_owner_admin ON public.api_keys;
CREATE POLICY api_keys_update_owner_admin
  ON public.api_keys FOR UPDATE TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS api_keys_delete_owner_admin ON public.api_keys;
CREATE POLICY api_keys_delete_owner_admin
  ON public.api_keys FOR DELETE TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;

CREATE TABLE IF NOT EXISTS public.api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.api_keys (id) ON DELETE SET NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  rate_limited BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_request_logs_org_created
  ON public.api_request_logs (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_request_logs_key_created
  ON public.api_request_logs (api_key_id, created_at DESC);

ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS api_request_logs_select_owner_admin ON public.api_request_logs;
CREATE POLICY api_request_logs_select_owner_admin
  ON public.api_request_logs FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT ON public.api_request_logs TO authenticated;

CREATE TABLE IF NOT EXISTS public.api_webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  description TEXT,
  events TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  signing_secret_encrypted TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disabled')),
  created_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, url)
);

CREATE INDEX IF NOT EXISTS idx_api_webhook_endpoints_org
  ON public.api_webhook_endpoints (organization_id);

ALTER TABLE public.api_webhook_endpoints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS api_webhook_endpoints_select_owner_admin ON public.api_webhook_endpoints;
CREATE POLICY api_webhook_endpoints_select_owner_admin
  ON public.api_webhook_endpoints FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS api_webhook_endpoints_mutate_owner_admin ON public.api_webhook_endpoints;
CREATE POLICY api_webhook_endpoints_mutate_owner_admin
  ON public.api_webhook_endpoints FOR ALL TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_webhook_endpoints TO authenticated;

CREATE TABLE IF NOT EXISTS public.api_webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  endpoint_id UUID NOT NULL REFERENCES public.api_webhook_endpoints (id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'delivered', 'failed', 'retrying', 'dead_letter')
  ),
  attempts INTEGER NOT NULL DEFAULT 0,
  response_status INTEGER,
  error_message TEXT,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_webhook_deliveries_org_created
  ON public.api_webhook_deliveries (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_webhook_deliveries_endpoint
  ON public.api_webhook_deliveries (endpoint_id, created_at DESC);

DROP TRIGGER IF EXISTS api_webhook_deliveries_set_updated_at ON public.api_webhook_deliveries;
CREATE TRIGGER api_webhook_deliveries_set_updated_at
  BEFORE UPDATE ON public.api_webhook_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.api_webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS api_webhook_deliveries_select_owner_admin ON public.api_webhook_deliveries;
CREATE POLICY api_webhook_deliveries_select_owner_admin
  ON public.api_webhook_deliveries FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT ON public.api_webhook_deliveries TO authenticated;
