-- Sprint 21 — Enterprise Plan + Admin Controls V1

CREATE TABLE IF NOT EXISTS public.enterprise_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  requested_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  contact_email TEXT,
  company_name TEXT,
  requested_seats INTEGER,
  requested_clients INTEGER,
  requested_features TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  handled_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  handled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT enterprise_requests_status_check CHECK (
    status IN ('new', 'contacted', 'qualified', 'approved', 'rejected', 'closed')
  )
);

CREATE INDEX IF NOT EXISTS idx_enterprise_requests_organization_id
  ON public.enterprise_requests (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_enterprise_requests_status
  ON public.enterprise_requests (status, created_at DESC);

DROP TRIGGER IF EXISTS enterprise_requests_set_updated_at ON public.enterprise_requests;
CREATE TRIGGER enterprise_requests_set_updated_at
  BEFORE UPDATE ON public.enterprise_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.enterprise_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS enterprise_requests_select_org ON public.enterprise_requests;
CREATE POLICY enterprise_requests_select_org
  ON public.enterprise_requests FOR SELECT TO authenticated
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS enterprise_requests_insert_org ON public.enterprise_requests;
CREATE POLICY enterprise_requests_insert_org
  ON public.enterprise_requests FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_organization_id());

GRANT SELECT, INSERT ON public.enterprise_requests TO authenticated;

CREATE TABLE IF NOT EXISTS public.organization_plan_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  seats_limit INTEGER,
  clients_limit INTEGER,
  monitoring_limit INTEGER,
  api_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  webhooks_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ai_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  portal_branding_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  custom_domain_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  priority_support_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT organization_plan_overrides_organization_id_key UNIQUE (organization_id),
  CONSTRAINT organization_plan_overrides_status_check CHECK (
    status IN ('active', 'inactive', 'expired', 'revoked')
  )
);

CREATE INDEX IF NOT EXISTS idx_organization_plan_overrides_org
  ON public.organization_plan_overrides (organization_id);

DROP TRIGGER IF EXISTS organization_plan_overrides_set_updated_at ON public.organization_plan_overrides;
CREATE TRIGGER organization_plan_overrides_set_updated_at
  BEFORE UPDATE ON public.organization_plan_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.organization_plan_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organization_plan_overrides_select_owner_admin ON public.organization_plan_overrides;
CREATE POLICY organization_plan_overrides_select_owner_admin
  ON public.organization_plan_overrides FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT ON public.organization_plan_overrides TO authenticated;
