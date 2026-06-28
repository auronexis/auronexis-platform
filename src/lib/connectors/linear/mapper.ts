import type { LinearResource } from "@/lib/connectors/linear/types";

export function mapExternalRecord(record: Record<string, unknown>): LinearResource {
  return {
    id: String(record.id ?? "unknown"),
    name: String(record.name ?? record.title ?? "Unnamed"),
    type: String(record.type ?? "resource"),
  };
}

export function mapExternalRecords(records: Record<string, unknown>[]): LinearResource[] {
  return records.map(mapExternalRecord);
}
