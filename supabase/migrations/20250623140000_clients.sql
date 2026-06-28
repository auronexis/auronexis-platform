-- Clients module v1 — organization-scoped customer records

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'watch', 'critical', 'archived')),
  contact_name TEXT,
  contact_email TEXT,
  monthly_revenue NUMERIC(12, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON public.clients (organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_org_status ON public.clients (organization_id, status);

CREATE TRIGGER clients_set_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Role helper for write policies (Layer 1); RBAC also enforced in Server Actions (Layer 2).
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.users
  WHERE auth_user_id = auth.uid()
    AND is_disabled = FALSE
  LIMIT 1;
$$;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY clients_select_own_org
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

CREATE POLICY clients_insert_owner_admin
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY clients_update_owner_admin
  ON public.clients
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

GRANT SELECT, INSERT, UPDATE ON public.clients TO authenticated;
GRANT ALL ON TABLE public.clients TO service_role;
