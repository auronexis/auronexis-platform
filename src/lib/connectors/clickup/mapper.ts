import type { ClickupResource } from "@/lib/connectors/clickup/types";

export function mapExternalRecord(record: Record<string, unknown>): ClickupResource {
  return {
    id: String(record.id ?? "unknown"),
    name: String(record.name ?? record.title ?? "Unnamed"),
    type: String(record.type ?? "resource"),
  };
}

export function mapExternalRecords(records: Record<string, unknown>[]): ClickupResource[] {
  return records.map(mapExternalRecord);
}
