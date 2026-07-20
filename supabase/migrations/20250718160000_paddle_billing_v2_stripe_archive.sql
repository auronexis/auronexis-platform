-- Paddle Billing Experience V2 + Stripe historical archive
-- Additive and reversible. Does not drop live Stripe mirror tables yet.
-- Rollback notes at end of file.

-- ---------------------------------------------------------------------------
-- Enrich billing_provider_transactions for invoice history display
-- ---------------------------------------------------------------------------

ALTER TABLE public.billing_provider_transactions
  ADD COLUMN IF NOT EXISTS amount_subtotal INTEGER,
  ADD COLUMN IF NOT EXISTS amount_tax INTEGER,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS product_name TEXT,
  ADD COLUMN IF NOT EXISTS payment_method_summary TEXT,
  ADD COLUMN IF NOT EXISTS billing_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_period_end TIMESTAMPTZ;

COMMENT ON COLUMN public.billing_provider_transactions.invoice_url IS
  'Optional mirror URL. Prefer on-demand Paddle getInvoicePDF for downloads.';

-- ---------------------------------------------------------------------------
-- Read-only Stripe history archive (copy; do not delete sources yet)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.legacy_stripe_customer_invoices AS
SELECT * FROM public.customer_invoices WITH NO DATA;

INSERT INTO public.legacy_stripe_customer_invoices
SELECT c.*
FROM public.customer_invoices c
WHERE NOT EXISTS (
  SELECT 1 FROM public.legacy_stripe_customer_invoices a WHERE a.id = c.id
);

CREATE TABLE IF NOT EXISTS public.legacy_stripe_webhook_events AS
SELECT * FROM public.stripe_webhook_events WITH NO DATA;

INSERT INTO public.legacy_stripe_webhook_events
SELECT e.*
FROM public.stripe_webhook_events e
WHERE NOT EXISTS (
  SELECT 1 FROM public.legacy_stripe_webhook_events a WHERE a.id = e.id
);

CREATE TABLE IF NOT EXISTS public.legacy_stripe_subscription_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  status TEXT,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_subscription_row_id UUID,
  UNIQUE (organization_id, source_subscription_row_id)
);

COMMENT ON TABLE public.legacy_stripe_customer_invoices IS
  'Read-only archive of historical Stripe invoices. Not used for active billing.';
COMMENT ON TABLE public.legacy_stripe_webhook_events IS
  'Read-only archive of historical Stripe webhook events. Not used for active billing.';
COMMENT ON TABLE public.legacy_stripe_subscription_ids IS
  'Archived Stripe customer/subscription identifiers. Never used for entitlements or checkout.';

INSERT INTO public.legacy_stripe_subscription_ids (
  organization_id,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  source_subscription_row_id
)
SELECT
  s.organization_id,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  s.stripe_price_id,
  s.status,
  s.id
FROM public.organization_subscriptions s
WHERE (
  s.stripe_customer_id IS NOT NULL
  OR s.stripe_subscription_id IS NOT NULL
  OR s.stripe_price_id IS NOT NULL
)
AND NOT EXISTS (
  SELECT 1
  FROM public.legacy_stripe_subscription_ids a
  WHERE a.source_subscription_row_id = s.id
);

ALTER TABLE public.legacy_stripe_customer_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_stripe_subscription_ids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS legacy_stripe_invoices_select_owner_admin ON public.legacy_stripe_customer_invoices;
CREATE POLICY legacy_stripe_invoices_select_owner_admin
  ON public.legacy_stripe_customer_invoices
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS legacy_stripe_webhooks_select_owner_admin ON public.legacy_stripe_webhook_events;
CREATE POLICY legacy_stripe_webhooks_select_owner_admin
  ON public.legacy_stripe_webhook_events
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS legacy_stripe_subs_select_owner_admin ON public.legacy_stripe_subscription_ids;
CREATE POLICY legacy_stripe_subs_select_owner_admin
  ON public.legacy_stripe_subscription_ids
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT ON public.legacy_stripe_customer_invoices TO authenticated;
GRANT SELECT ON public.legacy_stripe_webhook_events TO authenticated;
GRANT SELECT ON public.legacy_stripe_subscription_ids TO authenticated;
GRANT ALL ON TABLE public.legacy_stripe_customer_invoices TO service_role;
GRANT ALL ON TABLE public.legacy_stripe_webhook_events TO service_role;
GRANT ALL ON TABLE public.legacy_stripe_subscription_ids TO service_role;

-- ---------------------------------------------------------------------------
-- Rollback (manual)
-- DO NOT UNCOMMENT: historical reference only — see Build Bible V2 Chapter 1
-- non-negotiables (no destructive Stripe archive cleanup in production).
-- ---------------------------------------------------------------------------
-- DROP POLICY IF EXISTS legacy_stripe_invoices_select_owner_admin ON public.legacy_stripe_customer_invoices;
-- DROP POLICY IF EXISTS legacy_stripe_webhooks_select_owner_admin ON public.legacy_stripe_webhook_events;
-- DROP POLICY IF EXISTS legacy_stripe_subs_select_owner_admin ON public.legacy_stripe_subscription_ids;
-- DROP TABLE IF EXISTS public.legacy_stripe_customer_invoices;
-- DROP TABLE IF EXISTS public.legacy_stripe_webhook_events;
-- DROP TABLE IF EXISTS public.legacy_stripe_subscription_ids;
-- ALTER TABLE public.billing_provider_transactions
--   DROP COLUMN IF EXISTS amount_subtotal,
--   DROP COLUMN IF EXISTS amount_tax,
--   DROP COLUMN IF EXISTS invoice_number,
--   DROP COLUMN IF EXISTS product_name,
--   DROP COLUMN IF EXISTS payment_method_summary,
--   DROP COLUMN IF EXISTS billing_period_start,
--   DROP COLUMN IF EXISTS billing_period_end;
-- Source Stripe tables/columns intentionally retained for safety until a later
-- verified drop migration after runtime references are gone.
