-- Mollie Phase 2 — TEST-mode subscription lifecycle foundation
-- - Adds mollie to billing_provider CHECKs (stripe/paddle/fastspring retained)
-- - Creates mollie_webhook_events idempotency ledger
-- - Creates mollie_test_subscriptions parallel test state (does NOT touch organization_subscriptions)
-- Does NOT drop Stripe columns, alter FastSpring runtime, or modify organizations.plan from Mollie.

-- ---------------------------------------------------------------------------
-- Allow billing_provider = 'mollie' (alongside stripe, paddle, fastspring)
-- ---------------------------------------------------------------------------

ALTER TABLE public.organization_subscriptions
  DROP CONSTRAINT IF EXISTS organization_subscriptions_billing_provider_check;

ALTER TABLE public.organization_subscriptions
  ADD CONSTRAINT organization_subscriptions_billing_provider_check
  CHECK (billing_provider IN ('stripe', 'paddle', 'fastspring', 'mollie'));

ALTER TABLE public.billing_provider_transactions
  DROP CONSTRAINT IF EXISTS billing_provider_transactions_billing_provider_check;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.billing_provider_transactions'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%billing_provider%'
      AND conname <> 'billing_provider_transactions_billing_provider_check'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE public.billing_provider_transactions DROP CONSTRAINT ' || quote_ident(conname)
      FROM pg_constraint
      WHERE conrelid = 'public.billing_provider_transactions'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%billing_provider%'
        AND conname <> 'billing_provider_transactions_billing_provider_check'
      LIMIT 1
    );
  END IF;
END $$;

ALTER TABLE public.billing_provider_transactions
  ADD CONSTRAINT billing_provider_transactions_billing_provider_check
  CHECK (billing_provider IN ('stripe', 'paddle', 'fastspring', 'mollie'));

-- ---------------------------------------------------------------------------
-- Mollie webhook event ledger (idempotent; service-role writes only)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.mollie_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'mollie',
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'processed', 'failed', 'duplicate', 'ignored')),
  last_error TEXT,
  payload_hash TEXT,
  organization_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mollie_webhook_events_provider_event_unique UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_mollie_webhook_events_received_at
  ON public.mollie_webhook_events (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_mollie_webhook_events_org
  ON public.mollie_webhook_events (organization_id)
  WHERE organization_id IS NOT NULL;

ALTER TABLE public.mollie_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mollie_webhook_events_select_owner_admin ON public.mollie_webhook_events;
CREATE POLICY mollie_webhook_events_select_owner_admin
  ON public.mollie_webhook_events
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT ON public.mollie_webhook_events TO authenticated;
GRANT ALL ON TABLE public.mollie_webhook_events TO service_role;

COMMENT ON TABLE public.mollie_webhook_events IS
  'Mollie inbound webhook idempotency ledger. Service-role writes only.';

-- ---------------------------------------------------------------------------
-- Parallel Mollie TEST subscription state — isolated from FastSpring canonical row
-- organization_subscriptions.organization_id is UNIQUE; Mollie test state lives here.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.mollie_test_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations (id) ON DELETE CASCADE,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  plan_key TEXT NOT NULL,
  provider_price_id TEXT,
  provider_status TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  first_payment_id TEXT,
  mandate_id TEXT,
  checkout_attempt_id TEXT,
  amount_value TEXT,
  amount_currency TEXT NOT NULL DEFAULT 'USD',
  sync_pending BOOLEAN NOT NULL DEFAULT TRUE,
  last_reconciled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mollie_test_subscriptions_org
  ON public.mollie_test_subscriptions (organization_id);

CREATE INDEX IF NOT EXISTS idx_mollie_test_subscriptions_customer
  ON public.mollie_test_subscriptions (provider_customer_id)
  WHERE provider_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mollie_test_subscriptions_subscription
  ON public.mollie_test_subscriptions (provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

DROP TRIGGER IF EXISTS mollie_test_subscriptions_set_updated_at ON public.mollie_test_subscriptions;

CREATE TRIGGER mollie_test_subscriptions_set_updated_at
  BEFORE UPDATE ON public.mollie_test_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.mollie_test_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mollie_test_subscriptions_select_owner_admin ON public.mollie_test_subscriptions;
CREATE POLICY mollie_test_subscriptions_select_owner_admin
  ON public.mollie_test_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT ON public.mollie_test_subscriptions TO authenticated;
GRANT ALL ON TABLE public.mollie_test_subscriptions TO service_role;

COMMENT ON TABLE public.mollie_test_subscriptions IS
  'Isolated Mollie TEST-mode subscription state. Never drives FastSpring entitlements or organization_subscriptions.';
