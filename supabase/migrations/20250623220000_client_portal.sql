-- Customer Portal v1 — client-facing access for reports and operational status

CREATE TABLE IF NOT EXISTS public.client_portal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, email)
);

CREATE INDEX IF NOT EXISTS idx_client_portal_users_organization_id
  ON public.client_portal_users (organization_id);

CREATE INDEX IF NOT EXISTS idx_client_portal_users_client_id
  ON public.client_portal_users (client_id);

CREATE INDEX IF NOT EXISTS idx_client_portal_users_auth_user_id
  ON public.client_portal_users (auth_user_id);

-- ---------------------------------------------------------------------------
-- Portal session helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_portal_client_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id
  FROM public.client_portal_users
  WHERE auth_user_id = auth.uid()
    AND is_active = TRUE
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_portal_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.client_portal_users
  WHERE auth_user_id = auth.uid()
    AND is_active = TRUE
  LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- client_portal_users RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.client_portal_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_portal_users_select_self
  ON public.client_portal_users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid() AND is_active = TRUE);

CREATE POLICY client_portal_users_select_agency
  ON public.client_portal_users
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY client_portal_users_insert_agency
  ON public.client_portal_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY client_portal_users_update_agency
  ON public.client_portal_users
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT, INSERT, UPDATE ON public.client_portal_users TO authenticated;
GRANT ALL ON TABLE public.client_portal_users TO service_role;

-- ---------------------------------------------------------------------------
-- Portal read access on shared operational tables
-- ---------------------------------------------------------------------------
CREATE POLICY organizations_select_portal_user
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (id = public.current_portal_organization_id());

CREATE POLICY clients_select_portal_user
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (id = public.current_portal_client_id());

CREATE POLICY reports_select_portal_client
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (
    client_id = public.current_portal_client_id()
    AND status = 'sent'
    AND public.current_portal_client_id() IS NOT NULL
  );

CREATE POLICY risks_select_portal_client
  ON public.risks
  FOR SELECT
  TO authenticated
  USING (
    client_id = public.current_portal_client_id()
    AND status IN ('open', 'in_progress')
    AND public.current_portal_client_id() IS NOT NULL
  );

CREATE POLICY incidents_select_portal_client
  ON public.incidents
  FOR SELECT
  TO authenticated
  USING (
    client_id = public.current_portal_client_id()
    AND status IN ('open', 'investigating')
    AND public.current_portal_client_id() IS NOT NULL
  );
