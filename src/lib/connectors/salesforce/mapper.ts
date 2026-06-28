import type { SalesforceResource } from "@/lib/connectors/salesforce/types";

export function mapExternalRecord(record: Record<string, unknown>): SalesforceResource {
  return {
    id: String(record.id ?? "unknown"),
    name: String(record.name ?? record.title ?? "Unnamed"),
    type: String(record.type ?? "resource"),
  };
}

export function mapExternalRecords(records: Record<string, unknown>[]): SalesforceResource[] {
  return records.map(mapExternalRecord);
}
