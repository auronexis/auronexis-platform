import Link from "next/link";
import type { ExecutiveIntelligenceSnapshot, ExecutiveBriefing } from "@/lib/executive-intelligence/types";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/typography";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type ExecutiveIntelligenceHubProps = {
  snapshot: ExecutiveIntelligenceSnapshot;
  briefing: ExecutiveBriefing;
  aiEnabled: boolean;
};

const severityStyles: Record<string, string> = {
  critical: "text-danger",
  high: "text-danger",
  medium: "text-warning",
  low: "text-muted",
  info: "text-primary",
};

export function ExecutiveIntelligenceHub({
  snapshot,
  briefing,
  aiEnabled,
}: ExecutiveIntelligenceHubProps) {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <SectionTitle>Executive Intelligence</SectionTitle>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {briefing.periodLabel} · Generated {new Date(briefing.generatedAt).toLocaleString()}
          </p>
          <span className="mt-2 inline-flex rounded-full border border-border/70 px-2 py-0.5 text-xs text-muted">
            {briefing.generatedBy === "ai_assisted" ? "AI-assisted briefing" : "Deterministic briefing"}
            {!aiEnabled ? " · AI narrative locked on plan" : ""}
          </span>
        </div>
      </header>

      <Card padding="lg" className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Executive summary</h2>
        <p className="text-sm text-muted">{briefing.summary}</p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Adoption" value={snapshot.adoption.currentValue} unit="score" />
        <MetricCard label="Healthy clients" value={snapshot.customerSuccess.currentValue} unit="count" />
        <MetricCard label="Open risks" value={snapshot.riskExposure.currentValue} unit="count" negative />
        <MetricCard label="Open incidents" value={snapshot.incidentStability.currentValue} unit="count" negative />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="lg" className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Key improvements</h2>
          {snapshot.positiveChanges.length === 0 ? (
            <p className="text-sm text-muted">No major positive changes in this period.</p>
          ) : (
            <ul className="space-y-2">
              {snapshot.positiveChanges.map((c) => (
                <li key={c.key} className="text-sm text-muted">
                  {c.label}: {c.absoluteChange ?? 0}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card padding="lg" className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Critical changes</h2>
          {snapshot.criticalChanges.length === 0 ? (
            <p className="text-sm text-muted">No critical negative changes.</p>
          ) : (
            <ul className="space-y-2">
              {snapshot.criticalChanges.map((c) => (
                <li key={c.key} className="text-sm text-danger">
                  {c.label}: {c.absoluteChange ?? 0}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card padding="lg" className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Priority clients</h2>
        {snapshot.priorityClients.length === 0 ? (
          <p className="text-sm text-muted">No priority clients in this period.</p>
        ) : (
          <ul className="space-y-3">
            {snapshot.priorityClients.slice(0, 15).map((client) => (
              <li
                key={client.clientId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2.5"
              >
                <div>
                  <Link href={`/clients/${client.clientId}/success`} className={cn(linkText, "text-sm font-semibold")}>
                    {client.clientName}
                  </Link>
                  <p className="mt-1 text-xs text-muted">{client.primaryReason}</p>
                </div>
                <span className="text-xs text-muted">Score {client.priorityScore}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padding="lg" className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Findings</h2>
        {snapshot.topFindings.length === 0 ? (
          <p className="text-sm text-muted">Insufficient data for findings.</p>
        ) : (
          <ul className="space-y-3">
            {snapshot.topFindings.map((finding) => (
              <li key={finding.id} className="rounded-lg border border-border/70 px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("text-xs font-semibold uppercase", severityStyles[finding.severity])}>
                    {finding.severity}
                  </span>
                  <span className="text-xs text-muted">Confidence: {finding.confidence}</span>
                  <span className="text-xs text-muted">Source: {finding.generatedBy}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-foreground">{finding.title}</p>
                <p className="mt-1 text-sm text-muted">{finding.explanation}</p>
                {finding.evidence.length > 0 ? (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-primary">Evidence ({finding.evidence.length})</summary>
                    <ul className="mt-2 space-y-1">
                      {finding.evidence.map((ev) => (
                        <li key={ev.sourceKey} className="text-xs text-muted">
                          {ev.label}: {String(ev.value)}
                          {ev.route ? (
                            <Link href={ev.route} className={cn(linkText, "ml-2")}>
                              View
                            </Link>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padding="lg" className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Narrative</h2>
        <pre className="whitespace-pre-wrap rounded-lg bg-muted/30 p-4 text-sm text-foreground">
          {briefing.narrative}
        </pre>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  negative,
}: {
  label: string;
  value: number | null;
  unit: string;
  negative?: boolean;
}) {
  return (
    <Card padding="md">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold", negative && value && value > 0 ? "text-danger" : "text-foreground")}>
        {value ?? "—"}
        {value !== null ? <span className="ml-1 text-sm font-normal text-muted">{unit}</span> : null}
      </p>
    </Card>
  );
}
