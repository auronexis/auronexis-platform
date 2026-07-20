-- Build Bible V2 Chapter 5: named currency check (idempotent)
-- Complements 20250718170000_organization_currency.sql without destructive changes.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'currency'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'organizations_currency_check'
      AND conrelid = 'public.organizations'::regclass
  ) THEN
    ALTER TABLE public.organizations
      ADD CONSTRAINT organizations_currency_check
      CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD'));
  END IF;
END $$;
