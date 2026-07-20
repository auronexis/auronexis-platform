import Link from "next/link";
import { Sparkles } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type AutomationUpgradeCardProps = {
  message: string;
  requiredPlanLabel?: string;
};

export function AutomationUpgradeCard({ message, requiredPlanLabel }: AutomationUpgradeCardProps) {
  return (
    <div
      className="rounded-2xl border border-dashed border-primary/25 bg-primary/[0.04] p-8 text-center"
      role="region"
      aria-label="AI Automation Builder upgrade required"
    >
      <Sparkles className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
      <p className="mt-4 text-lg font-semibold text-foreground">AI Automation Builder</p>
      <p className="mt-2 text-sm text-muted">{message}</p>
      {requiredPlanLabel ? (
        <p className="mt-1 text-xs font-medium text-foreground">{requiredPlanLabel} plan required</p>
      ) : null}
      <LinkButton href="/settings/plans" variant="primary" size="sm" className="mt-4">
        View plans
      </LinkButton>
    </div>
  );
}

type AutomationCenterCardProps = {
  activeCount: number;
  errorCount: number;
  pendingCount: number;
  recentCount: number;
  aiEnabled: boolean;
  upgradeMessage: string;
  requiredPlanLabel?: string;
};

export function AutomationCenterCard({
  activeCount,
  errorCount,
  pendingCount,
  recentCount,
  aiEnabled,
  upgradeMessage,
  requiredPlanLabel,
}: AutomationCenterCardProps) {
  if (!aiEnabled) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/[0.04] p-5">
        <p className="text-sm font-semibold text-foreground">Automation Center</p>
        <p className="mt-2 text-sm text-muted">{upgradeMessage}</p>
        {requiredPlanLabel ? (
          <p className="mt-1 text-xs font-medium text-foreground">{requiredPlanLabel} plan required</p>
        ) : null}
        <LinkButton href="/settings/plans" variant="primary" size="sm" className="mt-4">
          View plans
        </LinkButton>
      </div>
    );
  }

  const items = [
    { label: "Running", value: activeCount },
    { label: "Errors", value: errorCount },
    { label: "Pending", value: pendingCount },
    { label: "Recently triggered", value: recentCount },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-surface/80 px-4 py-3">
            <p className="text-xs text-muted">{item.label}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
      <Link href="/automation" className={cn(linkText, "inline-flex text-sm")}>
        View all automations
      </Link>
    </div>
  );
}
