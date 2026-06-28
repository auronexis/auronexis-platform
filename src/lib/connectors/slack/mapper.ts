import type { SlackResource } from "@/lib/connectors/slack/types";

export function mapExternalRecord(record: Record<string, unknown>): SlackResource {
  return {
    id: String(record.id ?? "unknown"),
    name: String(record.name ?? record.title ?? "Unnamed"),
    type: String(record.type ?? "resource"),
  };
}

export function mapExternalRecords(records: Record<string, unknown>[]): SlackResource[] {
  return records.map(mapExternalRecord);
}
