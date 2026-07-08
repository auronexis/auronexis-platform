import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { ClientPriorityResult } from "@/lib/intelligence/types";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

type PriorityClientsPanelProps = {
  clients: ClientPriorityResult[];
};

const severityStyles: Record<ClientPriorityResult["severity"], string> = {
  Low: "border-border bg-muted/10 text-muted",
  Medium: "border-warning/20 bg-warning/10 text-warning",
  High: "border-danger/20 bg-danger/10 text-danger",
  Critical: "border-danger/30 bg-danger/15 text-danger",
};

const healthStyles = {
  healthy: "text-success",
  watch: "text-warning",
  critical: "text-danger",
} as const;

export function PriorityClientsPanel({ clients }: PriorityClientsPanelProps) {
  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No priority clients yet"
        description="Once clients are active in your workspace, the highest-priority accounts will appear here."
        action={
          <Link
            href="/clients/new"
            className={cn(
              "inline-flex h-8 items-center rounded-md border border-transparent bg-primary px-3 text-xs font-medium text-primary-foreground shadow-xs",
              transitionInteractive,
              focusRing,
            )}
          >
            Add client
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {clients.map((client, index) => (
        <article
          key={client.clientId}
          className={cn(
            "rounded-xl border border-border/70 bg-surface/60 p-4",
            transitionInteractive,
            "hover:border-border-strong hover:bg-surface/80",
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted">#{index + 1}</span>
                <Link
                  href={`/clients/${client.clientId}`}
                  className={cn("truncate text-sm font-semibold text-foreground hover:text-primary", focusRing)}
                >
                  {client.clientName}
                </Link>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                    severityStyles[client.severity],
                  )}
                >
                  {client.severity}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span>
                  Score <span className="font-medium text-foreground">{client.score}</span>
                </span>
                <span>
                  Health{" "}
                  <span className={cn("font-medium capitalize", healthStyles[client.healthLabel])}>
                    {client.healthLabel}
                  </span>
                </span>
              </div>

              {client.reasons[0] ? (
                <p className="mt-2 text-sm text-muted">{client.reasons[0]}</p>
              ) : null}

              <p className="mt-2 text-sm text-foreground">{client.recommendedAction}</p>
            </div>

            <Link
              href={`/clients/${client.clientId}`}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-xs font-medium text-foreground shadow-xs",
                transitionInteractive,
                focusRing,
                "hover:border-primary/30 hover:bg-primary/[0.04]",
              )}
            >
              Open client
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
