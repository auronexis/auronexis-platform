import type { GoogleResource } from "@/lib/connectors/google/types";

export function mapExternalRecord(record: Record<string, unknown>): GoogleResource {
  return {
    id: String(record.id ?? "unknown"),
    name: String(record.name ?? record.title ?? "Unnamed"),
    type: String(record.type ?? "resource"),
  };
}

export function mapExternalRecords(records: Record<string, unknown>[]): GoogleResource[] {
  return records.map(mapExternalRecord);
}
