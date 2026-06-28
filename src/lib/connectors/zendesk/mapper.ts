import type { ZendeskResource } from "@/lib/connectors/zendesk/types";

export function mapExternalRecord(record: Record<string, unknown>): ZendeskResource {
  return {
    id: String(record.id ?? "unknown"),
    name: String(record.name ?? record.title ?? "Unnamed"),
    type: String(record.type ?? "resource"),
  };
}

export function mapExternalRecords(records: Record<string, unknown>[]): ZendeskResource[] {
  return records.map(mapExternalRecord);
}
