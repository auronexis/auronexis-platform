import type { ActivationSnapshot } from "@/lib/activation/types";
import { sessionHasPermission } from "@/lib/authorization/guards";
import { canInviteTeamMembers } from "@/lib/team/guards";
import { MAX_ADOPTION_RECOMMENDATIONS } from "@/lib/adoption/constants";
import type {
  AdoptionDataSnapshot,
  AdoptionFeatureSignal,
  AdoptionRecommendation,
  AdoptionStage,
  RetentionRiskReason,
} from "@/lib/adoption/types";
import type { SessionContext } from "@/lib/tenancy/context";
import type { OrganizationPlanContext } from "@/lib/plans/types";

type RecommendationInput = {
  session: SessionContext;
  data: AdoptionDataSnapshot;
  featureSignals: AdoptionFeatureSignal[];
  activation: ActivationSnapshot;
  stage: AdoptionStage;
  riskReasons: RetentionRiskReason[];
  planContext: OrganizationPlanContext | null;
};

const PRIORITY: Record<string, number> = {
  re_engage: 100,
  publish_report: 95,
  schedule_reports: 90,
  invite_teammate: 85,
  activate_portal: 80,
  create_automation: 75,
  connect_monitoring: 70,
  review_risks: 65,
  resolve_incidents: 60,
  configure_sla: 55,
  add_profitability: 50,
  adopt_module: 40,
  complete_activation: 35,
};

function canWrite(session: SessionContext, permission: Parameters<typeof sessionHasPermission>[1]): boolean {
  return sessionHasPermission(session, permission);
}

function buildCandidate(
  input: RecommendationInput,
  candidate: Omit<AdoptionRecommendation, "priority" | "permitted" | "available"> & {
    priorityKey: string;
    permission?: Parameters<typeof sessionHasPermission>[1] | null;
    planAvailable?: boolean;
  },
): AdoptionRecommendation | null {
  const available = candidate.planAvailable ?? true;
  const permitted =
    !candidate.permission || canWrite(input.session, candidate.permission);

  if (!available && !candidate.route.includes("plans")) {
    return null;
  }

  return {
    key: candidate.key,
    title: candidate.title,
    description: candidate.description,
    route: candidate.route,
    ctaLabel: candidate.ctaLabel,
    reason: candidate.reason,
    category: candidate.category,
    available,
    permitted,
    priority: PRIORITY[candidate.priorityKey] ?? 10,
  };
}

