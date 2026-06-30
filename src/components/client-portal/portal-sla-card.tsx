import type { ClientSlaAssignment } from "@/lib/sla/types";
import { formatSlaHours } from "@/lib/sla/calculations";
import { PortalCard, PortalEmptyState } from "@/components/client-portal/portal-ui";

type PortalSlaCardProps = {
  assignment: ClientSlaAssignment;
};

function assignmentLabel(assignment: ClientSlaAssignment): string {
  if (assignment.source === "assigned") {
    return "Dedicated SLA policy assigned to your account";
  }

  if (assignment.source === "inherited") {
    return "Organization default SLA policy applies to your account";
  }

  return "No SLA policy assigned yet.";
}

export function PortalSlaCard({ assignment }: PortalSlaCardProps) {
  const policy = assignment.effectivePolicy;

  if (!policy) {
    return (
      <PortalEmptyState
        title="No SLA policy assigned yet."
        description="Your agency will configure response-time targets for your account when ready."
      />
    );
  }

  return (
    <PortalCard>
      <p className="text-sm font-semibold text-foreground">{assignmentLabel(assignment)}</p>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Policy name</dt>
          <dd className="mt-1 text-sm text-foreground">{policy.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Coverage</dt>
          <dd className="mt-1 text-sm text-foreground">Incidents and operational risks</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Incident response target
          </dt>
          <dd className="mt-1 text-sm text-foreground">{formatSlaHours(policy.incident_hours)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Risk response target
          </dt>
          <dd className="mt-1 text-sm text-foreground">{formatSlaHours(policy.risk_hours)}</dd>
        </div>
      </dl>
      <p className="mt-5 text-sm text-muted">
        Escalation and coverage details are managed by your agency team. Contact them if you need
        clarification on response commitments.
      </p>
    </PortalCard>
  );
}
