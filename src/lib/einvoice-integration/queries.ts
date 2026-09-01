import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  EINVOICE_ARCHIVE_ARTIFACT_KIND,
  EINVOICE_ARCHIVE_PROFILE_VERSION,
  type EInvoiceArchiveRecord,
} from "@/lib/einvoice-archive/types";
import { mapEInvoiceArchiveRow, type EInvoiceArchiveArtifactRow } from "@/lib/einvoice-archive/row-map";

export async function findEInvoiceArchiveBySalesInvoiceId(input: {
  organizationId: string;
  salesInvoiceId: string;
}): Promise<EInvoiceArchiveRecord | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("einvoice_archive_artifacts")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("sales_invoice_id", input.salesInvoiceId)
    .eq("artifact_kind", EINVOICE_ARCHIVE_ARTIFACT_KIND)
    .eq("artifact_profile_version", EINVOICE_ARCHIVE_PROFILE_VERSION)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return mapEInvoiceArchiveRow(data as EInvoiceArchiveArtifactRow);
}

export async function listEInvoiceArchiveIdsBySalesInvoiceIds(input: {
  organizationId: string;
  salesInvoiceIds: string[];
}): Promise<Map<string, string>> {
  const ids = [...new Set(input.salesInvoiceIds.map((id) => id.trim()).filter(Boolean))];
  const result = new Map<string, string>();
  if (ids.length === 0) {
    return result;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("einvoice_archive_artifacts")
    .select("id, sales_invoice_id")
    .eq("organization_id", input.organizationId)
    .eq("artifact_kind", EINVOICE_ARCHIVE_ARTIFACT_KIND)
    .eq("artifact_profile_version", EINVOICE_ARCHIVE_PROFILE_VERSION)
    .in("sales_invoice_id", ids);

  if (error) {
    throw new Error(`Failed to map e-invoice archives: ${error.message}`);
  }

  for (const row of data ?? []) {
    const salesInvoiceId = (row as { sales_invoice_id?: string }).sales_invoice_id;
    const archiveId = (row as { id?: string }).id;
    if (salesInvoiceId && archiveId) {
      result.set(salesInvoiceId, archiveId);
    }
  }
  return result;
}
