import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { insertRows, updateRows } from "@/lib/supabase/typed";
import type { TablesUpdate } from "@/types/database";
import { copyBytes } from "@/lib/einvoice-archive/hash";
import { EINVOICE_ARCHIVE_BUCKET, type EInvoiceArchiveRecord } from "@/lib/einvoice-archive/types";
import type {
  ArchiveAuditPort,
  ArchiveMetadataStorePort,
  ArchiveObjectStorePort,
  EInvoiceArchivePorts,
  PutIfAbsentResult,
} from "@/lib/einvoice-archive/ports";
import { recordAuditEvent } from "@/lib/audit/events";
import { mapEInvoiceArchiveRow, type EInvoiceArchiveArtifactRow } from "@/lib/einvoice-archive/row-map";

export class SupabaseArchiveObjectStore implements ArchiveObjectStorePort {
  async putIfAbsent(key: string, bytes: Uint8Array, contentType: string): Promise<PutIfAbsentResult> {
    const admin = createAdminClient();
    const payload = Buffer.from(bytes);
    const { error } = await admin.storage.from(EINVOICE_ARCHIVE_BUCKET).upload(key, payload, {
      upsert: false,
      contentType,
      cacheControl: "private, max-age=31536000, immutable",
    });
    if (!error) {
      return { ok: true, created: true };
    }
    if (error.message.toLowerCase().includes("already exists") || error.message.includes("Duplicate")) {
      return { ok: true, created: false };
    }
    return { ok: false, code: "STORAGE_FAILED", message: "Unable to store archive artifact." };
  }

  async get(key: string): Promise<Uint8Array | null> {
    const admin = createAdminClient();
    const { data, error } = await admin.storage.from(EINVOICE_ARCHIVE_BUCKET).download(key);
    if (error || !data) {
      return null;
    }
    const buffer = Buffer.from(await data.arrayBuffer());
    return copyBytes(buffer);
  }
}

export class SupabaseArchiveMetadataStore implements ArchiveMetadataStorePort {
  async findByIdempotencyKey(input: {
    organizationId: string;
    salesInvoiceId: string;
    artifactKind: string;
    artifactProfileVersion: string;
  }): Promise<EInvoiceArchiveRecord | null> {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("einvoice_archive_artifacts")
      .select("*")
      .eq("organization_id", input.organizationId)
      .eq("sales_invoice_id", input.salesInvoiceId)
      .eq("artifact_kind", input.artifactKind)
      .eq("artifact_profile_version", input.artifactProfileVersion)
      .maybeSingle();
    if (error || !data) {
      return null;
    }
    return mapEInvoiceArchiveRow(data as EInvoiceArchiveArtifactRow);
  }

  async findById(input: {
    organizationId: string;
    id: string;
  }): Promise<EInvoiceArchiveRecord | null> {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("einvoice_archive_artifacts")
      .select("*")
      .eq("organization_id", input.organizationId)
      .eq("id", input.id)
      .maybeSingle();
    if (error || !data) {
      return null;
    }
    return mapEInvoiceArchiveRow(data as EInvoiceArchiveArtifactRow);
  }

