import { BookOpen } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";

type KnowledgeUpgradeCardProps = {
  message: string;
  requiredPlanLabel?: string;
};

export function KnowledgeUpgradeCard({ message, requiredPlanLabel }: KnowledgeUpgradeCardProps) {
  return (
    <div
      className="rounded-2xl border border-dashed border-primary/25 bg-primary/[0.04] p-8 text-center"
      role="region"
      aria-label="Knowledge Hub upgrade required"
    >
      <BookOpen className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
      <p className="mt-4 text-lg font-semibold text-foreground">AI Knowledge Hub</p>
      <p className="mt-2 text-sm text-muted">{message}</p>
      {requiredPlanLabel ? (
        <p className="mt-1 text-xs font-medium text-foreground">{requiredPlanLabel} plan required</p>
      ) : null}
      <p className="mt-3 text-sm text-muted">
        Search organizational memory, related incidents, and historical recommendations once you upgrade.
      </p>
      <LinkButton href="/settings/plans" variant="primary" size="sm" className="mt-4">
        View plans
      </LinkButton>
    </div>
  );
}
