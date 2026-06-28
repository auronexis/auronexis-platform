import type { NotionResource } from "@/lib/connectors/notion/types";

export function mapExternalRecord(record: Record<string, unknown>): NotionResource {
  return {
    id: String(record.id ?? "unknown"),
    name: String(record.name ?? record.title ?? "Unnamed"),
    type: String(record.type ?? "resource"),
  };
}

export function mapExternalRecords(records: Record<string, unknown>[]): NotionResource[] {
  return records.map(mapExternalRecord);
}
