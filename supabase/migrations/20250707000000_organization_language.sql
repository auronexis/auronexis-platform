-- Phase 28 — Organization language for billing and system communications

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'de'
  CHECK (language IN ('de', 'en'));

COMMENT ON COLUMN public.organizations.language IS
  'Organization locale for invoices, billing PDFs, billing emails, and future system communications.';
