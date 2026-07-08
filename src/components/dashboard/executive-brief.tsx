import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { ExecutiveBrief } from "@/lib/intelligence/types";
import { cn } from "@/lib/utils/cn";
import { focusRing, linkText, transitionInteractive } from "@/lib/ui/tokens";

type ExecutiveBriefPanelProps = {
  brief: ExecutiveBrief;
};

const severityStyles = {
  Low: "text-muted",
  Medium: "text-warning",
  High: "text-danger",
  Critical: "text-danger",
} as const;

export function ExecutiveBriefPanel({ brief }: ExecutiveBriefPanelProps) {
  return (
    <section
      aria-label="Today's executive brief"
      className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-1 px-5 py-6 shadow-sm sm:px-6"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent"
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            Today&apos;s Executive Brief
          </div>

          <div>
            <p className="text-lg font-medium text-foreground sm:text-xl">
              {brief.greeting}, {brief.firstName}.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-muted">
              {brief.summaryLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <BriefStat label="Clients requiring attention" value={brief.clientsRequiringAttention} />
            <BriefStat label="Reports overdue" value={brief.overdueReportsCount} />
            <BriefStat label="Critical incidents" value={brief.criticalIncidentCount} />
            <BriefStat label="Revenue at risk" value={brief.revenueAtRiskFormatted} />
          </div>
        </div>

        {brief.highestPriorityClient ? (
          <div className="w-full shrink-0 rounded-xl border border-border/70 bg-surface/80 p-4 lg:max-w-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Highest priority
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {brief.highestPriorityClient.clientName}
            </p>
            <p className="mt-1 text-sm text-muted">
              Priority score{" "}
              <span className="font-medium text-foreground">{brief.highestPriorityClient.score}</span>
              {" · "}
              <span className={cn(severityStyles[brief.highestPriorityClient.severity])}>
                {brief.highestPriorityClient.severity}
              </span>
            </p>
            <Link
              href={`/clients/${brief.highestPriorityClient.clientId}`}
              className={cn(
                "mt-4 inline-flex h-8 items-center gap-1.5 rounded-md border border-transparent bg-primary px-3 text-xs font-medium text-primary-foreground shadow-xs",
                transitionInteractive,
                focusRing,
                "hover:bg-primary-hover hover:shadow-interactive",
              )}
            >
              Open client
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function BriefStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface/60 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

export function ExecutiveBriefEmptyState() {
  return (
    <section className="rounded-2xl border border-dashed border-border-strong bg-muted/5 px-6 py-10 text-center">
      <Sparkles className="mx-auto h-8 w-8 text-primary" aria-hidden />
      <p className="mt-4 text-sm font-medium text-foreground">Your executive brief will appear here</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Add clients, publish reports, and track operational signals to unlock portfolio intelligence.
      </p>
      <Link
        href="/clients/new"
        className={cn(linkText, "mt-5 inline-flex items-center gap-1 text-sm font-medium", focusRing, transitionInteractive)}
      >
        Add your first client
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}
