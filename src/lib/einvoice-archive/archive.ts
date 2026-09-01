/**
 * Isolated e-invoice archive write/read/verify path.
 * One-way: issued invoice + original XML bytes → validated artifact → archive.
 * Never mutates billing. Never regenerates XML.
 */

import { randomUUID } from "node:crypto";
import { adaptIssuedInvoiceToCanonical, validateEInvoice } from "@/lib/einvoice";
import { bytesEqual, copyBytes, sha256Hex } from "@/lib/einvoice-archive/hash";
import {
  EINVOICE_ARCHIVE_ARTIFACT_KIND,
  EINVOICE_ARCHIVE_AUDIT_EVENTS,
  EINVOICE_ARCHIVE_DOCUMENT_TYPE,
  EINVOICE_ARCHIVE_FORMAT,
  EINVOICE_ARCHIVE_PROFILE,
  EINVOICE_ARCHIVE_PROFILE_VERSION,
  EINVOICE_ARCHIVE_STANDARD_VERSION,
  type ArchiveEInvoiceInput,
  type ArchiveEInvoiceResult,
  type EInvoiceArchiveIntegrityStatus,
  type EInvoiceArchiveRecord,
} from "@/lib/einvoice-archive/types";
import type { EInvoiceArchivePorts } from "@/lib/einvoice-archive/ports";
import { buildDeUstg14bRetentionPolicy, resolveIssueCalendarYear } from "@/lib/einvoice-archive/retention-policy";
import { buildEInvoiceArchiveStorageKey } from "@/lib/einvoice-archive/storage-path";
import { buildArchivedEInvoiceDownloadFilename } from "@/lib/einvoice-archive/filename";

const XML_CONTENT_TYPE = "application/xml";

function decodeOriginalXmlUtf8(bytes: Uint8Array): { ok: true; xml: string } | { ok: false } {
  try {
    const xml = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, xml };
  } catch {
    return { ok: false };
  }
}

