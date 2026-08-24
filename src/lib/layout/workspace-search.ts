import type { PlanKey } from "@/lib/billing/plans";
import { getRequiredPlanLabel, isFeatureEnabled } from "@/lib/plans/features";
import type { PlanFeatureKey } from "@/lib/plans/types";
import {
  canAccessModule,
  canAccessProfitability,
  canAccessSettings,
  type AppModule,
} from "@/lib/rbac/permissions";
import type { UserRole } from "@/types/database";

export type WorkspaceSearchAction = {
  href: string;
  label: string;
  description: string;
  keywords: string;
  icon:
    | "dashboard"
    | "adoption"
    | "intelligence"
    | "clients"
    | "customer-success"
    | "reports"
    | "automation"
    | "knowledge"
    | "activity"
    | "risks"
    | "incidents"
    | "monitoring"
    | "profitability"
    | "team"
    | "pricing"
    | "sales"
    | "settings"
    | "compliance"
    | "notifications"
    | "billing"
    | "create";
};

type SearchEntry = {
  href: string;
  label: string;
  description: string;
  keywords: string;
  icon: WorkspaceSearchAction["icon"];
  module: AppModule;
  requiresRead?: boolean;
  planFeature?: PlanFeatureKey;
  showLocked?: boolean;
  /** Restrict visibility beyond module RBAC (e.g. owner/admin-only surfaces). */
  roles?: readonly UserRole[];
};

const WORKSPACE_SEARCH_REGISTRY: SearchEntry[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Executive overview and workspace health",
    keywords: "dashboard home overview executive",
    icon: "dashboard",
    module: "dashboard",
    requiresRead: true,
  },
  {
    href: "/adoption",
    label: "Adoption",
    description: "Feature adoption and activation insights",
    keywords: "adoption activation usage features",
    icon: "adoption",
    module: "dashboard",
    requiresRead: true,
  },
  {
    href: "/intelligence",
    label: "Intelligence",
    description: "Executive intelligence and portfolio signals",
    keywords: "intelligence executive briefings signals",
    icon: "intelligence",
    module: "executive_intelligence",
    requiresRead: true,
  },
  {
    href: "/customer-success",
    label: "Customer Success",
    description: "Health scores, playbooks, and retention workflows",
    keywords: "customer success health retention cs",
    icon: "customer-success",
    module: "customer_success",
    requiresRead: true,
  },
  {
    href: "/clients",
    label: "Clients",
    description: "Browse and manage your client portfolio",
    keywords: "clients portfolio list accounts",
    icon: "clients",
    module: "clients",
    requiresRead: true,
  },
  {
    href: "/clients/new",
    label: "Create client",
    description: "Add a new client to your workspace",
    keywords: "client new create add",
    icon: "create",
    module: "clients",
    requiresRead: true,
  },
  {
    href: "/reports",
    label: "Reports",
    description: "Browse reports and templates",
    keywords: "reports list templates deliverables",
    icon: "reports",
    module: "reports",
    requiresRead: true,
  },
  {
    href: "/reports/new",
    label: "Create report",
    description: "Draft a new client report",
    keywords: "report new create draft",
    icon: "create",
    module: "reports",
    requiresRead: true,
  },
  {
    href: "/automation",
    label: "Automation",
    description: "Workflows, connectors, and integrations",
    keywords: "automation workflows connectors integrations",
    icon: "automation",
    module: "workflows",
    requiresRead: true,
    planFeature: "ai_automation_builder",
    showLocked: true,
  },
  {
    href: "/knowledge",
    label: "Knowledge",
    description: "Articles, playbooks, and organizational learnings",
    keywords: "knowledge hub playbooks articles",
    icon: "knowledge",
    module: "knowledge",
    requiresRead: true,
    planFeature: "ai_knowledge_search",
    showLocked: true,
  },
  {
    href: "/activity",
    label: "Activity",
    description: "Workspace activity feed and audit trail",
    keywords: "activity feed history audit events",
    icon: "activity",
    module: "activity",
    requiresRead: true,
  },
  {
    href: "/risks",
    label: "Risks",
    description: "Review and mitigate client risks",
    keywords: "risks open mitigate register",
    icon: "risks",
    module: "risks",
    requiresRead: true,
    planFeature: "risks",
    showLocked: true,
  },
  {
    href: "/incidents",
    label: "Incidents",
    description: "Triage operational failures and response queues",
    keywords: "incidents command triage response",
    icon: "incidents",
    module: "incidents",
    requiresRead: true,
    planFeature: "incidents",
    showLocked: true,
  },
  {
    href: "/monitoring",
    label: "Monitoring",
    description: "Uptime checks and operational monitoring",
    keywords: "monitoring uptime checks alerts",
    icon: "monitoring",
    module: "monitoring",
    requiresRead: true,
  },
  {
    href: "/profitability",
    label: "Profitability",
    description: "Margin analysis and client profitability",
    keywords: "profitability margin revenue costs",
    icon: "profitability",
    module: "profitability",
    requiresRead: true,
    planFeature: "profitability",
    showLocked: true,
  },
  {
    href: "/settings/team",
    label: "Team",
    description: "Manage members, roles, and invitations",
    keywords: "team members invite users roles",
    icon: "team",
    module: "team",
    requiresRead: true,
  },
  {
    href: "/settings/plans",
    label: "Pricing",
    description: "Compare plans and manage subscription",
    keywords: "pricing plans billing subscription tiers",
    icon: "pricing",
    module: "pricing",
    requiresRead: true,
  },
  {
    href: "/sales",
    label: "Sales",
    description: "Pipeline, leads, proposals, and outbound",
    keywords: "sales pipeline leads proposals outbound",
    icon: "sales",
    module: "sales",
    requiresRead: true,
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Organization and platform configuration",
    keywords: "settings preferences organization configuration",
    icon: "settings",
    module: "settings",
    requiresRead: true,
  },
  {
    href: "/dashboard/compliance",
    label: "Compliance",
    description: "Audit readiness, GDPR, retention, and evidence exports",
    keywords: "compliance governance audit gdpr retention evidence security",
    icon: "compliance",
    module: "dashboard",
    requiresRead: true,
    roles: ["owner", "admin"],
  },
  {
    href: "/notifications",
    label: "Notifications",
    description: "View recent alerts and updates",
    keywords: "notifications alerts inbox",
    icon: "notifications",
    module: "dashboard",
    requiresRead: true,
    planFeature: "notifications",
  },
  {
    href: "/settings/billing",
    label: "Billing",
    description: "Plans, invoices, and subscription management",
    keywords: "billing subscription invoices payment mollie",
    icon: "billing",
    module: "settings",
    requiresRead: true,
  },
];

