import type { Permission } from "@/lib/authorization/permissions";
import type { PlanFeatureKey } from "@/lib/plans/types";
import type { AnalyticsEventName } from "@/lib/analytics/events";

/** Deterministic workspace activation lifecycle stages. */
export type ActivationStage =
  | "not_started"
  | "getting_started"
  | "building_foundation"
  | "operational"
  | "activated"
  | "mature";

export type ActivationStepCategory =
  | "foundation"
  | "operations"
  | "collaboration"
  | "customer_visibility"
  | "commercial";

export type ActivationStepId =
  | "workspace_created"
  | "organization_profile"
  | "first_client"
  | "first_report"
  | "first_risk_or_incident"
  | "sla_policy"
  | "team_invited"
  | "monitoring_connector"
  | "portal_user"
  | "billing_reviewed";

export type ActivationStepDefinition = {
  id: ActivationStepId;
  label: string;
  description: string;
  href: string;
  category: ActivationStepCategory;
  /** Required for core activation when the step applies to the plan. */
  required: boolean;
  /** Plan feature required for this step to apply. Null = always applicable. */
  planFeature: PlanFeatureKey | null;
  /** Permission required to act on this step. Null = read-only visibility. */
  requiredPermission: Permission | null;
  sortOrder: number;
};

export type ActivationStepStatus = {
  id: ActivationStepId;
  label: string;
  description: string;
  href: string;
  category: ActivationStepCategory;
  required: boolean;
  optional: boolean;
  complete: boolean;
  locked: boolean;
  lockedReason: string | null;
  canAct: boolean;
  requiredPermission: Permission | null;
  sortOrder: number;
};

export type ActivationReadinessCategory = {
  key: ActivationStepCategory;
  label: string;
  completeCount: number;
  applicableCount: number;
};

export type NextBestAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  priority: number;
  category: ActivationStepCategory | "billing" | "orientation";
  requiredPermission: Permission | null;
  requiredEntitlement: PlanFeatureKey | null;
  reason: string;
  analyticsContext: {
    event: AnalyticsEventName;
    props: Record<string, string | number | boolean>;
  };
};

export type ActivationPreferences = {
  welcomeDismissedAt: string | null;
  onboardingDismissedAt: string | null;
  onboardingLastViewedAt: string | null;
  activationMilestoneReachedAt: string | null;
  activationPanelDismissedAt: string | null;
};

export type ActivationDataSnapshot = {
  clientCount: number;
  reportCount: number;
  draftReportCount: number;
  publishedReportCount: number;
  riskCount: number;
  incidentCount: number;
  slaPolicyCount: number;
  teamMemberCount: number;
  pendingInvitationCount: number;
  monitoringConnectorCount: number;
  portalUserCount: number;
  knowledgeItemCount: number;
  openRiskCount: number;
  features: {
    risks: boolean;
    incidents: boolean;
    sla: boolean;
    customerPortal: boolean;
    teamInvites: boolean;
    monitoring: boolean;
    knowledge: boolean;
  };
  billing: {
    hasIssue: boolean;
    isConfigured: boolean;
    blocksCheckout: boolean;
    planKey: string;
    subscriptionStatus: string | null;
  };
};

export type ActivationSnapshot = {
  stage: ActivationStage;
  completionPercent: number;
  applicableStepCount: number;
  completedStepCount: number;
  requiredStepCount: number;
  completedRequiredCount: number;
  firstValueReached: boolean;
  showBeginnerSurfaces: boolean;
  showWelcome: boolean;
  showOnboardingHub: boolean;
  showActivationPanel: boolean;
  steps: ActivationStepStatus[];
  categories: ActivationReadinessCategory[];
  nextBestAction: NextBestAction | null;
  preferences: ActivationPreferences;
  milestoneDescription: string;
};
