-- Mollie Phase 4.1 Recovery V2: in-flight prorated upgrade payment tracking.
-- Authoritative plan remains provider_price_id until upgrade payment is confirmed.
-- Additive only. No secrets. RLS unchanged.

ALTER TABLE public.organization_subscriptions
  ADD COLUMN IF NOT EXISTS upgrade_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS upgrade_target_plan TEXT;

CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_upgrade_payment
  ON public.organization_subscriptions (upgrade_payment_id)
  WHERE upgrade_payment_id IS NOT NULL;

COMMENT ON COLUMN public.organization_subscriptions.upgrade_payment_id IS
  'In-flight Mollie tr_ id for prorated upgrade adjustment; cleared after paid webhook apply.';
COMMENT ON COLUMN public.organization_subscriptions.upgrade_target_plan IS
  'Target plan key for in-flight upgrade payment; not authoritative until payment confirmed.';
