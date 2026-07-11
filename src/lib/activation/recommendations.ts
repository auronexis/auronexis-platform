import type {
  ActivationDataSnapshot,
  ActivationStage,
  ActivationStepStatus,
  NextBestAction,
} from "@/lib/activation/types";
import type { SessionContext } from "@/lib/tenancy/context";
import type { OrganizationPlanContext } from "@/lib/plans/types";
import { sessionHasPermission } from "@/lib/authorization/guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";

type NextBestActionInput = {
  session: SessionContext;
  snapshot: ActivationDataSnapshot;
  steps: ActivationStepStatus[];
  stage: ActivationStage;
  planContext: OrganizationPlanContext | null;
};

const ACTION_PRIORITY: Record<string, number> = {
  "billing-issue": 100,
  "first-client": 90,
  "first-report": 85,
  "first-operational": 80,
  "invite-team": 60,
  "sla-policy": 55,
  "monitoring-connector": 50,
  "portal-user": 45,
  "configure-billing": 40,
  "review-risks": 35,
  "orientation-readonly": 20,
};

function canPerform(session: SessionContext, permission: NextBestAction["requiredPermission"]): boolean {
  if (!permission) {
    return true;
  }
  return sessionHasPermission(session, permission);
}

function buildCandidate(
  input: NextBestActionInput,
  candidate: Omit<NextBestAction, "priority"> & { priorityKey: string },
): NextBestAction | null {
  if (candidate.requiredPermission && !canPerform(input.session, candidate.requiredPermission)) {
    return null;
  }
  return {
    ...candidate,
    priority: ACTION_PRIORITY[candidate.priorityKey] ?? 10,
  };
}

