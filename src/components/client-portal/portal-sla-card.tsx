import type { PortalSlaSummary } from "@/lib/sla/types";
import { PortalCard, PortalEmptyState } from "@/components/client-portal/portal-ui";

type PortalSlaCardProps = {
  summary: PortalSlaSummary;
};

export function PortalSlaCard({ summary }: PortalSlaCardProps) {
  if (!summary.policyName) {
    return (
      <PortalEmptyState
        title="No SLA policy assigned yet."
        description="Your agency will configure response-time targets for your account when ready."
      />
    );
  }

  return (
    <PortalCard>
      <p className="text-sm font-semibold text-foreground">Service level commitments for your account</p>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Policy name</dt>
          <dd className="mt-1 text-sm text-foreground">{summary.policyName}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Compliance</dt>
          <dd className="mt-1 text-sm text-foreground">{summary.compliancePercent}%</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Response target</dt>
          <dd className="mt-1 text-sm text-foreground">{summary.responseTarget}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Resolution target</dt>
          <dd className="mt-1 text-sm text-foreground">{summary.resolutionTarget}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Breaches</dt>
          <dd className="mt-1 text-sm text-foreground">{summary.breachCount}</dd>
        </div>
      </dl>
      <p className="mt-5 text-sm text-muted">
        Escalation and coverage details are managed by your agency team. Contact them if you need
        clarification on response commitments.
      </p>
    </PortalCard>
  );
}
