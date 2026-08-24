import "server-only";

import { auditFilterSummary } from "@/lib/audit/filters";
import { toAuditCsv } from "@/lib/audit/csv-export";
import { searchAuditEvents } from "@/lib/audit/search";
import { recordAuditEvent } from "@/lib/audit/events";
import { safeJsonStringify, sanitizeExportMetadata } from "@/lib/audit/export-sanitize";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditExportFormat, AuditSearchFilters } from "@/lib/compliance/types";
import type { SessionContext } from "@/lib/tenancy/context";

const AUDIT_CSV_HEADERS = [
  "id",
  "event_type",
  "entity_type",
  "entity_id",
  "severity",
  "source",
  "created_at",
] as const;

export async function createAuditExport(input: {
  session: SessionContext;
  format: AuditExportFormat;
  filters: AuditSearchFilters;
}): Promise<{ exportId: string | null; downloadPayload: string; rowCount: number }> {
  const result = await searchAuditEvents(input.session.organization.id, {
    ...input.filters,
    page: 1,
    pageSize: 500,
  });

  const rows = result.items.map((item) => ({
    id: item.id,
    event_type: item.eventType,
    entity_type: item.entityType,
    entity_id: item.entityId,
    severity: item.severity,
    source: item.source,
    created_at: item.createdAt,
    metadata: safeJsonStringify(sanitizeExportMetadata(item.metadata)),
  }));

  const payload =
    input.format === "csv"
      ? toAuditCsv(rows, AUDIT_CSV_HEADERS)
      : safeJsonStringify({
          generatedAt: new Date().toISOString(),
          filters: input.filters,
          rows: rows.map((row) => ({
            ...row,
            metadata: sanitizeExportMetadata(
              (() => {
                try {
                  return JSON.parse(String(row.metadata || "{}")) as Record<string, unknown>;
                } catch {
                  return {};
                }
              })(),
            ),
          })),
        });

  const admin = createAdminClient();
  let exportId: string | null = null;

  const { data, error } = await admin
    .from("audit_exports")
    .insert({
      organization_id: input.session.organization.id,
      requested_by: input.session.user.id,
      export_format: input.format,
      status: "completed",
      filters: input.filters,
      row_count: rows.length,
      // Store metadata only — avoid duplicating large download payloads in DB.
      payload: {
        rowCount: rows.length,
        format: input.format,
        filterSummary: auditFilterSummary(input.filters),
      },
      completed_at: new Date().toISOString(),
    } as never)
    .select("id")
    .single();

  if (error) {
    // Download must still succeed when optional persistence fails.
    console.error("[audit-export] persist failed:", error.message);
  } else {
    exportId = (data as { id: string } | null)?.id ?? null;
  }

  try {
    await recordAuditEvent({
      organizationId: input.session.organization.id,
      userId: input.session.user.id,
      entityType: "organization",
      entityId: input.session.organization.id,
      eventType: "audit_export_requested",
      source: "compliance",
      metadata: {
        format: input.format,
        filterSummary: auditFilterSummary(input.filters),
        rowCount: rows.length,
        persisted: Boolean(exportId),
      },
    });
  } catch (auditError) {
    console.error(
      "[audit-export] audit trail failed:",
      auditError instanceof Error ? auditError.message : auditError,
    );
  }

  return {
    exportId,
    downloadPayload: payload,
    rowCount: rows.length,
  };
}