/** Deterministic next-best-action ranking — stable, permission-aware. */
export function buildNextBestAction(input: NextBestActionInput): NextBestAction | null {
  const { session, snapshot, steps, planContext } = input;
  const candidates: NextBestAction[] = [];

  const isReadonly = session.role === "viewer";

  if (isReadonly) {
    const orientation = buildCandidate(input, {
      id: "orientation-readonly",
      title: "Explore workspace intelligence",
      description: "Review clients, reports, and activity to understand current operational posture.",
      href: "/dashboard",
      priorityKey: "orientation-readonly",
      category: "orientation",
      requiredPermission: null,
      requiredEntitlement: null,
      reason: "Read-only orientation for workspace members.",
      analyticsContext: {
        event: "next_best_action_clicked",
        props: { action_id: "orientation-readonly", activation_stage: input.stage, role: "readonly" },
      },
    });
    return orientation;
  }

  if (snapshot.billing.hasIssue && canManageOrganizationSettings(session)) {
    const billingIssue = buildCandidate(input, {
      id: "billing-issue",
      title: "Resolve billing",
      description: "Your subscription needs attention. Review billing to avoid service interruption.",
      href: "/settings/billing",
      priorityKey: "billing-issue",
      category: "billing",
      requiredPermission: "settings.write",
      requiredEntitlement: null,
      reason: "Payment issue blocks commercial readiness.",
      analyticsContext: {
        event: "next_best_action_clicked",
        props: {
          action_id: "billing-issue",
          activation_stage: input.stage,
          module: "billing",
        },
      },
    });
    if (billingIssue) {
      candidates.push(billingIssue);
    }
  }

  const firstClient = steps.find((step) => step.id === "first_client");
  if (firstClient && !firstClient.complete && firstClient.canAct) {
    const action = buildCandidate(input, {
      id: "first-client",
      title: "Add your first client",
      description: "Clients anchor monitoring, reports, risks, and customer delivery.",
      href: firstClient.href,
      priorityKey: "first-client",
      category: "foundation",
      requiredPermission: "clients.write",
      requiredEntitlement: null,
      reason: "No clients exist yet.",
      analyticsContext: {
        event: "next_best_action_clicked",
        props: {
          action_id: "first-client",
          activation_stage: input.stage,
          step_id: "first_client",
          module: "clients",
        },
      },
    });
    if (action) {
      candidates.push(action);
    }
  }

  const firstReport = steps.find((step) => step.id === "first_report");
  if (
    snapshot.clientCount > 0 &&
    firstReport &&
    !firstReport.locked &&
    !firstReport.complete &&
    firstReport.canAct
  ) {
    const action = buildCandidate(input, {
      id: "first-report",
      title: "Create your first report",
      description: "Publish a client report to demonstrate delivery value.",
      href: firstReport.href,
      priorityKey: "first-report",
      category: "operations",
      requiredPermission: "reports.write",
      requiredEntitlement: "reports",
      reason: "Client exists without a report.",
      analyticsContext: {
        event: "next_best_action_clicked",
        props: {
          action_id: "first-report",
          activation_stage: input.stage,
          step_id: "first_report",
          module: "reports",
        },
      },
    });
    if (action) {
      candidates.push(action);
    }
  }

  const operational = steps.find((step) => step.id === "first_risk_or_incident");
  if (
    snapshot.clientCount > 0 &&
    operational &&
    !operational.locked &&
    !operational.complete &&
    operational.canAct
  ) {
    const action = buildCandidate(input, {
      id: "first-operational",
      title: "Record an operational signal",
      description: operational.description,
      href: operational.href,
      priorityKey: "first-operational",
      category: "operations",
      requiredPermission: operational.requiredPermission,
      requiredEntitlement: operational.locked ? null : "risks",
      reason: "Operational intelligence needs a risk or incident.",
      analyticsContext: {
        event: "next_best_action_clicked",
        props: {
          action_id: "first-operational",
          activation_stage: input.stage,
          step_id: "first_risk_or_incident",
          module: "operations",
        },
      },
    });
    if (action) {
      candidates.push(action);
    }
  }

  if (snapshot.openRiskCount > 0 && snapshot.features.risks && canPerform(session, "risks.read")) {
    const action = buildCandidate(input, {
      id: "review-risks",
      title: "Review open risks",
      description: `${snapshot.openRiskCount} open risk${snapshot.openRiskCount === 1 ? "" : "s"} need attention.`,
      href: "/risks?tab=open",
      priorityKey: "review-risks",
      category: "operations",
      requiredPermission: "risks.read",
      requiredEntitlement: "risks",
      reason: "Open risks require review.",
      analyticsContext: {
        event: "next_best_action_clicked",
        props: {
          action_id: "review-risks",
          activation_stage: input.stage,
          module: "risks",
        },
      },
    });
    if (action) {
      candidates.push(action);
    }
  }

  const teamStep = steps.find((step) => step.id === "team_invited");
  if (teamStep && !teamStep.locked && !teamStep.complete && teamStep.canAct) {
    const action = buildCandidate(input, {
      id: "invite-team",
      title: "Invite a team member",
      description: "Collaborate on incidents, reports, and client delivery.",
      href: teamStep.href,
      priorityKey: "invite-team",
      category: "collaboration",
      requiredPermission: "users.write",
      requiredEntitlement: null,
      reason: "Workspace has a single member.",
      analyticsContext: {
        event: "next_best_action_clicked",
        props: {
          action_id: "invite-team",
          activation_stage: input.stage,
          step_id: "team_invited",
          module: "team",
        },
      },
    });
    if (action) {
      candidates.push(action);
    }
  }

  const slaStep = steps.find((step) => step.id === "sla_policy");
  if (
    slaStep &&
    !slaStep.locked &&
    !slaStep.complete &&
    slaStep.canAct &&
    snapshot.clientCount > 0
  ) {
    const action = buildCandidate(input, {
      id: "sla-policy",
      title: "Configure SLA policies",
      description: "Define response and resolution commitments for clients.",
      href: slaStep.href,
      priorityKey: "sla-policy",
      category: "operations",
      requiredPermission: "sla.write",
      requiredEntitlement: "sla_tracking",
      reason: "SLA tracking is available but not configured.",
      analyticsContext: {
        event: "next_best_action_clicked",
        props: {
          action_id: "sla-policy",
          activation_stage: input.stage,
          step_id: "sla_policy",
          module: "sla",
          optional: true,
        },
      },
    });
    if (action) {
      candidates.push(action);
    }
  }

  const monitoringStep = steps.find((step) => step.id === "monitoring_connector");
  if (
    monitoringStep &&
    !monitoringStep.locked &&
    !monitoringStep.complete &&
    snapshot.clientCount > 0 &&
    canPerform(session, "clients.read")
  ) {
    const action = buildCandidate(input, {
      id: "monitoring-connector",
      title: "Add a monitoring connector",
      description: "Collect operational signals from your infrastructure.",
      href: monitoringStep.href,
      priorityKey: "monitoring-connector",
      category: "operations",
      requiredPermission: null,
      requiredEntitlement: null,
      reason: "Monitoring connectors improve signal coverage.",
      analyticsContext: {
        event: "next_best_action_clicked",
        props: {
          action_id: "monitoring-connector",
          activation_stage: input.stage,
          step_id: "monitoring_connector",
          module: "monitoring",
          optional: true,
        },
      },
    });
    if (action) {
      candidates.push(action);
    }
  }

  const portalStep = steps.find((step) => step.id === "portal_user");
  if (portalStep && !portalStep.locked && !portalStep.complete && portalStep.canAct && snapshot.clientCount > 0) {
    const action = buildCandidate(input, {
      id: "portal-user",
      title: "Enable customer portal access",
      description: "Give clients visibility into delivery and health.",
      href: portalStep.href,
      priorityKey: "portal-user",
      category: "customer_visibility",
      requiredPermission: "clients.write",
      requiredEntitlement: "customer_portal",
      reason: "Customer portal is available but unused.",
      analyticsContext: {
        event: "next_best_action_clicked",
        props: {
          action_id: "portal-user",
          activation_stage: input.stage,
          step_id: "portal_user",
          module: "portal",
          optional: true,
        },
      },
    });
    if (action) {
      candidates.push(action);
    }
  }

  if (
    !snapshot.billing.isConfigured &&
    !snapshot.billing.hasIssue &&
    !snapshot.billing.blocksCheckout &&
    canManageOrganizationSettings(session)
  ) {
    const action = buildCandidate(input, {
      id: "configure-billing",
      title: "Review plans",
      description: "Compare plans and configure billing when your workspace is ready.",
      href: "/settings/plans",
      priorityKey: "configure-billing",
      category: "commercial",
      requiredPermission: "settings.write",
      requiredEntitlement: null,
      reason: "Billing has not been reviewed.",
      analyticsContext: {
        event: "next_best_action_clicked",
        props: {
          action_id: "configure-billing",
          activation_stage: input.stage,
          module: "billing",
          optional: true,
          plan_key: planContext?.planKey ?? "starter",
        },
      },
    });
    if (action) {
      candidates.push(action);
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => b.priority - a.priority);
  return candidates[0] ?? null;
}
