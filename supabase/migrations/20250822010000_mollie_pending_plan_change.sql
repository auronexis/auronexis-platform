-- Mollie Phase 4 recovery: pending plan-change fields for organization_subscriptions.
-- Authoritative current plan remains provider_price_id until provider-confirmed apply.
-- No secrets. Additive only. RLS unchanged (same table policies).

ALTER TABLE public.organization_subscriptions
  ADD COLUMN IF NOT EXISTS pending_plan TEXT,
  ADD COLUMN IF NOT EXISTS pending_plan_effective_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pending_plan_change_type TEXT,
  ADD COLUMN IF NOT EXISTS provider_change_reference TEXT;

ALTER TABLE public.organization_subscriptions
  DROP CONSTRAINT IF EXISTS organization_subscriptions_pending_plan_change_type_check;

ALTER TABLE public.organization_subscriptions
  ADD CONSTRAINT organization_subscriptions_pending_plan_change_type_check
  CHECK (
    pending_plan_change_type IS NULL
    OR pending_plan_change_type IN ('upgrade', 'downgrade')
  );

CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_pending_plan
  ON public.organization_subscriptions (pending_plan)
  WHERE pending_plan IS NOT NULL;

COMMENT ON COLUMN public.organization_subscriptions.pending_plan IS
  'Scheduled Mollie/FastSpring plan key; not authoritative for entitlements until applied.';
COMMENT ON COLUMN public.organization_subscriptions.pending_plan_effective_at IS
  'Expected effective time (e.g. Mollie nextPaymentDate); informational until provider confirms.';
COMMENT ON COLUMN public.organization_subscriptions.pending_plan_change_type IS
  'upgrade | downgrade when pending_plan is set.';
COMMENT ON COLUMN public.organization_subscriptions.provider_change_reference IS
  'Provider reference for the scheduled change (e.g. Mollie sub_ id). Never stores secrets.';
