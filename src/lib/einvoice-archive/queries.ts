import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import { filterEInvoiceArchiveRecords } from "@/lib/einvoice-archive/search";
import { mapEInvoiceArchiveRow, type EInvoiceArchiveArtifactRow } from "@/lib/einvoice-archive/row-map";
import type { EInvoiceArchiveRecord, EInvoiceArchiveSearchQuery } from "@/lib/einvoice-archive/types";
import { canAccessEInvoiceArchive } from "@/lib/einvoice-archive/authorization";

export async function listEInvoiceArchivesForSession(
  session: SessionContext,
  query: EInvoiceArchiveSearchQuery,
): Promise<{ ok: true; records: EInvoiceArchiveRecord[] } | { ok: false; message: string }> {
  if (!canAccessEInvoiceArchive(session)) {
    return { ok: false, message: "Unauthorized." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("einvoice_archive_artifacts")
    .select("*")
    .eq("organization_id", session.organization.id)
    .order("archived_at", { ascending: false });

  if (error) {
    return { ok: false, message: "E-invoice archive is not available in this environment." };
  }

  const records = (data ?? []).map((row) => mapEInvoiceArchiveRow(row as EInvoiceArchiveArtifactRow));
  return { ok: true, records: filterEInvoiceArchiveRecords(records, query) };
}

export async function getEInvoiceArchiveForSession(
  session: SessionContext,
  archiveId: string,
): Promise<EInvoiceArchiveRecord | null> {
  if (!canAccessEInvoiceArchive(session)) {
    return null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("einvoice_archive_artifacts")
    .select("*")
    .eq("organization_id", session.organization.id)
    .eq("id", archiveId)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  return mapEInvoiceArchiveRow(data as EInvoiceArchiveArtifactRow);
}
