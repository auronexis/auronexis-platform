-- P1-002: pricing / tax / invoice / B2B contracting foundations (additive, non-destructive).
-- Does not reinterpret historical billing_provider_transactions currency or amounts.

-- Billing currency on active subscription commercial row (display currency remains organizations.currency).
ALTER TABLE public.organization_subscriptions
  ADD COLUMN IF NOT EXISTS billing_currency text;

ALTER TABLE public.organization_subscriptions
  ADD COLUMN IF NOT EXISTS catalog_price_version text;

ALTER TABLE public.organization_subscriptions
  ADD COLUMN IF NOT EXISTS catalog_amount_minor integer;

COMMENT ON COLUMN public.organization_subscriptions.billing_currency IS
  'Currency charged via Mollie for this subscription. Independent of organizations.currency display preference. Never silently FX-converted.';
COMMENT ON COLUMN public.organization_subscriptions.catalog_price_version IS
  'Active price catalog version at subscription start / last commercial change.';
COMMENT ON COLUMN public.organization_subscriptions.catalog_amount_minor IS
  'Catalog gross amount in minor units at last commercial change.';

-- Organization billing identity (VAT ID, address, country).
CREATE TABLE IF NOT EXISTS public.organization_billing_identities (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations (id) ON DELETE CASCADE,
  legal_name text,
  billing_email text,
  country_code text,
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  vat_id text,
  vat_id_normalized text,
  vies_status text,
  vies_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_billing_identities_country_code_check
    CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$'),
  CONSTRAINT organization_billing_identities_vies_status_check
    CHECK (
      vies_status IS NULL
      OR vies_status IN ('valid', 'invalid', 'unavailable', 'not_checked', 'skipped')
    )
);

CREATE INDEX IF NOT EXISTS idx_org_billing_identities_vat_normalized
  ON public.organization_billing_identities (vat_id_normalized)
  WHERE vat_id_normalized IS NOT NULL;

ALTER TABLE public.organization_billing_identities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organization_billing_identities_tenant_select ON public.organization_billing_identities;
CREATE POLICY organization_billing_identities_tenant_select
  ON public.organization_billing_identities
  FOR SELECT
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS organization_billing_identities_tenant_write ON public.organization_billing_identities;
CREATE POLICY organization_billing_identities_tenant_write
  ON public.organization_billing_identities
  FOR ALL
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());

-- Contract / Terms / DPA / B2B acceptance evidence.
CREATE TABLE IF NOT EXISTS public.organization_contract_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  kind text NOT NULL,
  document_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_contract_acceptances_kind_check
    CHECK (kind IN ('terms', 'b2b_entrepreneur', 'dpa', 'checkout_contract_summary')),
  CONSTRAINT organization_contract_acceptances_source_check
    CHECK (source IN ('signup', 'checkout', 'settings'))
);

CREATE INDEX IF NOT EXISTS idx_org_contract_acceptances_org_accepted
  ON public.organization_contract_acceptances (organization_id, accepted_at DESC);

ALTER TABLE public.organization_contract_acceptances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organization_contract_acceptances_tenant_select ON public.organization_contract_acceptances;
CREATE POLICY organization_contract_acceptances_tenant_select
  ON public.organization_contract_acceptances
  FOR SELECT
  USING (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS organization_contract_acceptances_tenant_insert ON public.organization_contract_acceptances;
CREATE POLICY organization_contract_acceptances_tenant_insert
  ON public.organization_contract_acceptances
  FOR INSERT
  WITH CHECK (organization_id = public.current_organization_id());

-- Auroranexis-owned sales invoices (distinct from Mollie payment links).
CREATE TABLE IF NOT EXISTS public.sales_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  currency text NOT NULL,
  net_minor integer NOT NULL,
  vat_rate_bps integer NOT NULL DEFAULT 0,
  vat_minor integer NOT NULL,
  gross_minor integer NOT NULL,
  tax_policy_outcome text NOT NULL,
  tax_note text,
  billing_period_start timestamptz,
  billing_period_end timestamptz,
  mollie_payment_id text,
  provider_transaction_id text,
  buyer_legal_name text,
  buyer_vat_id text,
  buyer_country_code text,
  lines_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  issued_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_invoices_status_check
    CHECK (status IN ('draft', 'issued', 'void')),
  CONSTRAINT sales_invoices_money_check
    CHECK (
      net_minor >= 0
      AND vat_minor >= 0
      AND gross_minor >= 0
      AND net_minor + vat_minor = gross_minor
    ),
  CONSTRAINT sales_invoices_invoice_number_unique UNIQUE (invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_sales_invoices_org_issued
  ON public.sales_invoices (organization_id, issued_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_invoices_provider_tx_unique
  ON public.sales_invoices (organization_id, provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;

ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sales_invoices_tenant_select ON public.sales_invoices;
CREATE POLICY sales_invoices_tenant_select
  ON public.sales_invoices
  FOR SELECT
  USING (organization_id = public.current_organization_id());

-- Invoice number allocator (service role / SECURITY DEFINER).
CREATE TABLE IF NOT EXISTS public.sales_invoice_number_counters (
  year integer NOT NULL,
  last_value integer NOT NULL DEFAULT 0,
  PRIMARY KEY (year)
);

CREATE OR REPLACE FUNCTION public.allocate_sales_invoice_number(
  p_organization_id uuid,
  p_year integer
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_val integer;
BEGIN
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id required';
  END IF;

  INSERT INTO public.sales_invoice_number_counters AS c (year, last_value)
  VALUES (p_year, 1)
  ON CONFLICT (year)
  DO UPDATE SET last_value = c.last_value + 1
  RETURNING last_value INTO next_val;

  RETURN 'ANX-' || p_year::text || '-' || lpad(next_val::text, 6, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.allocate_sales_invoice_number(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.allocate_sales_invoice_number(uuid, integer) TO service_role;
