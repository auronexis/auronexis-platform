import type { ActivationDataSnapshot, ActivationStepDefinition, ActivationStepStatus } from "@/lib/activation/types";
import type { SessionContext } from "@/lib/tenancy/context";
import { sessionHasPermission } from "@/lib/authorization/guards";
import type { PlanFeatureKey, PlanFeatures } from "@/lib/plans/types";

export const ACTIVATION_STEP_DEFINITIONS: readonly ActivationStepDefinition[] = [
  {
    id: "workspace_created",
    label: "Workspace created",
    description: "Your Auroranexis organization is ready.",
    href: "/dashboard",
    category: "foundation",
    required: true,
    planFeature: null,
    requiredPermission: null,
    sortOrder: 10,
  },
  {
    id: "organization_profile",
    label: "Workspace profile configured",
    description: "Review branding and workspace settings.",
    href: "/settings/branding",
    category: "foundation",
    required: false,
    planFeature: null,
    requiredPermission: "settings.write",
    sortOrder: 20,
  },
  {
    id: "first_client",
    label: "First client created",
    description: "Add a client to anchor monitoring and delivery.",
    href: "/clients/new",
    category: "foundation",
    required: true,
    planFeature: null,
    requiredPermission: "clients.write",
    sortOrder: 30,
  },
  {
    id: "first_report",
    label: "First report created",
    description: "Publish a client report to demonstrate delivery value.",
    href: "/reports/new",
    category: "operations",
    required: true,
    planFeature: "reports",
    requiredPermission: "reports.write",
    sortOrder: 40,
  },
  {
    id: "first_risk_or_incident",
    label: "First operational record",
    description: "Record a risk or incident to activate operational intelligence.",
    href: "/risks",
    category: "operations",
    required: true,
    planFeature: "risks",
    requiredPermission: "risks.write",
    sortOrder: 50,
  },
  {
    id: "sla_policy",
    label: "SLA policy configured",
    description: "Define response and resolution commitments.",
    href: "/settings/sla",
    category: "operations",
    required: false,
    planFeature: "sla_tracking",
    requiredPermission: "sla.write",
    sortOrder: 60,
  },
  {
    id: "team_invited",
    label: "Team member invited",
    description: "Invite colleagues to collaborate on delivery.",
    href: "/settings/team",
    category: "collaboration",
    required: false,
    planFeature: null,
    requiredPermission: "users.write",
    sortOrder: 70,
  },
  {
    id: "monitoring_connector",
    label: "Monitoring connector added",
    description: "Connect operational signals from your stack.",
    href: "/monitoring",
    category: "operations",
    required: false,
    planFeature: null,
    requiredPermission: null,
    sortOrder: 80,
  },
  {
    id: "portal_user",
    label: "Customer portal user created",
    description: "Give clients visibility into delivery and health.",
    href: "/clients",
    category: "customer_visibility",
    required: false,
    planFeature: "customer_portal",
    requiredPermission: "clients.write",
    sortOrder: 90,
  },
  {
    id: "billing_reviewed",
    label: "Billing plan reviewed",
    description: "Review plans and subscription options for your workspace.",
    href: "/settings/plans",
    category: "commercial",
    required: false,
    planFeature: null,
    requiredPermission: "settings.write",
    sortOrder: 100,
  },
] as const;

const CATEGORY_LABELS: Record<ActivationStepStatus["category"], string> = {
  foundation: "Foundation",
  operations: "Operations",
  collaboration: "Collaboration",
  customer_visibility: "Customer visibility",
  commercial: "Commercial readiness",
};

export function getActivationCategoryLabel(category: ActivationStepStatus["category"]): string {
  return CATEGORY_LABELS[category];
}

function isPlanFeatureAvailable(
  feature: PlanFeatureKey | null,
  planFeatures: PlanFeatures | null,
): boolean {
  if (!feature || !planFeatures) {
    return !feature;
  }
  return Boolean(planFeatures[feature]);
}

function isStepComplete(id: ActivationStepDefinition["id"], snapshot: ActivationDataSnapshot): boolean {
  switch (id) {
    case "workspace_created":
      return true;
    case "organization_profile":
      return snapshot.clientCount > 0 || snapshot.teamMemberCount > 1;
    case "first_client":
      return snapshot.clientCount > 0;
    case "first_report":
      return snapshot.reportCount > 0 || snapshot.draftReportCount > 0;
    case "first_risk_or_incident":
      if (snapshot.features.incidents && snapshot.incidentCount > 0) {
        return true;
      }
      if (snapshot.features.risks && snapshot.riskCount > 0) {
        return true;
      }
      return false;
    case "sla_policy":
      return snapshot.slaPolicyCount > 0;
    case "team_invited":
      return snapshot.teamMemberCount > 1 || snapshot.pendingInvitationCount > 0;
    case "monitoring_connector":
      return snapshot.monitoringConnectorCount > 0;
    case "portal_user":
      return snapshot.portalUserCount > 0;
    case "billing_reviewed":
      return snapshot.billing.isConfigured;
    default:
      return false;
  }
}

function resolveLockedReason(
  definition: ActivationStepDefinition,
  applicable: boolean,
  planFeatures: PlanFeatures | null,
): string | null {
  if (applicable) {
    return null;
  }
  if (definition.planFeature) {
    const enabled = planFeatures ? Boolean(planFeatures[definition.planFeature]) : false;
    if (!enabled) {
      return "Available on a higher plan.";
    }
  }
  return "Not available on your current plan.";
}

/** Build step statuses from persisted product data — never page-visit based. */
export function buildActivationSteps(
  snapshot: ActivationDataSnapshot,
  session: SessionContext,
  planFeatures: PlanFeatures | null,
): ActivationStepStatus[] {
  return ACTIVATION_STEP_DEFINITIONS.map((definition) => {
    const featureAvailable = isPlanFeatureAvailable(definition.planFeature, planFeatures);
    const incidentsOnly =
      definition.id === "first_risk_or_incident" &&
      !snapshot.features.risks &&
      snapshot.features.incidents;

    const applicable =
      definition.id === "workspace_created" ||
      (definition.id === "first_risk_or_incident"
        ? snapshot.features.risks || snapshot.features.incidents
        : featureAvailable);

    const locked = !applicable;
    const complete = applicable && isStepComplete(definition.id, snapshot);
    const canAct =
      !locked &&
      !complete &&
      (definition.requiredPermission
        ? sessionHasPermission(session, definition.requiredPermission)
        : true);

    const href =
      definition.id === "first_risk_or_incident" && incidentsOnly
        ? "/incidents"
        : definition.id === "portal_user" && snapshot.clientCount === 0
          ? "/clients/new"
          : definition.href;

    return {
      id: definition.id,
      label: definition.label,
      description:
        definition.id === "first_risk_or_incident" && incidentsOnly
          ? "Record an incident to activate operational intelligence."
          : definition.description,
      href,
      category: definition.category,
      required: definition.required && applicable,
      optional: applicable && !definition.required,
      complete,
      locked,
      lockedReason: resolveLockedReason(definition, applicable, planFeatures),
      canAct,
      requiredPermission: definition.requiredPermission,
      sortOrder: definition.sortOrder,
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder);
}
