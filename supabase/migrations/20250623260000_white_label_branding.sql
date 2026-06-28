-- White Label & Branding v1 — per-organization visual identity

CREATE TABLE IF NOT EXISTS public.organization_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations (id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  primary_color TEXT NOT NULL DEFAULT '#2563EB',
  secondary_color TEXT NOT NULL DEFAULT '#071A3D',
  logo_url TEXT,
  portal_welcome_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organization_branding_organization_id
  ON public.organization_branding (organization_id);

CREATE TRIGGER organization_branding_set_updated_at
  BEFORE UPDATE ON public.organization_branding
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.organization_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY organization_branding_select_own_org
  ON public.organization_branding
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

CREATE POLICY organization_branding_insert_owner_admin
  ON public.organization_branding
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY organization_branding_update_owner_admin
  ON public.organization_branding
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

GRANT SELECT, INSERT, UPDATE ON public.organization_branding TO authenticated;
GRANT ALL ON TABLE public.organization_branding TO service_role;
