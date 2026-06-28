import type { GitlabResource } from "@/lib/connectors/gitlab/types";

export function mapExternalRecord(record: Record<string, unknown>): GitlabResource {
  return {
    id: String(record.id ?? "unknown"),
    name: String(record.name ?? record.title ?? "Unnamed"),
    type: String(record.type ?? "resource"),
  };
}

export function mapExternalRecords(records: Record<string, unknown>[]): GitlabResource[] {
  return records.map(mapExternalRecord);
}
