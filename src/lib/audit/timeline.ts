import type { AuditEventView } from "@/lib/compliance/types";
import { formatAppWeekdayDate } from "@/lib/i18n/date";
import type { AppLocale } from "@/lib/i18n/types";

export function groupAuditTimelineByDay(items: AuditEventView[]): Array<{
  date: string;
  items: AuditEventView[];
}> {
  const groups = new Map<string, AuditEventView[]>();

  for (const item of items) {
    const date = new Date(item.createdAt).toISOString().slice(0, 10);
    const bucket = groups.get(date) ?? [];
    bucket.push(item);
    groups.set(date, bucket);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, groupItems]) => ({ date, items: groupItems }));
}

export function formatTimelineLabel(isoDate: string, locale: AppLocale = "en"): string {
  return formatAppWeekdayDate(isoDate, locale);
}
