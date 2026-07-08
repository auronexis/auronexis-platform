import Link from "next/link";
import { formatSlaHours } from "@/lib/sla/calculations";
import type { ClientSlaAssignment } from "@/lib/sla/types";
import { ClientSlaPolicyForm } from "@/components/settings/client-sla-policy-form";
import { cn } from "@/lib/utils/cn";
import { focusRing, linkText, transitionInteractive } from "@/lib/ui/tokens";
import type { SlaPolicy } from "@/types/database";

type ClientSlaPolicySectionProps = {
  clientId: string;
  assignment: ClientSlaAssignment;
  policies: SlaPolicy[];
  readOnly?: boolean;
  canAssignSla?: boolean;
  slaUpgradeMessage?: string;
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
  canAssignSla = true,
  slaUpgradeMessage,
}: ClientSlaPolicySectionProps) {
  const policy = assignment.effectivePolicy;
  const planRestricted = !readOnly && !canAssignSla;

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
            No SLA policy configured.{" "}
            <Link
              href="/settings/sla"
              className={cn(linkText, "font-medium", transitionInteractive, focusRing)}
            >
              Create one in Settings → SLA.
            </Link>
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

      {policies.length === 0 && canAssignSla ? (
        <div className="rounded-lg border border-dashed border-border-strong bg-muted/5 px-4 py-3 text-sm text-muted">
          No SLA policies exist yet.{" "}
          <Link
            href="/settings/sla"
            className={cn(linkText, "font-medium", transitionInteractive, focusRing)}
          >
            Create one in Settings → SLA.
          </Link>
        </div>
      ) : null}

      <ClientSlaPolicyForm
        clientId={clientId}
        policies={policies}
        currentPolicyId={assignment.assignedPolicyId}
        defaultPolicy={assignment.source === "inherited" ? assignment.effectivePolicy : policies.find((p) => p.is_default) ?? null}
        readOnly={readOnly}
        planRestricted={planRestricted}
        planUpgradeMessage={slaUpgradeMessage}
      />
    </div>
  );
}
