-- Additive: immutable buyer address / billing-email snapshot on sales invoices.
-- Non-destructive. Preserves pre-snapshot invoices (new columns remain NULL).
-- Do NOT apply against Production from this engineering task without operator approval.

ALTER TABLE public.sales_invoices
  ADD COLUMN IF NOT EXISTS buyer_address_line1 text;

ALTER TABLE public.sales_invoices
  ADD COLUMN IF NOT EXISTS buyer_address_line2 text;

ALTER TABLE public.sales_invoices
  ADD COLUMN IF NOT EXISTS buyer_postal_code text;

ALTER TABLE public.sales_invoices
  ADD COLUMN IF NOT EXISTS buyer_city text;

ALTER TABLE public.sales_invoices
  ADD COLUMN IF NOT EXISTS buyer_billing_email text;

COMMENT ON COLUMN public.sales_invoices.buyer_address_line1 IS
  'Immutable buyer street/address line 1 at issue time. Do not backfill from live org identity.';
COMMENT ON COLUMN public.sales_invoices.buyer_address_line2 IS
  'Immutable buyer address line 2 at issue time.';
COMMENT ON COLUMN public.sales_invoices.buyer_postal_code IS
  'Immutable buyer postal code at issue time.';
COMMENT ON COLUMN public.sales_invoices.buyer_city IS
  'Immutable buyer city at issue time.';
COMMENT ON COLUMN public.sales_invoices.buyer_billing_email IS
  'Immutable buyer billing/contact email at issue time.';
