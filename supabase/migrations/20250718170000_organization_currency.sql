-- Workspace currency for organization financial display (Sales, Profitability, Reports)

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD'
  CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD'));

COMMENT ON COLUMN public.organizations.currency IS
  'Organization workspace currency for CRM, profitability, forecasts, and financial widgets. Independent of Paddle subscription charge currency.';
