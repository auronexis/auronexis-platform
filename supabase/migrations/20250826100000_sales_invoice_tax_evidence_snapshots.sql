-- Additive: immutable seller + tax decision evidence on sales invoices.
-- Non-destructive. Do NOT apply against Production from this engineering task.

ALTER TABLE public.sales_invoices
  ADD COLUMN IF NOT EXISTS seller_snapshot jsonb;

ALTER TABLE public.sales_invoices
  ADD COLUMN IF NOT EXISTS tax_decision_evidence jsonb;

ALTER TABLE public.sales_invoices
  ADD COLUMN IF NOT EXISTS reverse_charge_applied boolean NOT NULL DEFAULT false;

ALTER TABLE public.sales_invoices
  ADD COLUMN IF NOT EXISTS business_classification text;

COMMENT ON COLUMN public.sales_invoices.seller_snapshot IS
  'Immutable seller identity at issue time. Issued invoices must not re-read mutable company settings.';
COMMENT ON COLUMN public.sales_invoices.tax_decision_evidence IS
  'Immutable tax decision evidence snapshot (tax-decision-evidence-v1).';
COMMENT ON COLUMN public.sales_invoices.reverse_charge_applied IS
  'True only when tax_policy_outcome is REVERSE_CHARGE at issue time.';
COMMENT ON COLUMN public.sales_invoices.business_classification IS
  'B2B relationship class at issue (DOMESTIC_B2B / EU_CROSS_BORDER_B2B_CANDIDATE / NON_EU_B2B / REVIEW_REQUIRED).';
