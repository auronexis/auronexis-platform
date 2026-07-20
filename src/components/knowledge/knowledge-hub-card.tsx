import Link from "next/link";
import type { KnowledgeHubData } from "@/lib/ai/knowledge/types";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type KnowledgeHubCardProps = {
  data: KnowledgeHubData | null;
  aiEnabled: boolean;
  upgradeMessage: string;
  requiredPlanLabel?: string;
};

export function KnowledgeHubCard({
  data,
  aiEnabled,
  upgradeMessage,
  requiredPlanLabel,
}: KnowledgeHubCardProps) {
  if (!aiEnabled || !data) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/[0.04] p-5">
        <p className="text-sm font-semibold text-foreground">Knowledge Hub</p>
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

  const newArticles = data.articles.length;
  const newPlaybooks = data.playbooks.length;
  const gapCount = data.health.gaps.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="New articles" value={newArticles} />
        <Stat label="Playbooks" value={newPlaybooks} />
        <Stat label="Knowledge gaps" value={gapCount} />
      </div>
      {data.health.gaps[0] ? (
        <p className="text-sm text-muted">{data.health.gaps[0].message}</p>
      ) : (
        <p className="text-sm text-muted">Knowledge coverage: {data.health.coveragePercent}%</p>
      )}
      <Link href="/knowledge" className={cn(linkText, "inline-flex text-sm")}>
        View all
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface/80 px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