  async insert(record: EInvoiceArchiveRecord) {
    const admin = createAdminClient();
    const payload = {
      id: record.id,
      organization_id: record.organizationId,
      sales_invoice_id: record.salesInvoiceId,
      invoice_number_snapshot: record.invoiceNumberSnapshot,
      buyer_name_snapshot: record.buyerNameSnapshot,
      document_type: record.documentType,
      format: record.format,
      profile: record.profile,
      standard_version: record.standardVersion,
      artifact_kind: record.artifactKind,
      artifact_profile_version: record.artifactProfileVersion,
      artifact_storage_key: record.artifactStorageKey,
      artifact_sha256: record.artifactSha256,
      artifact_size_bytes: record.artifactSizeBytes,
      currency_snapshot: record.currencySnapshot,
      gross_amount_minor_snapshot: record.grossAmountMinorSnapshot,
      issue_date_snapshot: record.issueDateSnapshot,
      issue_year: record.issueYear,
      seller_country_snapshot: record.sellerCountrySnapshot,
      buyer_country_snapshot: record.buyerCountrySnapshot,
      tax_treatment_snapshot: record.taxTreatmentSnapshot,
      archived_at: record.archivedAt,
      created_at: record.createdAt,
      retention_policy_id: record.retention.policyId,
      retention_policy_version: record.retention.policyVersion,
      retention_legal_basis: record.retention.legalBasis,
      retention_jurisdiction: record.retention.jurisdiction,
      retention_duration_years: record.retention.durationYears,
      retention_start_at: record.retention.startAt,
      retention_start_basis: record.retention.startBasis,
      retain_until: record.retention.retainUntil,
      legal_hold: record.legalHold,
      legal_hold_reason: record.legalHoldReason,
      legal_hold_updated_at: record.legalHoldUpdatedAt,
      integrity_status: record.integrityStatus,
      last_verified_at: record.lastVerifiedAt,
      last_verification_error_code: record.lastVerificationErrorCode,
      generator_module: record.generator.module,
      generator_pipeline: record.generator.pipeline,
      generator_standard_version: record.generator.standardVersion,
      validation_status: record.validationStatus,
    };
    const { error } = await insertRows(admin, "einvoice_archive_artifacts", payload);
    if (!error) {
      return { ok: true as const, record };
    }
    if (error.code === "23505") {
      return { ok: false as const, code: "UNIQUE_CONFLICT" as const, message: error.message };
    }
    return { ok: false as const, code: "METADATA_FAILED" as const, message: "Unable to persist archive metadata." };
  }

  async updateOperational(input: {
    organizationId: string;
    id: string;
    patch: {
      integrityStatus?: EInvoiceArchiveRecord["integrityStatus"];
      lastVerifiedAt?: string | null;
      lastVerificationErrorCode?: string | null;
      legalHold?: boolean;
      legalHoldReason?: string | null;
      legalHoldUpdatedAt?: string | null;
    };
  }) {
    const admin = createAdminClient();
    const patch: TablesUpdate<"einvoice_archive_artifacts"> = {};
    if (input.patch.integrityStatus !== undefined) {
      patch.integrity_status = input.patch.integrityStatus;
    }
    if (input.patch.lastVerifiedAt !== undefined) {
      patch.last_verified_at = input.patch.lastVerifiedAt;
    }
    if (input.patch.lastVerificationErrorCode !== undefined) {
      patch.last_verification_error_code = input.patch.lastVerificationErrorCode;
    }
    if (input.patch.legalHold !== undefined) {
      patch.legal_hold = input.patch.legalHold;
    }
    if (input.patch.legalHoldReason !== undefined) {
      patch.legal_hold_reason = input.patch.legalHoldReason;
    }
    if (input.patch.legalHoldUpdatedAt !== undefined) {
      patch.legal_hold_updated_at = input.patch.legalHoldUpdatedAt;
    }
    const { error } = await updateRows(admin, "einvoice_archive_artifacts", patch).eq("id", input.id).eq(
      "organization_id",
      input.organizationId,
    );
    if (error) {
      return { ok: false as const, message: "Unable to update operational archive metadata." };
    }
    return { ok: true as const };
  }

  async list(input: { organizationId: string }): Promise<EInvoiceArchiveRecord[]> {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("einvoice_archive_artifacts")
      .select("*")
      .eq("organization_id", input.organizationId)
      .order("archived_at", { ascending: false });
    if (error || !data) {
      return [];
    }
    return data.map((row) => mapEInvoiceArchiveRow(row as EInvoiceArchiveArtifactRow));
  }
}

export const supabaseArchiveAudit: ArchiveAuditPort = {
  async emit(input) {
    await recordAuditEvent({
      organizationId: input.organizationId,
      userId: input.userId ?? null,
      entityType: "einvoice_archive_artifact",
      entityId: input.entityId,
      eventType: input.eventType,
      severity: input.severity ?? "info",
      source: "einvoice_archive",
      metadata: input.metadata ?? {},
    });
  },
};

export function createProductionArchivePorts(): EInvoiceArchivePorts {
  return {
    objects: new SupabaseArchiveObjectStore(),
    metadata: new SupabaseArchiveMetadataStore(),
    invoices: {
      async findIssued() {
        return null;
      },
    },
    audit: supabaseArchiveAudit,
  };
}
