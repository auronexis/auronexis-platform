import { CommandCenterGreeting } from "@/components/dashboard/command-center-greeting";
import { cn } from "@/lib/utils/cn";
import {
  computeHealthScore,
  countActiveAlerts,
} from "@/lib/dashboard/display";
import type { DashboardData } from "@/lib/dashboard/types";
import type { WorkspaceHealthSummary } from "@/lib/ai/insights/types";

type CommandCenterHeroProps = {
  userName: string;
  data: DashboardData;
  workspaceHealth?: WorkspaceHealthSummary | null;
};

export function CommandCenterHero({ userName, data, workspaceHealth }: CommandCenterHeroProps) {
  const healthScore = workspaceHealth?.score ?? computeHealthScore(data.clientHealth);
  const activeAlerts = countActiveAlerts({
    criticalAlerts: data.criticalAlerts,
    openRiskCount: data.openRiskCount,
    openIncidentCount: data.openIncidentCount,
    slaMetrics: data.slaMetrics,
    includeRisks: data.features.risks,
    includeIncidents: data.features.incidents,
    includeSla: data.features.sla,
  });

  const stats = [
    { label: "Workspace Health", value: `${healthScore}%` },
    { label: "Active Alerts", value: String(activeAlerts) },
    { label: "Reports Drafted", value: String(data.draftReportsCount) },
  ];

  return (
    <section
      aria-label="Operations Command Center overview"
      className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-1 px-4 py-5 shadow-sm sm:px-6 sm:py-6"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent"
        aria-hidden
      />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Command Center
          </p>
          <CommandCenterGreeting userName={userName} />
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Operations Command Center
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Monitor clients, operational health, and business performance from one workspace.
          </p>
        </div>

        <dl className="grid w-full shrink-0 gap-2 sm:grid-cols-3 lg:w-auto lg:min-w-[min(100%,22rem)]">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "rounded-xl border border-border-subtle bg-surface-2 px-3 py-2.5",
              )}
            >
              <dt className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
                {stat.label}
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
