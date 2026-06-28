-- Phase 4 Sprint 6.5 — Enterprise connectors platform

ALTER TABLE public.integration_secrets DROP CONSTRAINT IF EXISTS integration_secrets_secret_type_check;

ALTER TABLE public.integration_secrets
  ADD CONSTRAINT integration_secrets_secret_type_check CHECK (
    secret_type IN (
      'bearer_token',
      'api_key',
      'basic_auth',
      'webhook_secret',
      'smtp_credentials',
      'oauth_placeholder',
      'oauth_access_token',
      'oauth_refresh_token'
    )
  );

CREATE TABLE IF NOT EXISTS public.integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  connector_id TEXT NOT NULL,
  connector_version TEXT NOT NULL DEFAULT '1.0.0',
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (
    status IN ('connected', 'disconnected', 'error', 'revoked', 'expired')
  ),
  access_secret_id UUID REFERENCES public.integration_secrets (id) ON DELETE SET NULL,
  refresh_secret_id UUID REFERENCES public.integration_secrets (id) ON DELETE SET NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  token_expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (
    last_sync_status IS NULL OR last_sync_status IN ('success', 'failed', 'running', 'partial')
  ),
  health_status TEXT NOT NULL DEFAULT 'unknown' CHECK (
    health_status IN ('healthy', 'degraded', 'unhealthy', 'unknown')
  ),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, connector_id, display_name)
);

CREATE TABLE IF NOT EXISTS public.integration_oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  connector_id TEXT NOT NULL,
  state_token TEXT NOT NULL UNIQUE,
  code_verifier TEXT,
  redirect_uri TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.integration_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.integration_connections (id) ON DELETE CASCADE,
  connector_id TEXT NOT NULL,
  sync_type TEXT NOT NULL CHECK (
    sync_type IN ('manual', 'scheduled', 'incremental', 'full')
  ),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'running', 'completed', 'failed', 'cancelled')
  ),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  records_changed INTEGER NOT NULL DEFAULT 0 CHECK (records_changed >= 0),
  cursor TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_connections_org
  ON public.integration_connections (organization_id, connector_id);

CREATE INDEX IF NOT EXISTS idx_integration_oauth_states_org
  ON public.integration_oauth_states (organization_id, connector_id);

CREATE INDEX IF NOT EXISTS idx_integration_oauth_states_expires
  ON public.integration_oauth_states (expires_at)
  WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_integration_sync_jobs_org_connection
  ON public.integration_sync_jobs (organization_id, connection_id, created_at DESC);

DROP TRIGGER IF EXISTS integration_connections_set_updated_at ON public.integration_connections;
CREATE TRIGGER integration_connections_set_updated_at
  BEFORE UPDATE ON public.integration_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS integration_sync_jobs_set_updated_at ON public.integration_sync_jobs;
CREATE TRIGGER integration_sync_jobs_set_updated_at
  BEFORE UPDATE ON public.integration_sync_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_sync_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS integration_connections_select_owner_admin ON public.integration_connections;
CREATE POLICY integration_connections_select_owner_admin
  ON public.integration_connections FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS integration_connections_mutate_owner_admin ON public.integration_connections;
CREATE POLICY integration_connections_mutate_owner_admin
  ON public.integration_connections FOR ALL TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS integration_oauth_states_owner_admin ON public.integration_oauth_states;
CREATE POLICY integration_oauth_states_owner_admin
  ON public.integration_oauth_states FOR ALL TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS integration_sync_jobs_select_owner_admin ON public.integration_sync_jobs;
CREATE POLICY integration_sync_jobs_select_owner_admin
  ON public.integration_sync_jobs FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin', 'staff')
  );

DROP POLICY IF EXISTS integration_sync_jobs_mutate_staff_plus ON public.integration_sync_jobs;
CREATE POLICY integration_sync_jobs_mutate_staff_plus
  ON public.integration_sync_jobs FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin', 'staff')
  );

DROP POLICY IF EXISTS integration_sync_jobs_update_staff_plus ON public.integration_sync_jobs;
CREATE POLICY integration_sync_jobs_update_staff_plus
  ON public.integration_sync_jobs FOR UPDATE TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin', 'staff')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin', 'staff')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_oauth_states TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.integration_sync_jobs TO authenticated;
GRANT ALL ON public.integration_connections TO service_role;
GRANT ALL ON public.integration_oauth_states TO service_role;
GRANT ALL ON public.integration_sync_jobs TO service_role;
