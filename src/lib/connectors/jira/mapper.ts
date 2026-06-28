import type { JiraResource } from "@/lib/connectors/jira/types";

export function mapExternalRecord(record: Record<string, unknown>): JiraResource {
  return {
    id: String(record.id ?? "unknown"),
    name: String(record.name ?? record.title ?? "Unnamed"),
    type: String(record.type ?? "resource"),
  };
}

export function mapExternalRecords(records: Record<string, unknown>[]): JiraResource[] {
  return records.map(mapExternalRecord);
}