/** Deterministic adoption recommendations — separate from Phase 22 activation NBA. */
export function buildAdoptionRecommendations(
  input: RecommendationInput,
): AdoptionRecommendation[] {
  const candidates: AdoptionRecommendation[] = [];
  const isReadonly = input.session.role === "viewer";

  if (isReadonly) {
    return [
      {
        key: "explore_adoption",
        title: "Explore adoption insights",
        description: "Review workspace adoption metrics and feature usage.",
        priority: 10,
        route: "/adoption",
        ctaLabel: "View adoption",
        reason: "Read-only workspace member orientation.",
        category: "orientation",
        available: true,
        permitted: true,
      },
    ];
  }

  if (!input.activation.firstValueReached) {
    const action = buildCandidate(input, {
      key: "complete_activation",
      title: "Complete workspace activation",
      description: "Finish core setup before building recurring adoption.",
      route: "/onboarding",
      ctaLabel: "Open setup hub",
      reason: "Activation is not yet complete.",
      category: "foundation",
      priorityKey: "complete_activation",
      permission: null,
    });
    if (action) {
      candidates.push(action);
    }
    return candidates.slice(0, MAX_ADOPTION_RECOMMENDATIONS);
  }

  const reEngage = input.riskReasons.find((r) => r.recommendedActionKey === "re_engage");
  if (reEngage || input.stage === "at_risk" || input.stage === "inactive") {
    const action = buildCandidate(input, {
      key: "re_engage",
      title: "Re-engage your workspace",
      description: "Publish a report or review open operational items to restore momentum.",
      route: "/reports/new",
      ctaLabel: "Create report",
      reason: reEngage?.description ?? "Usage has slowed or stopped.",
      category: "retention",
      priorityKey: "re_engage",
      permission: "reports.write",
    });
    if (action) {
      candidates.push(action);
    }
  }

  if (input.data.publishedReportCount === 0 && input.data.reportCount > 0) {
    const action = buildCandidate(input, {
      key: "publish_report",
      title: "Publish a client report",
      description: "Move a draft report to published status for customer delivery.",
      route: "/reports",
      ctaLabel: "View reports",
      reason: "Draft reports exist without published delivery.",
      category: "recurring_value",
      priorityKey: "publish_report",
      permission: "reports.write",
    });
    if (action) {
      candidates.push(action);
    }
  } else if (
    input.data.publishedReports30d >= 2 &&
    input.data.activeScheduleCount === 0 &&
    input.data.features.scheduling
  ) {
    const action = buildCandidate(input, {
      key: "schedule_reports",
      title: "Schedule recurring reports",
      description: "Automate delivery after repeated manual report publishing.",
      route: "/reports/schedules/new",
      ctaLabel: "Create schedule",
      reason: "Multiple reports published manually without a schedule.",
      category: "recurring_value",
      priorityKey: "schedule_reports",
      permission: "reports.write",
      planAvailable: input.data.features.scheduling,
    });
    if (action) {
      candidates.push(action);
    }
  } else if (input.data.publishedReportCount > 0) {
    const action = buildCandidate(input, {
      key: "publish_report",
      title: "Publish another client report",
      description: "Sustain recurring delivery value with another published report.",
      route: "/reports/new",
      ctaLabel: "New report",
      reason: "Recurring report delivery strengthens adoption.",
      category: "recurring_value",
      priorityKey: "publish_report",
      permission: "reports.write",
    });
    if (action) {
      candidates.push(action);
    }
  }

  if (input.data.teamMemberCount <= 1 && canInviteTeamMembers(input.session)) {
    const action = buildCandidate(input, {
      key: "invite_teammate",
      title: "Invite a teammate",
      description: "Reduce single-user dependency and improve collaboration.",
      route: "/settings/team",
      ctaLabel: "Invite member",
      reason: "Workspace has only one member.",
      category: "collaboration",
      priorityKey: "invite_teammate",
      permission: "users.write",
    });
    if (action) {
      candidates.push(action);
    }
  }

  const portalSignal = input.featureSignals.find((s) => s.key === "client_portal");
  if (
    portalSignal?.available &&
    !portalSignal.adopted &&
    input.data.publishedReportCount > 0
  ) {
    const action = buildCandidate(input, {
      key: "activate_portal",
      title: "Activate client portal",
      description: "Give clients visibility after reports are published.",
      route: "/clients",
      ctaLabel: "Set up portal",
      reason: "Reports exist without customer portal access.",
      category: "customer_visibility",
      priorityKey: "activate_portal",
      permission: "clients.write",
      planAvailable: portalSignal.available,
    });
    if (action) {
      candidates.push(action);
    }
  }

  if (
    input.data.features.automation &&
    input.data.automationWorkflowCount === 0 &&
    input.data.valueEvents30d >= 5
  ) {
    const action = buildCandidate(input, {
      key: "create_automation",
      title: "Create your first automation",
      description: "Automate repeated manual workflows after consistent usage.",
      route: "/automation",
      ctaLabel: "Open automation",
      reason: "Repeated manual activity detected without automation.",
      category: "operations",
      priorityKey: "create_automation",
      planAvailable: input.data.features.automation,
    });
    if (action) {
      candidates.push(action);
    }
  }

  const monitoringSignal = input.featureSignals.find((s) => s.key === "monitoring");
  if (monitoringSignal?.available && !monitoringSignal.adopted) {
    const action = buildCandidate(input, {
      key: "connect_monitoring",
      title: "Connect monitoring",
      description: "Collect operational signals to strengthen workspace intelligence.",
      route: "/monitoring",
      ctaLabel: "Add connector",
      reason: "No monitoring connector configured.",
      category: "operations",
      priorityKey: "connect_monitoring",
      permission: "clients.read",
    });
    if (action) {
      candidates.push(action);
    }
  }

  if (input.data.openRiskCount > 0 && input.data.features.risks) {
    const action = buildCandidate(input, {
      key: "review_risks",
      title: "Review unresolved risks",
      description: `${input.data.openRiskCount} open risk(s) need attention.`,
      route: "/risks?tab=open",
      ctaLabel: "Review risks",
      reason: "Open risks reduce operational confidence.",
      category: "operations",
      priorityKey: "review_risks",
      permission: "risks.read",
      planAvailable: input.data.features.risks,
    });
    if (action) {
      candidates.push(action);
    }
  }

  if (input.data.openIncidentCount > 0 && input.data.features.incidents) {
    const action = buildCandidate(input, {
      key: "resolve_incidents",
      title: "Resolve open incidents",
      description: `${input.data.openIncidentCount} open incident(s) in queue.`,
      route: "/incidents",
      ctaLabel: "View incidents",
      reason: "Unresolved incidents block operational maturity.",
      category: "operations",
      priorityKey: "resolve_incidents",
      permission: "risks.read",
      planAvailable: input.data.features.incidents,
    });
    if (action) {
      candidates.push(action);
    }
  }

  const slaSignal = input.featureSignals.find((s) => s.key === "sla");
  if (slaSignal?.available && !slaSignal.adopted && input.data.clientCount > 0) {
    const action = buildCandidate(input, {
      key: "configure_sla",
      title: "Configure SLA policies",
      description: "Define response commitments for client delivery.",
      route: "/settings/sla/new",
      ctaLabel: "Add SLA",
      reason: "SLA tracking is available but not configured.",
      category: "operations",
      priorityKey: "configure_sla",
      permission: "sla.write",
      planAvailable: slaSignal.available,
    });
    if (action) {
      candidates.push(action);
    }
  }

  const profitSignal = input.featureSignals.find((s) => s.key === "profitability");
  if (profitSignal?.available && !profitSignal.adopted && input.data.clientCount > 0) {
    const action = buildCandidate(input, {
      key: "add_profitability",
      title: "Add profitability data",
      description: "Track financial health alongside operational delivery.",
      route: "/profitability",
      ctaLabel: "Open profitability",
      reason: "Profitability module is available but unused.",
      category: "commercial",
      priorityKey: "add_profitability",
      planAvailable: profitSignal.available,
    });
    if (action) {
      candidates.push(action);
    }
  }

  const unusedRecommended = input.featureSignals.find(
    (s) => s.available && !s.adopted && s.importance === "recommended" && s.route,
  );
  if (unusedRecommended?.route) {
    const action = buildCandidate(input, {
      key: "adopt_module",
      title: `Adopt ${unusedRecommended.label.toLowerCase()}`,
      description: `Expand feature breadth by using ${unusedRecommended.label.toLowerCase()}.`,
      route: unusedRecommended.route,
      ctaLabel: "Get started",
      reason: "Recommended module is available but unused.",
      category: "feature_breadth",
      priorityKey: "adopt_module",
    });
    if (action) {
      candidates.push(action);
    }
  }

  const seen = new Set<string>();
  const unique = candidates
    .filter((c) => {
      if (seen.has(c.key)) {
        return false;
      }
      seen.add(c.key);
      return true;
    })
    .sort((a, b) => b.priority - a.priority);

  return unique.slice(0, MAX_ADOPTION_RECOMMENDATIONS);
}
