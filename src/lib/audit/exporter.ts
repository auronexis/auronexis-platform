import "server-only";

import { auditFilterSummary } from "@/lib/audit/filters";
import { searchAuditEvents } from "@/lib/audit/search";
import { recordAuditEvent } from "@/lib/audit/events";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditExportFormat, AuditSearchFilters } from "@/lib/compliance/types";
import type { SessionContext } from "@/lib/tenancy/context";

function toCsv(items: Array<Record<string, unknown>>): string {
  if (items.length === 0) {
    return "id,event_type,entity_type,entity_id,severity,source,created_at\n";
  }

  const headers = ["id", "event_type", "entity_type", "entity_id", "severity", "source", "created_at"];
  const lines = [headers.join(",")];

  for (const item of items) {
    lines.push(
      headers
        .map((key) => {
          const value = String(item[key] ?? "");
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(","),
    );
  }

  return lines.join("\n");
}

export async function createAuditExport(input: {
  session: SessionContext;
  format: AuditExportFormat;
  filters: AuditSearchFilters;
}): Promise<{ exportId: string; downloadPayload: string; rowCount: number }> {
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
    metadata: JSON.stringify(item.metadata),
  }));

  const payload =
    input.format === "csv"
      ? toCsv(rows)
      : JSON.stringify({ generatedAt: new Date().toISOString(), filters: input.filters, rows }, null, 2);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("audit_exports")
    .insert({
      organization_id: input.session.organization.id,
      requested_by: input.session.user.id,
      export_format: input.format,
      status: "completed",
      filters: input.filters,
      row_count: rows.length,
      payload: { content: payload },
      completed_at: new Date().toISOString(),
    } as never)
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

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
    },
  });

  return {
    exportId: (data as { id: string }).id,
    downloadPayload: payload,
    rowCount: rows.length,
  };
}
