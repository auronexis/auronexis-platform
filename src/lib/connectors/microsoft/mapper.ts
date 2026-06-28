import type { MicrosoftResource } from "@/lib/connectors/microsoft/types";

export function mapExternalRecord(record: Record<string, unknown>): MicrosoftResource {
  return {
    id: String(record.id ?? "unknown"),
    name: String(record.name ?? record.title ?? "Unnamed"),
    type: String(record.type ?? "resource"),
  };
}

export function mapExternalRecords(records: Record<string, unknown>[]): MicrosoftResource[] {
  return records.map(mapExternalRecord);
}
