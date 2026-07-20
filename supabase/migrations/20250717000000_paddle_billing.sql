-- Paddle Billing v1 — additive dual-provider support (Stripe history preserved)
-- Rollback notes (end of file)

-- ---------------------------------------------------------------------------
-- organization_subscriptions: neutral provider columns (Stripe columns kept)
-- ---------------------------------------------------------------------------

ALTER TABLE public.organization_subscriptions
  ADD COLUMN IF NOT EXISTS billing_provider TEXT NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS provider_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_price_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_status TEXT,
  ADD COLUMN IF NOT EXISTS sync_pending BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organization_subscriptions_billing_provider_check'
  ) THEN
    ALTER TABLE public.organization_subscriptions
      ADD CONSTRAINT organization_subscriptions_billing_provider_check
      CHECK (billing_provider IN ('stripe', 'paddle'));
  END IF;
END $$;

-- Existing Stripe-backed rows remain billing_provider = 'stripe' via default.
UPDATE public.organization_subscriptions
SET
  provider_customer_id = COALESCE(provider_customer_id, stripe_customer_id),
  provider_subscription_id = COALESCE(provider_subscription_id, stripe_subscription_id),
  provider_price_id = COALESCE(provider_price_id, stripe_price_id),
  provider_status = COALESCE(provider_status, status)
WHERE billing_provider = 'stripe'
  AND (stripe_customer_id IS NOT NULL OR stripe_subscription_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_billing_provider
  ON public.organization_subscriptions (billing_provider);

CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_provider_customer_id
  ON public.organization_subscriptions (provider_customer_id)
  WHERE provider_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_provider_subscription_id
  ON public.organization_subscriptions (provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Paddle webhook event ledger (idempotent; not publicly writable)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.paddle_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'paddle',
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
  CONSTRAINT paddle_webhook_events_provider_event_unique UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_paddle_webhook_events_received_at
  ON public.paddle_webhook_events (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_paddle_webhook_events_org
  ON public.paddle_webhook_events (organization_id)
  WHERE organization_id IS NOT NULL;

ALTER TABLE public.paddle_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS paddle_webhook_events_select_owner_admin ON public.paddle_webhook_events;
CREATE POLICY paddle_webhook_events_select_owner_admin
  ON public.paddle_webhook_events
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT ON public.paddle_webhook_events TO authenticated;
GRANT ALL ON TABLE public.paddle_webhook_events TO service_role;

-- ---------------------------------------------------------------------------
-- Provider transactions (Paddle records; does not overwrite Stripe invoices)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.billing_provider_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  billing_provider TEXT NOT NULL CHECK (billing_provider IN ('stripe', 'paddle')),
  provider_transaction_id TEXT NOT NULL,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  provider_price_id TEXT,
  status TEXT NOT NULL,
  amount_total INTEGER,
  currency TEXT NOT NULL DEFAULT 'EUR',
  occurred_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  invoice_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT billing_provider_transactions_provider_tx_unique
    UNIQUE (billing_provider, provider_transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_provider_transactions_org_created
  ON public.billing_provider_transactions (organization_id, created_at DESC);

DROP TRIGGER IF EXISTS billing_provider_transactions_set_updated_at
  ON public.billing_provider_transactions;
CREATE TRIGGER billing_provider_transactions_set_updated_at
  BEFORE UPDATE ON public.billing_provider_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.billing_provider_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS billing_provider_transactions_select_own_org
  ON public.billing_provider_transactions;
CREATE POLICY billing_provider_transactions_select_own_org
  ON public.billing_provider_transactions
  FOR SELECT
  TO authenticated
  USING (organization_id = public.current_organization_id());

GRANT SELECT ON public.billing_provider_transactions TO authenticated;
GRANT ALL ON TABLE public.billing_provider_transactions TO service_role;

-- ---------------------------------------------------------------------------
-- Rollback notes (manual — do not auto-run)
-- DO NOT UNCOMMENT: historical reference only — see Build Bible V2 Chapter 1
-- non-negotiables (no destructive Stripe archive cleanup in production).
-- ---------------------------------------------------------------------------
-- 1. DROP TABLE IF EXISTS public.billing_provider_transactions;
-- 2. DROP TABLE IF EXISTS public.paddle_webhook_events;
-- 3. ALTER TABLE public.organization_subscriptions
--      DROP COLUMN IF EXISTS sync_pending,
--      DROP COLUMN IF EXISTS provider_status,
--      DROP COLUMN IF EXISTS provider_price_id,
--      DROP COLUMN IF EXISTS provider_subscription_id,
--      DROP COLUMN IF EXISTS provider_customer_id,
--      DROP COLUMN IF EXISTS billing_provider;
-- Stripe columns and customer_invoices rows remain untouched.