function passesRoleFilter(entry: SearchEntry, role: UserRole): boolean {
  if (entry.roles && !entry.roles.includes(role)) {
    return false;
  }
  if (entry.module === "profitability") {
    return canAccessProfitability(role);
  }
  if (entry.module === "settings") {
    return canAccessSettings(role);
  }
  if (entry.requiresRead) {
    return canAccessModule(role, entry.module, "read");
  }
  return true;
}

function passesPlanFilter(entry: SearchEntry, planKey: PlanKey): boolean {
  if (!entry.planFeature) {
    return true;
  }
  if (isFeatureEnabled(planKey, entry.planFeature)) {
    return true;
  }
  return entry.showLocked === true;
}

/** Build Ctrl+K quick actions filtered by RBAC and plan entitlements. */
export function buildWorkspaceSearchActions(
  role: UserRole,
  planKey: PlanKey,
): WorkspaceSearchAction[] {
  return WORKSPACE_SEARCH_REGISTRY.filter(
    (entry) => passesRoleFilter(entry, role) && passesPlanFilter(entry, planKey),
  ).map((entry) => ({
    href: entry.href,
    label: entry.label,
    description: entry.planFeature && !isFeatureEnabled(planKey, entry.planFeature)
      ? `${entry.description} (${getRequiredPlanLabel(entry.planFeature)} plan)`
      : entry.description,
    keywords: entry.keywords,
    icon: entry.icon,
  }));
}
