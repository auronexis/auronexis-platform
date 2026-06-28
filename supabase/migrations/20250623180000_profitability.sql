-- Profitability module v1 — per-client operational financial visibility

CREATE TABLE IF NOT EXISTS public.client_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients (id) ON DELETE CASCADE,
  monthly_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (monthly_revenue >= 0),
  monthly_cost NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (monthly_cost >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id)
);

CREATE INDEX IF NOT EXISTS idx_client_financials_organization_id
  ON public.client_financials (organization_id);

CREATE INDEX IF NOT EXISTS idx_client_financials_client_id
  ON public.client_financials (client_id);

CREATE TRIGGER client_financials_set_updated_at
  BEFORE UPDATE ON public.client_financials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.client_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_financials_select_own_org
  ON public.client_financials
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

CREATE POLICY client_financials_insert_owner_admin
  ON public.client_financials
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY client_financials_update_owner_admin
  ON public.client_financials
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

GRANT SELECT, INSERT, UPDATE ON public.client_financials TO authenticated;
GRANT ALL ON TABLE public.client_financials TO service_role;
