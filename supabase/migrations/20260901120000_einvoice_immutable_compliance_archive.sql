-- Additive immutable e-invoice compliance archive.
-- Does not ALTER sales_invoices or any billing tables.
-- No automatic deletion and no storage destroy policies.
-- Expired retain_until is informational only.

CREATE TABLE IF NOT EXISTS public.einvoice_archive_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  sales_invoice_id UUID NOT NULL,
  invoice_number_snapshot TEXT NOT NULL,
  buyer_name_snapshot TEXT,
  document_type TEXT NOT NULL DEFAULT '380',
  format TEXT NOT NULL DEFAULT 'cii_xml',
  profile TEXT NOT NULL DEFAULT 'EN16931',
  standard_version TEXT NOT NULL DEFAULT 'zugferd-2.5.2',
  artifact_kind TEXT NOT NULL DEFAULT 'cii_xml',
  artifact_profile_version TEXT NOT NULL DEFAULT 'zugferd-2.5.2-en16931',
  artifact_storage_key TEXT NOT NULL,
  artifact_sha256 TEXT NOT NULL,
  artifact_size_bytes INTEGER NOT NULL,
  currency_snapshot TEXT NOT NULL,
  gross_amount_minor_snapshot INTEGER NOT NULL,
  issue_date_snapshot DATE,
  issue_year INTEGER,
  seller_country_snapshot TEXT,
  buyer_country_snapshot TEXT,
  tax_treatment_snapshot TEXT NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retention_policy_id TEXT NOT NULL,
  retention_policy_version TEXT NOT NULL,
  retention_legal_basis TEXT NOT NULL,
  retention_jurisdiction TEXT NOT NULL,
  retention_duration_years INTEGER NOT NULL,
  retention_start_at DATE NOT NULL,
  retention_start_basis TEXT NOT NULL,
  retain_until DATE NOT NULL,
  legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
  legal_hold_reason TEXT,
  legal_hold_updated_at TIMESTAMPTZ,
  integrity_status TEXT NOT NULL DEFAULT 'stored'
    CHECK (integrity_status IN ('stored', 'verified', 'failed')),
  last_verified_at TIMESTAMPTZ,
  last_verification_error_code TEXT,
  generator_module TEXT NOT NULL,
  generator_pipeline TEXT NOT NULL,
  generator_standard_version TEXT NOT NULL,
  validation_status TEXT NOT NULL,
  CONSTRAINT einvoice_archive_sha256_hex CHECK (artifact_sha256 ~ '^[a-f0-9]{64}$'),
  CONSTRAINT einvoice_archive_size_positive CHECK (artifact_size_bytes > 0),
  CONSTRAINT einvoice_archive_storage_key_unique UNIQUE (artifact_storage_key),
  CONSTRAINT einvoice_archive_idempotency UNIQUE (
    organization_id,
    sales_invoice_id,
    artifact_kind,
    artifact_profile_version
  )
);

COMMENT ON TABLE public.einvoice_archive_artifacts IS
  'Immutable e-invoice XML compliance archive. Expired retain_until is informational only — never destroyed by this module.';

COMMENT ON COLUMN public.einvoice_archive_artifacts.retention_legal_basis IS
  'Explicit policy metadata. German VAT invoice records under UStG §14b are generally retained for 8 years — not a hard-coded 10-year rule.';

COMMENT ON COLUMN public.einvoice_archive_artifacts.sales_invoice_id IS
  'Logical issued-invoice identifier. No FK to sales_invoices so billing schema stays untouched and archive evidence is not cascade-deleted.';

CREATE INDEX IF NOT EXISTS idx_einvoice_archive_org_archived
  ON public.einvoice_archive_artifacts (organization_id, archived_at DESC);

CREATE INDEX IF NOT EXISTS idx_einvoice_archive_org_invoice_number
  ON public.einvoice_archive_artifacts (organization_id, invoice_number_snapshot);

CREATE INDEX IF NOT EXISTS idx_einvoice_archive_org_issue_year
  ON public.einvoice_archive_artifacts (organization_id, issue_year);

CREATE INDEX IF NOT EXISTS idx_einvoice_archive_org_tax
  ON public.einvoice_archive_artifacts (organization_id, tax_treatment_snapshot);

CREATE INDEX IF NOT EXISTS idx_einvoice_archive_org_integrity
  ON public.einvoice_archive_artifacts (organization_id, integrity_status);

CREATE INDEX IF NOT EXISTS idx_einvoice_archive_org_buyer
  ON public.einvoice_archive_artifacts (organization_id, buyer_name_snapshot);

