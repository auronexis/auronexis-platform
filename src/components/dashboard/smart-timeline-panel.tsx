import Link from "next/link";
import { Clock3 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { SmartTimelineEvent } from "@/lib/intelligence/types";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

type SmartTimelinePanelProps = {
  events: SmartTimelineEvent[];
};

const categoryStyles: Record<string, string> = {
  Report: "bg-emerald-500",
  Risk: "bg-warning",
  Incident: "bg-danger",
  Health: "bg-primary",
  Client: "bg-sky-500",
  Activity: "bg-muted",
};

export function SmartTimelinePanel({ events }: SmartTimelinePanelProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={Clock3}
        title="No executive timeline events yet"
        description="Published reports, risks, incidents, and health changes will appear here as your workspace becomes active."
        action={
          <Link
            href="/activity"
            className={cn(
              "inline-flex h-8 items-center rounded-md border border-border bg-surface px-3 text-xs font-medium text-foreground shadow-xs",
              transitionInteractive,
              focusRing,
            )}
          >
            View activity
          </Link>
        }
      />
    );
  }

  return (
    <ol className="relative space-y-0">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const dotClass = categoryStyles[event.category] ?? categoryStyles.Activity;

        return (
          <li key={event.id} className="relative pl-6">
            {!isLast ? (
              <span
                className="absolute left-[7px] top-4 h-[calc(100%+0.25rem)] w-px bg-border"
                aria-hidden
              />
            ) : null}

            <span
              className={cn("absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full ring-4 ring-surface", dotClass)}
              aria-hidden
            />

            <div className={cn("pb-5", transitionInteractive)}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border/70 bg-surface/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
                  {event.category}
                </span>
                <span className="text-xs text-muted">{event.relativeTime}</span>
              </div>

              {event.href ? (
                <Link
                  href={event.href}
                  className={cn("mt-1 inline-block text-sm font-medium text-foreground hover:text-primary", focusRing)}
                >
                  {event.title}
                </Link>
              ) : (
                <p className="mt-1 text-sm font-medium text-foreground">{event.title}</p>
              )}

              {event.description ? (
                <p className="mt-1 text-sm text-muted">{event.description}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