function issueDateOnly(iso: string | null): string | null {
  if (!iso) return null;
  const day = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

export function toDownloadPayload(record: EInvoiceArchiveRecord, bytes: Uint8Array): {
  bytes: Uint8Array;
  filename: string;
  contentType: string;
} {
  return {
    bytes,
    filename: buildArchivedEInvoiceDownloadFilename({
      invoiceNumber: record.invoiceNumberSnapshot,
      sha256Hex: record.artifactSha256,
    }),
    contentType: XML_CONTENT_TYPE,
  };
}

async function emitAudit(
  ports: EInvoiceArchivePorts,
  input: {
    organizationId: string;
    userId?: string | null;
    entityId: string;
    eventType: string;
    severity?: "info" | "low" | "medium" | "high" | "critical";
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  if (!ports.audit) return;
  await ports.audit.emit({
    organizationId: input.organizationId,
    userId: input.userId ?? null,
    entityId: input.entityId,
    eventType: input.eventType,
    severity: input.severity,
    metadata: {
      artifact_kind: EINVOICE_ARCHIVE_ARTIFACT_KIND,
      ...input.metadata,
    },
  });
}

export async function archiveValidatedEInvoice(
  input: ArchiveEInvoiceInput,
  ports: EInvoiceArchivePorts,
): Promise<ArchiveEInvoiceResult> {
  if (!input.actorOrganizationId) {
    return { ok: false, code: "UNAUTHORIZED", message: "Organization context required." };
  }
  if (!input.xmlBytes || input.xmlBytes.byteLength === 0) {
    return { ok: false, code: "EMPTY_ARTIFACT", message: "Archive requires original XML bytes." };
  }

  const invoice = await ports.invoices.findIssued({
    organizationId: input.actorOrganizationId,
    salesInvoiceId: input.salesInvoiceId,
  });
  if (!invoice) {
    return { ok: false, code: "INVOICE_NOT_FOUND", message: "Issued invoice not found." };
  }
  if (invoice.organizationId !== input.actorOrganizationId) {
    return { ok: false, code: "TENANT_MISMATCH", message: "Invoice does not belong to this organization." };
  }
  if (invoice.status !== "issued") {
    return { ok: false, code: "NOT_ISSUED", message: "Only issued invoices may be archived." };
  }

  const decoded = decodeOriginalXmlUtf8(input.xmlBytes);
  if (!decoded.ok) {
    return { ok: false, code: "INVALID_UTF8", message: "Original bytes are not valid UTF-8 XML." };
  }

  const adapted = adaptIssuedInvoiceToCanonical(invoice.issuedSnapshot);
  if (!adapted.ok) {
    return { ok: false, code: "VALIDATION_FAILED", message: adapted.message };
  }
  const validation = validateEInvoice({ canonical: adapted.input, xml: decoded.xml });
  if (validation.status !== "VALID") {
    return { ok: false, code: "VALIDATION_FAILED", message: "E-invoice validation failed; archive refused." };
  }

  const originalBytes = copyBytes(input.xmlBytes);
  const digest = sha256Hex(originalBytes);
  const now = input.now ?? new Date();
  const archivedAt = now.toISOString();
  const issueDate = issueDateOnly(invoice.issueDateIso);
  const issueYear = resolveIssueCalendarYear(invoice.issueDateIso, now);
  const retention = buildDeUstg14bRetentionPolicy({
    issueDateIso: invoice.issueDateIso,
    archivedAt: now,
  });
  const storageKey = buildEInvoiceArchiveStorageKey({
    organizationId: invoice.organizationId,
    issueYear,
    salesInvoiceId: invoice.salesInvoiceId,
    sha256Hex: digest,
  });

  const existing = await ports.metadata.findByIdempotencyKey({
    organizationId: invoice.organizationId,
    salesInvoiceId: invoice.salesInvoiceId,
    artifactKind: EINVOICE_ARCHIVE_ARTIFACT_KIND,
    artifactProfileVersion: EINVOICE_ARCHIVE_PROFILE_VERSION,
  });

  if (existing) {
    if (existing.artifactSha256 !== digest) {
      await emitAudit(ports, {
        organizationId: invoice.organizationId,
        userId: input.actorUserId,
        entityId: existing.id,
        eventType: EINVOICE_ARCHIVE_AUDIT_EVENTS.integrityFailed,
        severity: "high",
        metadata: { reason: "idempotency_hash_conflict" },
      });
      return {
        ok: false,
        code: "INTEGRITY_CONFLICT",
        message: "An archive already exists for this invoice with different original bytes.",
      };
    }
    return { ok: true, reused: true, record: existing };
  }

  const put = await ports.objects.putIfAbsent(storageKey, originalBytes, XML_CONTENT_TYPE);
  if (!put.ok) {
    return { ok: false, code: "STORAGE_FAILED", message: put.message };
  }

  const stored = await ports.objects.get(storageKey);
  if (!stored || !bytesEqual(stored, originalBytes) || sha256Hex(stored) !== digest) {
    await emitAudit(ports, {
      organizationId: invoice.organizationId,
      userId: input.actorUserId,
      entityId: invoice.salesInvoiceId,
      eventType: EINVOICE_ARCHIVE_AUDIT_EVENTS.integrityFailed,
      severity: "high",
      metadata: { reason: "storage_hash_mismatch" },
    });
    return {
      ok: false,
      code: "HASH_MISMATCH",
      message: "Stored artifact bytes do not match the original SHA-256.",
    };
  }

  const record: EInvoiceArchiveRecord = {
    id: randomUUID(),
    organizationId: invoice.organizationId,
    salesInvoiceId: invoice.salesInvoiceId,
    invoiceNumberSnapshot: invoice.invoiceNumber,
    buyerNameSnapshot: invoice.buyerLegalName,
    documentType: EINVOICE_ARCHIVE_DOCUMENT_TYPE,
    format: EINVOICE_ARCHIVE_FORMAT,
    profile: EINVOICE_ARCHIVE_PROFILE,
    standardVersion: EINVOICE_ARCHIVE_STANDARD_VERSION,
    artifactKind: EINVOICE_ARCHIVE_ARTIFACT_KIND,
    artifactProfileVersion: EINVOICE_ARCHIVE_PROFILE_VERSION,
    artifactStorageKey: storageKey,
    artifactSha256: digest,
    artifactSizeBytes: originalBytes.byteLength,
    currencySnapshot: invoice.currency,
    grossAmountMinorSnapshot: invoice.grossMinor,
    issueDateSnapshot: issueDate,
    issueYear,
    sellerCountrySnapshot: invoice.sellerCountry,
    buyerCountrySnapshot: invoice.buyerCountry,
    taxTreatmentSnapshot: invoice.taxPolicyOutcome,
    archivedAt,
    createdAt: archivedAt,
    retention,
    legalHold: false,
    legalHoldReason: null,
    legalHoldUpdatedAt: null,
    integrityStatus: "stored",
    lastVerifiedAt: archivedAt,
    lastVerificationErrorCode: null,
    generator: input.generator,
    validationStatus: validation.status,
  };

  const inserted = await ports.metadata.insert(record);
  if (!inserted.ok) {
    if (inserted.code === "UNIQUE_CONFLICT") {
      const raced = await ports.metadata.findByIdempotencyKey({
        organizationId: invoice.organizationId,
        salesInvoiceId: invoice.salesInvoiceId,
        artifactKind: EINVOICE_ARCHIVE_ARTIFACT_KIND,
        artifactProfileVersion: EINVOICE_ARCHIVE_PROFILE_VERSION,
      });
      if (raced && raced.artifactSha256 === digest) {
        return { ok: true, reused: true, record: raced };
      }
      return {
        ok: false,
        code: "INTEGRITY_CONFLICT",
        message: "An archive already exists for this invoice with different original bytes.",
      };
    }
    return { ok: false, code: "METADATA_FAILED", message: inserted.message };
  }

  await emitAudit(ports, {
    organizationId: invoice.organizationId,
    userId: input.actorUserId,
    entityId: inserted.record.id,
    eventType: EINVOICE_ARCHIVE_AUDIT_EVENTS.archived,
    metadata: {
      invoice_number_present: true,
      artifact_size_bytes: inserted.record.artifactSizeBytes,
      reused: false,
    },
  });

  return { ok: true, reused: false, record: inserted.record };
}

export async function readArchivedOriginalBytes(
  input: { organizationId: string; archiveId: string },
  ports: EInvoiceArchivePorts,
): Promise<
  | { ok: true; record: EInvoiceArchiveRecord; bytes: Uint8Array }
  | { ok: false; code: "NOT_FOUND" | "HASH_MISMATCH" | "STORAGE_FAILED"; message: string }
> {
  const record = await ports.metadata.findById({
    organizationId: input.organizationId,
    id: input.archiveId,
  });
  if (!record || record.organizationId !== input.organizationId) {
    return { ok: false, code: "NOT_FOUND", message: "Archived e-invoice not found." };
  }
  const bytes = await ports.objects.get(record.artifactStorageKey);
  if (!bytes) {
    return { ok: false, code: "STORAGE_FAILED", message: "Archived artifact object is missing." };
  }
  if (sha256Hex(bytes) !== record.artifactSha256 || bytes.byteLength !== record.artifactSizeBytes) {
    return { ok: false, code: "HASH_MISMATCH", message: "Archived artifact failed integrity verification." };
  }
  return { ok: true, record, bytes };
}

export async function verifyArchivedEInvoiceIntegrity(
  input: { organizationId: string; archiveId: string; actorUserId?: string | null },
  ports: EInvoiceArchivePorts,
): Promise<
  | { ok: true; status: EInvoiceArchiveIntegrityStatus; record: EInvoiceArchiveRecord }
  | { ok: false; code: "NOT_FOUND" | "HASH_MISMATCH" | "STORAGE_FAILED" | "METADATA_FAILED"; message: string }
> {
  const read = await readArchivedOriginalBytes(input, ports);
  const nowIso = new Date().toISOString();
  if (!read.ok) {
    if (read.code === "HASH_MISMATCH" || read.code === "STORAGE_FAILED") {
      const existing = await ports.metadata.findById({
        organizationId: input.organizationId,
        id: input.archiveId,
      });
      if (existing) {
        await ports.metadata.updateOperational({
          organizationId: input.organizationId,
          id: existing.id,
          patch: {
            integrityStatus: "failed",
            lastVerifiedAt: nowIso,
            lastVerificationErrorCode: read.code,
          },
        });
        await emitAudit(ports, {
          organizationId: input.organizationId,
          userId: input.actorUserId,
          entityId: existing.id,
          eventType: EINVOICE_ARCHIVE_AUDIT_EVENTS.integrityFailed,
          severity: "high",
          metadata: { reason: read.code.toLowerCase() },
        });
      }
    }
    return read;
  }

  const updated = await ports.metadata.updateOperational({
    organizationId: input.organizationId,
    id: read.record.id,
    patch: {
      integrityStatus: "verified",
      lastVerifiedAt: nowIso,
      lastVerificationErrorCode: null,
    },
  });
  if (!updated.ok) {
    return { ok: false, code: "METADATA_FAILED", message: updated.message };
  }

  const record = {
    ...read.record,
    integrityStatus: "verified" as const,
    lastVerifiedAt: nowIso,
    lastVerificationErrorCode: null,
  };

  await emitAudit(ports, {
    organizationId: input.organizationId,
    userId: input.actorUserId,
    entityId: record.id,
    eventType: EINVOICE_ARCHIVE_AUDIT_EVENTS.integrityVerified,
    metadata: { integrity_status: "verified" },
  });

  return { ok: true, status: "verified", record };
}

export async function loadArchivedEInvoiceForView(
  input: { organizationId: string; archiveId: string; actorUserId?: string | null },
  ports: EInvoiceArchivePorts,
): Promise<
  | { ok: true; record: EInvoiceArchiveRecord; bytes: Uint8Array; xml: string }
  | { ok: false; code: "NOT_FOUND" | "HASH_MISMATCH" | "STORAGE_FAILED" | "INVALID_UTF8"; message: string }
> {
  const read = await readArchivedOriginalBytes(input, ports);
  if (!read.ok) {
    if (read.code === "HASH_MISMATCH") {
      await emitAudit(ports, {
        organizationId: input.organizationId,
        userId: input.actorUserId,
        entityId: input.archiveId,
        eventType: EINVOICE_ARCHIVE_AUDIT_EVENTS.integrityFailed,
        severity: "high",
        metadata: { reason: "view_hash_mismatch" },
      });
    }
    return read;
  }
  const decoded = decodeOriginalXmlUtf8(read.bytes);
  if (!decoded.ok) {
    return { ok: false, code: "INVALID_UTF8", message: "Archived bytes are not valid UTF-8." };
  }
  await emitAudit(ports, {
    organizationId: input.organizationId,
    userId: input.actorUserId,
    entityId: read.record.id,
    eventType: EINVOICE_ARCHIVE_AUDIT_EVENTS.viewed,
    metadata: { surface: "archive_detail" },
  });
  return { ok: true, record: read.record, bytes: read.bytes, xml: decoded.xml };
}

export async function loadArchivedEInvoiceForDownload(
  input: { organizationId: string; archiveId: string; actorUserId?: string | null },
  ports: EInvoiceArchivePorts,
): Promise<
  | { ok: true; record: EInvoiceArchiveRecord; bytes: Uint8Array; filename: string; contentType: string }
  | { ok: false; code: "NOT_FOUND" | "HASH_MISMATCH" | "STORAGE_FAILED"; message: string }
> {
  const read = await readArchivedOriginalBytes(input, ports);
  if (!read.ok) {
    if (read.code === "HASH_MISMATCH") {
      await emitAudit(ports, {
        organizationId: input.organizationId,
        userId: input.actorUserId,
        entityId: input.archiveId,
        eventType: EINVOICE_ARCHIVE_AUDIT_EVENTS.integrityFailed,
        severity: "high",
        metadata: { reason: "download_hash_mismatch" },
      });
    }
    return read;
  }
  await emitAudit(ports, {
    organizationId: input.organizationId,
    userId: input.actorUserId,
    entityId: read.record.id,
    eventType: EINVOICE_ARCHIVE_AUDIT_EVENTS.downloaded,
    metadata: { surface: "archive_download" },
  });
  const payload = toDownloadPayload(read.record, read.bytes);
  return { ok: true, record: read.record, ...payload };
}
