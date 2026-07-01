import Link from "next/link";
import type { RiskActivityView } from "@/lib/risks/types";
import { formatRiskDateTime } from "@/lib/risks/types";
import { linkText } from "@/lib/ui/tokens";

type RiskActivityFeedProps = {
  events: RiskActivityView[];
};

export function RiskActivityFeed({ events }: RiskActivityFeedProps) {
  if (events.length === 0) {
    return <p className="text-sm text-muted">No activity recorded for this risk yet.</p>;
  }

  return (
    <ul className="divide-y divide-border/70 rounded-xl border border-border/70 bg-surface/40">
      {events.map((event) => (
        <li key={event.id} className="px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{event.message}</p>
            <time className="shrink-0 text-xs text-muted">
              {formatRiskDateTime(event.created_at)}
            </time>
          </div>
          <p className="mt-2 text-xs text-muted">
            {event.actor?.full_name ?? "System"} · {event.event_type.replace("risk.", "")}
          </p>
        </li>
      ))}
      <li className="px-4 py-3 text-sm">
        <Link href="/activity?filter=risks" className={linkText}>
          View all risk activity →
        </Link>
      </li>
    </ul>
  );
}
