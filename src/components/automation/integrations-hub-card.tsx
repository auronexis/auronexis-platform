import Link from "next/link";
import { Plug } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";
import type { IntegrationsDashboardSummary } from "@/lib/integrations/types";

type IntegrationsHubCardProps = {
  summary: IntegrationsDashboardSummary;
  aiEnabled: boolean;
  upgradeMessage: string;
  requiredPlanLabel?: string;
};

export function IntegrationsHubCard({
  summary,
  aiEnabled,
  upgradeMessage,
  requiredPlanLabel,
}: IntegrationsHubCardProps) {
  if (!aiEnabled) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/[0.04] p-5">
        <p className="text-sm font-semibold text-foreground">Enterprise Integrations</p>
        <p className="mt-2 text-sm text-muted">{upgradeMessage}</p>
        {requiredPlanLabel ? (
          <p className="mt-1 text-xs font-medium text-foreground">{requiredPlanLabel} plan required</p>
        ) : null}
      </div>
    );
  }

  const items = [
    { label: "Registered", value: summary.registeredCount },
    { label: "Configured", value: summary.configuredCount },
    { label: "Ready", value: summary.readyCount },
    { label: "Workflow actions", value: summary.workflowIntegrationActionCount },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Plug className="h-4 w-4" aria-hidden="true" />
        <span>
          Simulation:{" "}
          <span className="font-medium capitalize text-foreground">{summary.simulationStatus}</span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-surface/80 px-4 py-3">
            <p className="text-xs text-muted">{item.label}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
      <Link href="/automation/integrations" className={cn(linkText, "inline-flex text-sm")}>
        Manage integrations
      </Link>
    </div>
  );
}
