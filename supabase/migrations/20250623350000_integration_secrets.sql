-- Phase 4 Sprint 3 — Integration secrets vault (encrypted at rest)

CREATE TABLE IF NOT EXISTS public.integration_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  secret_type TEXT NOT NULL CHECK (
    secret_type IN (
      'bearer_token',
      'api_key',
      'basic_auth',
      'webhook_secret',
      'smtp_credentials',
      'oauth_placeholder'
    )
  ),
  encrypted_value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'inactive', 'expired', 'pending_rotation')
  ),
  created_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  last_used_at TIMESTAMPTZ,
  rotation_due_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_integration_secrets_organization_id
  ON public.integration_secrets (organization_id);

CREATE INDEX IF NOT EXISTS idx_integration_secrets_org_provider
  ON public.integration_secrets (organization_id, provider_id);

CREATE INDEX IF NOT EXISTS idx_integration_secrets_org_status
  ON public.integration_secrets (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_integration_secrets_rotation_due
  ON public.integration_secrets (organization_id, rotation_due_at)
  WHERE rotation_due_at IS NOT NULL;

DROP TRIGGER IF EXISTS integration_secrets_set_updated_at ON public.integration_secrets;

CREATE TRIGGER integration_secrets_set_updated_at
  BEFORE UPDATE ON public.integration_secrets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS integration_secrets_select_owner_admin ON public.integration_secrets;
CREATE POLICY integration_secrets_select_owner_admin
  ON public.integration_secrets FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS integration_secrets_insert_owner_admin ON public.integration_secrets;
CREATE POLICY integration_secrets_insert_owner_admin
  ON public.integration_secrets FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS integration_secrets_update_owner_admin ON public.integration_secrets;
CREATE POLICY integration_secrets_update_owner_admin
  ON public.integration_secrets FOR UPDATE TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS integration_secrets_delete_owner_admin ON public.integration_secrets;
CREATE POLICY integration_secrets_delete_owner_admin
  ON public.integration_secrets FOR DELETE TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_secrets TO authenticated;
GRANT ALL ON TABLE public.integration_secrets TO service_role;
