-- Final legacy billing database quarantine (forward-only, idempotent).
-- Preserves billing_provider + audit ids; never renames legacy rows to mollie.
-- Operator must run pre/post verification SQL in docs/final-legacy-billing-database-eradication.md

ALTER TABLE public.organization_subscriptions
  ADD COLUMN IF NOT EXISTS legacy_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS legacy_archived_at timestamptz NULL;

COMMENT ON COLUMN public.organization_subscriptions.legacy_archived IS
  'When true, row is historical audit-only — never drives entitlements, checkout, or reconciliation.';
COMMENT ON COLUMN public.organization_subscriptions.legacy_archived_at IS
  'Timestamp when legacy row was quarantined for audit retention.';

-- Pre-condition (operator): count legacy rows with billable status before apply.
-- SELECT billing_provider, status, provider_status, COUNT(*)
-- FROM public.organization_subscriptions
-- WHERE billing_provider IN ('stripe', 'paddle', 'fastspring')
-- GROUP BY 1, 2, 3;

UPDATE public.organization_subscriptions
SET
  legacy_archived = true,
  legacy_archived_at = COALESCE(legacy_archived_at, NOW()),
  status = CASE
    WHEN status IN ('active', 'trialing', 'past_due', 'unpaid', 'incomplete', 'processing', 'pending')
      THEN 'inactive'
    ELSE status
  END,
  provider_status = CASE
    WHEN billing_provider IN ('stripe', 'paddle', 'fastspring')
      AND COALESCE(provider_status, status) IN (
        'active', 'trialing', 'past_due', 'unpaid', 'incomplete', 'processing', 'pending'
      )
      THEN 'legacy_quarantined'
    WHEN billing_provider IN ('stripe', 'paddle', 'fastspring')
      AND provider_status IS NULL
      THEN 'legacy_quarantined'
    ELSE provider_status
  END,
  sync_pending = false,
  pending_plan = NULL,
  pending_plan_effective_at = NULL,
  pending_plan_change_type = NULL,
  provider_change_reference = NULL,
  upgrade_payment_id = NULL,
  upgrade_target_plan = NULL,
  updated_at = NOW()
WHERE billing_provider IN ('stripe', 'paddle', 'fastspring')
  AND legacy_archived = false;

-- Future writes: only Mollie may hold billable authority; legacy rows stay archived.
ALTER TABLE public.organization_subscriptions
  DROP CONSTRAINT IF EXISTS organization_subscriptions_legacy_authority_check;

ALTER TABLE public.organization_subscriptions
  ADD CONSTRAINT organization_subscriptions_legacy_authority_check
  CHECK (
    billing_provider = 'mollie'
    OR (
      legacy_archived = true
      AND status NOT IN ('active', 'trialing', 'past_due', 'unpaid', 'incomplete', 'processing', 'pending')
    )
  );

CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_mollie_authority
  ON public.organization_subscriptions (organization_id)
  WHERE billing_provider = 'mollie' AND legacy_archived = false;

-- Post-condition (operator):
-- SELECT billing_provider, legacy_archived, status, COUNT(*)
-- FROM public.organization_subscriptions
-- GROUP BY 1, 2, 3 ORDER BY 1, 2, 3;
--
-- Expect: zero rows where billing_provider <> 'mollie' AND legacy_archived = false;
-- Expect: zero rows where legacy_archived = true AND status IN ('active','trialing');
