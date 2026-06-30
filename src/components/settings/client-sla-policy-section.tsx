import { formatSlaHours } from "@/lib/sla/calculations";
import type { ClientSlaAssignment } from "@/lib/sla/types";
import { ClientSlaPolicyForm } from "@/components/settings/client-sla-policy-form";
import type { SlaPolicy } from "@/types/database";

type ClientSlaPolicySectionProps = {
  clientId: string;
  assignment: ClientSlaAssignment;
  policies: SlaPolicy[];
  readOnly?: boolean;
};

function assignmentHeading(assignment: ClientSlaAssignment): string {
  if (assignment.source === "assigned") {
    return `Assigned: ${assignment.effectivePolicy?.name ?? "Custom policy"}`;
  }

  if (assignment.source === "inherited") {
    return `Inherited from organization: ${assignment.effectivePolicy?.name ?? "Default policy"}`;
  }

  return "No SLA policy configured";
}

export function ClientSlaPolicySection({
  clientId,
  assignment,
  policies,
  readOnly = false,
}: ClientSlaPolicySectionProps) {
  const policy = assignment.effectivePolicy;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/10 p-4">
        <p className="text-sm font-semibold text-foreground">{assignmentHeading(assignment)}</p>
        {policy ? (
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                Policy name
              </dt>
              <dd className="mt-1 text-sm text-foreground">{policy.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                Incident response
              </dt>
              <dd className="mt-1 text-sm text-foreground">{formatSlaHours(policy.incident_hours)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                Risk response
              </dt>
              <dd className="mt-1 text-sm text-foreground">{formatSlaHours(policy.risk_hours)}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Create a default SLA policy in settings to enable response-time tracking.
          </p>
        )}
        <p className="mt-4 text-xs text-muted">
          {assignment.source === "assigned"
            ? "This client uses a dedicated SLA policy."
            : assignment.source === "inherited"
              ? "This client inherits the organization default unless a specific policy is assigned."
              : "Open incidents and risks will not have SLA targets until a policy exists."}
        </p>
      </div>

      <ClientSlaPolicyForm
        clientId={clientId}
        policies={policies}
        currentPolicyId={assignment.assignedPolicyId}
        defaultPolicy={assignment.source === "inherited" ? assignment.effectivePolicy : policies.find((p) => p.is_default) ?? null}
        readOnly={readOnly}
      />
    </div>
  );
}