CREATE OR REPLACE FUNCTION public.einvoice_archive_protect_immutable()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'einvoice archive artifacts cannot be deleted';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.id IS DISTINCT FROM OLD.id
      OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
      OR NEW.sales_invoice_id IS DISTINCT FROM OLD.sales_invoice_id
      OR NEW.invoice_number_snapshot IS DISTINCT FROM OLD.invoice_number_snapshot
      OR NEW.buyer_name_snapshot IS DISTINCT FROM OLD.buyer_name_snapshot
      OR NEW.document_type IS DISTINCT FROM OLD.document_type
      OR NEW.format IS DISTINCT FROM OLD.format
      OR NEW.profile IS DISTINCT FROM OLD.profile
      OR NEW.standard_version IS DISTINCT FROM OLD.standard_version
      OR NEW.artifact_kind IS DISTINCT FROM OLD.artifact_kind
      OR NEW.artifact_profile_version IS DISTINCT FROM OLD.artifact_profile_version
      OR NEW.artifact_storage_key IS DISTINCT FROM OLD.artifact_storage_key
      OR NEW.artifact_sha256 IS DISTINCT FROM OLD.artifact_sha256
      OR NEW.artifact_size_bytes IS DISTINCT FROM OLD.artifact_size_bytes
      OR NEW.currency_snapshot IS DISTINCT FROM OLD.currency_snapshot
      OR NEW.gross_amount_minor_snapshot IS DISTINCT FROM OLD.gross_amount_minor_snapshot
      OR NEW.issue_date_snapshot IS DISTINCT FROM OLD.issue_date_snapshot
      OR NEW.issue_year IS DISTINCT FROM OLD.issue_year
      OR NEW.seller_country_snapshot IS DISTINCT FROM OLD.seller_country_snapshot
      OR NEW.buyer_country_snapshot IS DISTINCT FROM OLD.buyer_country_snapshot
      OR NEW.tax_treatment_snapshot IS DISTINCT FROM OLD.tax_treatment_snapshot
      OR NEW.archived_at IS DISTINCT FROM OLD.archived_at
      OR NEW.created_at IS DISTINCT FROM OLD.created_at
      OR NEW.retention_policy_id IS DISTINCT FROM OLD.retention_policy_id
      OR NEW.retention_policy_version IS DISTINCT FROM OLD.retention_policy_version
      OR NEW.retention_legal_basis IS DISTINCT FROM OLD.retention_legal_basis
      OR NEW.retention_jurisdiction IS DISTINCT FROM OLD.retention_jurisdiction
      OR NEW.retention_duration_years IS DISTINCT FROM OLD.retention_duration_years
      OR NEW.retention_start_at IS DISTINCT FROM OLD.retention_start_at
      OR NEW.retention_start_basis IS DISTINCT FROM OLD.retention_start_basis
      OR NEW.retain_until IS DISTINCT FROM OLD.retain_until
      OR NEW.generator_module IS DISTINCT FROM OLD.generator_module
      OR NEW.generator_pipeline IS DISTINCT FROM OLD.generator_pipeline
      OR NEW.generator_standard_version IS DISTINCT FROM OLD.generator_standard_version
      OR NEW.validation_status IS DISTINCT FROM OLD.validation_status
    THEN
      RAISE EXCEPTION 'einvoice archive immutable evidence fields cannot be updated';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS einvoice_archive_protect_immutable ON public.einvoice_archive_artifacts;
CREATE TRIGGER einvoice_archive_protect_immutable
  BEFORE UPDATE OR DELETE ON public.einvoice_archive_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.einvoice_archive_protect_immutable();

ALTER TABLE public.einvoice_archive_artifacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS einvoice_archive_select_owner_admin ON public.einvoice_archive_artifacts;
CREATE POLICY einvoice_archive_select_owner_admin
  ON public.einvoice_archive_artifacts FOR SELECT TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

REVOKE ALL ON TABLE public.einvoice_archive_artifacts FROM PUBLIC;
REVOKE ALL ON TABLE public.einvoice_archive_artifacts FROM authenticated;
GRANT SELECT ON TABLE public.einvoice_archive_artifacts TO authenticated;
GRANT ALL ON TABLE public.einvoice_archive_artifacts TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'einvoice-archive',
  'einvoice-archive',
  false,
  5242880,
  ARRAY['application/xml', 'text/xml']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Object key: tenant/<org-id>/year/<year>/<invoice-id>/<immutable-name>.xml
DROP POLICY IF EXISTS einvoice_archive_objects_select ON storage.objects;
CREATE POLICY einvoice_archive_objects_select
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'einvoice-archive'
    AND (storage.foldername(name))[1] = 'tenant'
    AND (storage.foldername(name))[2] = public.current_organization_id()::text
    AND public.current_user_role() IN ('owner', 'admin')
  );

-- No INSERT/UPDATE/DELETE policies for authenticated — writes are service-role only.
-- Absence of mutate policies is fail-closed for tenant roles.
