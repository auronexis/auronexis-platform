import type { HubspotResource } from "@/lib/connectors/hubspot/types";

export function mapExternalRecord(record: Record<string, unknown>): HubspotResource {
  return {
    id: String(record.id ?? "unknown"),
    name: String(record.name ?? record.title ?? "Unnamed"),
    type: String(record.type ?? "resource"),
  };
}

export function mapExternalRecords(records: Record<string, unknown>[]): HubspotResource[] {
  return records.map(mapExternalRecord);
}
