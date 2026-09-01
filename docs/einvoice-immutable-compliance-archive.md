# E-Invoice Immutable Compliance Archive

Status: Implemented (local additive). Operator review required before any environment migration.

## Purpose

Additive compliance archive for validated e-invoice XML. One-way data flow:

`ISSUED INVOICE → CANONICAL E-INVOICE → VALIDATED ARTIFACT → ARCHIVE`

Archive never mutates billing. Billing never reads archive as a write-back source.

## Architecture

| Layer | Location |
| --- | --- |
| Schema + private bucket + RLS | `supabase/migrations/20260901120000_einvoice_immutable_compliance_archive.sql` |
| Domain service | `src/lib/einvoice-archive/**` |
| Protected UI | `/dashboard/compliance/einvoice-archive` |
| Authenticated download | `/dashboard/compliance/einvoice-archive/[id]/download` |
| Viewer | Existing `EInvoiceViewer` with `archived` label |

Write path is isolated (`archiveValidatedEInvoice`). Production invoice lookup is intentionally not wired. No hooks from Mollie webhooks, checkout, issuance, invoice email, or payment reconciliation.

Generator module `src/lib/einvoice/**` is consumed read-only (demo/tests). Semantics unchanged.

## Security

- Dashboard routes require session + `settings.write` (`canAccessEInvoiceArchive`).
- Table RLS: owner/admin SELECT within `current_organization_id()` only.
- Authenticated grants: SELECT only. No INSERT/UPDATE/DELETE for tenant roles.
- Private bucket `einvoice-archive` (`public=false`). No public URLs.
- Storage SELECT limited to `tenant/<org-id>/...` for owner/admin.
- Download streams original bytes after auth. No long-lived public signed URLs.

## Immutability

- Trigger blocks DELETE and UPDATE of evidence fields.
- Operational updates only: integrity verification timestamps/status, legal hold fields.
- Storage uploads use `upsert: false`. Application code has no remove/overwrite path.
- Idempotency unique key: `(organization_id, sales_invoice_id, artifact_kind, artifact_profile_version)`.
- Same bytes → reuse. Different hash for same key → fail closed (`INTEGRITY_CONFLICT`).

## Hash / original bytes

- Archive stores exact original XML bytes.
- No parse-regenerate, whitespace normalize, pretty-print, or encoding rewrite for storage.
- `artifact_sha256 = SHA-256(original bytes)`.
- Download must match that digest; mismatches surface integrity failure (no silent repair).

## Retention

Policy id `de_ustg_14b_vat_invoice_records` v`2026.1`:

- German VAT invoice records under **UStG §14b** are generally retained for **8 years**.
- Stored as explicit metadata (`retention_*`, `retain_until`).
- Not a hard-coded “German invoices must always be kept for 10 years” rule.
- **Expired ≠ destroy.** No cron deletion, no lifecycle destroy, no automatic purge.

## Recovery

If object storage succeeds and metadata insert fails, the write is not reported as ARCHIVED. Orphan objects under the deterministic key may remain; retry with identical bytes is safe (`putIfAbsent` + idempotent metadata). Different bytes for the same invoice key remain fail-closed.

## Tax audit export

`buildTaxAuditExportManifest` is a foundation service boundary only (`NOT_FINANZAMT_SUBMISSION`). No public endpoint.

## Future wiring / disposal boundaries

- Future: operator-approved archive job may read issued invoices and call `archiveValidatedEInvoice` after generator validation — still never reverse-write billing.
- Future disposal: separate legal/process chapter. This module must not gain auto-delete.

## Demo proof

Synthetic artifacts in `artifacts/einvoice-archive-proof/`:

- `TEST-EINV-2026-000001`
- `TEST-EINV-RC-2026-000001`

Generate:

`node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs scripts/generate-einvoice-archive-proof.mjs`

## Tests

`npm run test:einvoice-archive` — cases A–T (archive, integrity, tenancy, freezes, retention, export foundation).
