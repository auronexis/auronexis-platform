import { formatExecutiveReportTimestamp } from "@/lib/executive-reports/types";

type ExecutiveTimelineProps = {
  items: Array<{ title: string; createdAt: string }>;
};

export function ExecutiveTimeline({ items }: ExecutiveTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-6 text-center">
        <p className="text-sm text-muted">No timeline events for this period.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/70">
      {items.map((item) => (
        <li key={`${item.createdAt}-${item.title}`} className="py-3 first:pt-0 last:pb-0">
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          <p className="mt-1 text-xs text-muted">{formatExecutiveReportTimestamp(item.createdAt)}</p>
        </li>
      ))}
    </ul>
  );
}
