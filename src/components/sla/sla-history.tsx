"use client";

import Link from "next/link";
import type { SlaEventView } from "@/lib/sla/types";
import { SLABreachBadge } from "@/components/sla/sla-breach-badge";
import { useWorkspaceMoney } from "@/components/workspace/workspace-money-provider";
import { linkText } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";

type SLAHistoryProps = {
  events: SlaEventView[];
  emptyMessage?: string;
  className?: string;
};

export function SLAHistory({
  events,
  emptyMessage = "No SLA breaches recorded.",
  className,
}: SLAHistoryProps) {
  const { formatDateTime } = useWorkspaceMoney();

  if (events.length === 0) {
    return (
      <div className={cn("rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-8 text-center text-sm text-muted", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className={cn("divide-y divide-border/70 rounded-xl border border-border/70 bg-surface/40", className)}>
      {events.map((event) => (
        <li key={event.id} className="flex items-start justify-between gap-3 px-4 py-3">
          <div>
            {event.incident_id ? (
              <Link href={`/incidents/${event.incident_id}`} className={cn(linkText, "font-medium")}>
                Incident SLA breach
              </Link>
            ) : (
              <p className="font-medium text-foreground">SLA breach</p>
            )}
            <p className="mt-1 text-xs text-muted">
              {event.started_at ? formatDateTime(event.started_at) : "—"}
            </p>
          </div>
          {event.breached ? <SLABreachBadge /> : null}
        </li>
      ))}
    </ul>
  );
}
