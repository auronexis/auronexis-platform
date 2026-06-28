import type { AuditSearchFilters } from "@/lib/compliance/types";

export function normalizeAuditFilters(filters: AuditSearchFilters): Required<
  Pick<AuditSearchFilters, "page" | "pageSize">
> &
  AuditSearchFilters {
  return {
    ...filters,
    page: Math.max(1, filters.page ?? 1),
    pageSize: Math.min(100, Math.max(10, filters.pageSize ?? 25)),
  };
}

export function auditFilterSummary(filters: AuditSearchFilters): string {
  const parts: string[] = [];
  if (filters.query) parts.push(`query="${filters.query}"`);
  if (filters.entityType) parts.push(`entity=${filters.entityType}`);
  if (filters.eventType) parts.push(`event=${filters.eventType}`);
  if (filters.severity) parts.push(`severity=${filters.severity}`);
  if (filters.dateFrom) parts.push(`from=${filters.dateFrom}`);
  if (filters.dateTo) parts.push(`to=${filters.dateTo}`);
  return parts.join(", ") || "all events";
}
