-- FastSpring webhook foundation — additive, non-destructive
-- - Adds fastspring to billing_provider CHECKs (stripe/paddle retained)
-- - Creates fastspring_webhook_events idempotency ledger
-- Does NOT drop Stripe columns or alter Paddle runtime.

-- ---------------------------------------------------------------------------
-- Allow billing_provider = 'fastspring' (alongside stripe + paddle)
-- ---------------------------------------------------------------------------

ALTER TABLE public.organization_subscriptions
  DROP CONSTRAINT IF EXISTS organization_subscriptions_billing_provider_check;

ALTER TABLE public.organization_subscriptions
  ADD CONSTRAINT organization_subscriptions_billing_provider_check
  CHECK (billing_provider IN ('stripe', 'paddle', 'fastspring'));

ALTER TABLE public.billing_provider_transactions
  DROP CONSTRAINT IF EXISTS billing_provider_transactions_billing_provider_check;

-- Recreate CHECK if the prior constraint name differs; also handle inline CHECK.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.billing_provider_transactions'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%billing_provider%'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE public.billing_provider_transactions DROP CONSTRAINT ' || quote_ident(conname)
      FROM pg_constraint
      WHERE conrelid = 'public.billing_provider_transactions'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%billing_provider%'
      LIMIT 1
    );
  END IF;
END $$;

ALTER TABLE public.billing_provider_transactions
  ADD CONSTRAINT billing_provider_transactions_billing_provider_check
  CHECK (billing_provider IN ('stripe', 'paddle', 'fastspring'));

-- ---------------------------------------------------------------------------
-- FastSpring webhook event ledger (idempotent; not publicly writable)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.fastspring_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'fastspring',
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
  CONSTRAINT fastspring_webhook_events_provider_event_unique UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_fastspring_webhook_events_received_at
  ON public.fastspring_webhook_events (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_fastspring_webhook_events_org
  ON public.fastspring_webhook_events (organization_id)
  WHERE organization_id IS NOT NULL;

ALTER TABLE public.fastspring_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fastspring_webhook_events_select_owner_admin ON public.fastspring_webhook_events;
CREATE POLICY fastspring_webhook_events_select_owner_admin
  ON public.fastspring_webhook_events
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT SELECT ON public.fastspring_webhook_events TO authenticated;
GRANT ALL ON TABLE public.fastspring_webhook_events TO service_role;

COMMENT ON TABLE public.fastspring_webhook_events IS
  'FastSpring inbound webhook idempotency ledger. Service-role writes only.';
