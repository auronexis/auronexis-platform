import type { GithubResource } from "@/lib/connectors/github/types";

export function mapExternalRecord(record: Record<string, unknown>): GithubResource {
  return {
    id: String(record.id ?? "unknown"),
    name: String(record.name ?? record.title ?? "Unnamed"),
    type: String(record.type ?? "resource"),
  };
}

export function mapExternalRecords(records: Record<string, unknown>[]): GithubResource[] {
  return records.map(mapExternalRecord);
}
