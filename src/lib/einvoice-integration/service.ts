/**
 * Phase 10 integration service: issued sales_invoice → generate → validate → archive.
 * Never mutates billing. Never archives before validation. Never accepts caller XML.
 */

import "server-only";

import { TextEncoder } from "node:util";
import { generateEInvoiceFromIssuedSnapshot } from "@/lib/einvoice";
import { archiveValidatedEInvoice } from "@/lib/einvoice-archive";
import type { EInvoiceArchivePorts } from "@/lib/einvoice-archive/ports";
import {
  EINVOICE_INTEGRATION_GENERATOR,
  E_INVOICE_INTEGRATION_AUDIT_EVENTS,
  type EInvoiceIntegrationFailureCode,
  type EInvoiceIntegrationResult,
} from "@/lib/einvoice-integration/types";

function encodeXmlUtf8(xml: string): Uint8Array {
  return new TextEncoder().encode(xml);
}

function mapArchiveFailureCode(code: string): EInvoiceIntegrationFailureCode {
  switch (code) {
    case "UNAUTHORIZED":
    case "INVOICE_NOT_FOUND":
    case "NOT_ISSUED":
    case "VALIDATION_FAILED":
    case "INTEGRITY_CONFLICT":
    case "STORAGE_FAILED":
    case "METADATA_FAILED":
    case "HASH_MISMATCH":
      return code;
    default:
      return "UNEXPECTED";
  }
}

async function emitIntegrationFailure(input: {
  organizationId: string;
  salesInvoiceId: string;
  actorUserId?: string | null;
  code: EInvoiceIntegrationFailureCode;
  message: string;
}): Promise<void> {
  try {
    const { recordAuditEvent } = await import("@/lib/audit/events");
    await recordAuditEvent({
      organizationId: input.organizationId,
      userId: input.actorUserId ?? null,
      entityType: "sales_invoice",
      entityId: input.salesInvoiceId,
      eventType: E_INVOICE_INTEGRATION_AUDIT_EVENTS.integrationFailed,
      severity: input.code === "INTEGRITY_CONFLICT" ? "high" : "medium",
      source: "einvoice_integration",
      metadata: {
        failure_code: input.code,
        message: input.message,
      },
    });
  } catch {
    console.error("[einvoice-integration] failed to record integration failure audit", {
      salesInvoiceId: input.salesInvoiceId,
      code: input.code,
    });
  }
}

export async function archiveEInvoiceForIssuedSalesInvoice(input: {
  organizationId: string;
  salesInvoiceId: string;
  actorUserId?: string | null;
  ports?: EInvoiceArchivePorts;
}): Promise<EInvoiceIntegrationResult> {
  if (!input.organizationId?.trim() || !input.salesInvoiceId?.trim()) {
    return { ok: false, code: "UNAUTHORIZED", message: "Organization and invoice context required." };
  }

  const ports =
    input.ports ??
    (await import("@/lib/einvoice-integration/ports")).createIntegrationArchivePorts();
  const invoice = await ports.invoices.findIssued({
    organizationId: input.organizationId,
    salesInvoiceId: input.salesInvoiceId,
  });

  if (!invoice) {
    return {
      ok: false,
      code: "INVOICE_NOT_FOUND",
      message: "Issued invoice not found for this organization.",
    };
  }
  if (invoice.status !== "issued") {
    return { ok: false, code: "NOT_ISSUED", message: "Only issued invoices may be archived." };
  }

  const generated = generateEInvoiceFromIssuedSnapshot(invoice.issuedSnapshot);
  if (!generated.ok) {
    const code: EInvoiceIntegrationFailureCode =
      generated.code === "NOT_ISSUED" ? "NOT_ISSUED" : "UNSUPPORTED";
    const message = generated.message;
    await emitIntegrationFailure({
      organizationId: input.organizationId,
      salesInvoiceId: input.salesInvoiceId,
      actorUserId: input.actorUserId,
      code,
      message,
    });
    return { ok: false, code, message };
  }

  if (generated.validation.status !== "VALID") {
    const message = "E-invoice validation failed; archive refused.";
    await emitIntegrationFailure({
      organizationId: input.organizationId,
      salesInvoiceId: input.salesInvoiceId,
      actorUserId: input.actorUserId,
      code: "VALIDATION_FAILED",
      message,
    });
    return { ok: false, code: "VALIDATION_FAILED", message };
  }

  const xmlBytes = encodeXmlUtf8(generated.xml);
  const archived = await archiveValidatedEInvoice(
    {
      actorOrganizationId: input.organizationId,
      actorUserId: input.actorUserId,
      salesInvoiceId: input.salesInvoiceId,
      xmlBytes,
      generator: EINVOICE_INTEGRATION_GENERATOR,
    },
    ports,
  );

  if (!archived.ok) {
    const code = mapArchiveFailureCode(archived.code);
    await emitIntegrationFailure({
      organizationId: input.organizationId,
      salesInvoiceId: input.salesInvoiceId,
      actorUserId: input.actorUserId,
      code,
      message: archived.message,
    });
    return { ok: false, code, message: archived.message };
  }

  return {
    ok: true,
    reused: archived.reused,
    archiveId: archived.record.id,
    salesInvoiceId: input.salesInvoiceId,
  };
}
