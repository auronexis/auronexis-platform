import "server-only";

import { createAuditExport } from "@/lib/audit/exporter";
import { generateEvidenceSnapshot, serializeEvidenceSnapshot } from "@/lib/governance/evidence";
import type { AuditExportFormat, AuditSearchFilters } from "@/lib/compliance/types";
import type { SessionContext } from "@/lib/tenancy/context";

export async function exportAuditData(input: {
  session: SessionContext;
  format: AuditExportFormat;
  filters?: AuditSearchFilters;
}) {
  return createAuditExport({
    session: input.session,
    format: input.format,
    filters: input.filters ?? {},
  });
}

export async function exportEvidenceBundle(session: SessionContext): Promise<{
  content: string;
  rowCount: number;
}> {
  const snapshot = await generateEvidenceSnapshot(session);
  const content = serializeEvidenceSnapshot(snapshot);
  const result = await createAuditExport({
    session,
    format: "evidence",
    filters: { query: "evidence_snapshot" },
  });

  return { content, rowCount: Object.keys(snapshot.sources).length + result.rowCount };
}
