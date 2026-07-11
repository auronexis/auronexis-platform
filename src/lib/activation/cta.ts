import type { AnalyticsEventName } from "@/lib/analytics/events";

export type ActivationCtaPreset = {
  id: string;
  label: string;
  href: string;
  variant: "primary" | "secondary" | "ghost" | "outline";
  analyticsEvent?: AnalyticsEventName;
  analyticsProps?: Record<string, string>;
};

export const ACTIVATION_CTA_PRESETS = {
  addFirstClient: {
    id: "add_first_client",
    label: "Add first client",
    href: "/clients/new",
    variant: "primary",
    analyticsEvent: "next_best_action_clicked",
    analyticsProps: { action_id: "add_first_client", module: "clients" },
  },
  configureWorkspace: {
    id: "configure_workspace",
    label: "Configure workspace",
    href: "/settings/branding",
    variant: "outline",
    analyticsEvent: "onboarding_step_viewed",
    analyticsProps: { step_id: "organization_profile" },
  },
  createFirstReport: {
    id: "create_first_report",
    label: "Create first report",
    href: "/reports/new",
    variant: "primary",
    analyticsEvent: "next_best_action_clicked",
    analyticsProps: { action_id: "create_first_report", module: "reports" },
  },
  addOperationalRisk: {
    id: "add_operational_risk",
    label: "Add operational record",
    href: "/risks",
    variant: "secondary",
    analyticsEvent: "next_best_action_clicked",
    analyticsProps: { action_id: "add_operational_risk", module: "risks" },
  },
  inviteTeamMember: {
    id: "invite_team_member",
    label: "Invite team member",
    href: "/settings/team",
    variant: "outline",
    analyticsEvent: "onboarding_step_viewed",
    analyticsProps: { step_id: "team_invited" },
  },
  openActivationHub: {
    id: "open_activation_hub",
    label: "Continue setup",
    href: "/onboarding",
    variant: "secondary",
    analyticsEvent: "onboarding_viewed",
    analyticsProps: { source_route: "dashboard" },
  },
  reviewPlans: {
    id: "review_plans",
    label: "Review plans",
    href: "/settings/plans",
    variant: "outline",
    analyticsEvent: "pricing_viewed",
    analyticsProps: { source: "activation" },
  },
  continueSetup: {
    id: "continue_setup",
    label: "Continue setup",
    href: "/onboarding",
    variant: "primary",
    analyticsEvent: "onboarding_started",
    analyticsProps: { source_route: "welcome" },
  },
} as const satisfies Record<string, ActivationCtaPreset>;

export type ActivationCtaPresetKey = keyof typeof ACTIVATION_CTA_PRESETS;
