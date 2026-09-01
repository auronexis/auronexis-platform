import type { PlanKey } from "@/lib/billing/plans";
import { SETTINGS_NAV_DESTINATIONS } from "@/lib/layout/settings-nav-destinations";
import { getRequiredPlanLabel, isFeatureEnabled } from "@/lib/plans/features";
import type { PlanFeatureKey } from "@/lib/plans/types";
import {
  canAccessModule,
  canAccessProfitability,
  canAccessSettings,
  type AppModule,
} from "@/lib/rbac/permissions";
import { PRIMARY_NAV } from "@/lib/tenancy/context";
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
    | "create"
    | "profile"
    | "copilot"
    | "predictive";
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

const PRIMARY_NAV_ICON: Record<string, WorkspaceSearchAction["icon"]> = {
  Dashboard: "dashboard",
  Adoption: "adoption",
  "Customer Success": "customer-success",
  Intelligence: "intelligence",
  "Ask Auroranexis": "copilot",
  Clients: "clients",
  Risks: "risks",
  Incidents: "incidents",
  Monitoring: "monitoring",
  Reports: "reports",
  Profitability: "profitability",
  Automation: "automation",
  Knowledge: "knowledge",
  Activity: "activity",
  Team: "team",
  Pricing: "pricing",
  Sales: "sales",
  Settings: "settings",
};

const PRIMARY_NAV_KEYWORDS: Record<string, string> = {
  Dashboard: "dashboard home overview executive",
  Adoption: "adoption activation usage features",
  "Customer Success": "customer success health retention cs playbooks",
  Intelligence: "intelligence executive briefings signals",
  "Ask Auroranexis": "copilot ask ai assistant chat",
  Clients: "clients portfolio list accounts",
  Risks: "risks open mitigate register",
  Incidents: "incidents command triage response",
  Monitoring: "monitoring uptime checks alerts",
  Reports: "reports list templates deliverables",
  Profitability: "profitability margin revenue costs",
  Automation: "automation workflows connectors integrations",
  Knowledge: "knowledge hub playbooks articles",
  Activity: "activity feed history audit events",
  Team: "team members invite users roles",
  Pricing: "pricing plans billing subscription tiers",
  Sales: "sales pipeline leads proposals outbound",
  Settings: "settings preferences organization configuration",
};

const PRIMARY_NAV_DESCRIPTIONS: Record<string, string> = {
  Dashboard: "Executive overview and workspace health",
  Adoption: "Feature adoption and activation insights",
  "Customer Success": "Health scores, playbooks, and retention workflows",
  Intelligence: "Executive intelligence and portfolio signals",
  "Ask Auroranexis": "AI copilot for workspace questions and guidance",
  Clients: "Browse and manage your client portfolio",
  Risks: "Review and mitigate client risks",
  Incidents: "Triage operational failures and response queues",
  Monitoring: "Uptime checks and operational monitoring",
  Reports: "Browse reports and templates",
  Profitability: "Margin analysis and client profitability",
  Automation: "Workflows, connectors, and integrations",
  Knowledge: "Articles, playbooks, and organizational learnings",
  Activity: "Workspace activity feed and audit trail",
  Team: "Manage members, roles, and invitations",
  Pricing: "Compare plans and manage subscription",
  Sales: "Pipeline, leads, proposals, and outbound",
  Settings: "Organization and platform configuration",
};

function entriesFromPrimaryNav(): SearchEntry[] {
  return PRIMARY_NAV.map((item) => ({
    href: item.href,
    label: item.label,
    description: PRIMARY_NAV_DESCRIPTIONS[item.label] ?? item.label,
    keywords: PRIMARY_NAV_KEYWORDS[item.label] ?? item.label.toLowerCase(),
    icon: PRIMARY_NAV_ICON[item.label] ?? "dashboard",
    module: item.module,
    requiresRead: item.requiresRead,
    planFeature: item.planFeature,
    showLocked: item.showLocked,
  }));
}

function entriesFromSettingsNav(): SearchEntry[] {
  return SETTINGS_NAV_DESTINATIONS.map((item) => ({
    href: item.href,
    label: item.title,
    description: item.description,
    keywords: item.keywords,
    icon:
      item.href.includes("billing") || item.href.includes("plans")
        ? "billing"
        : item.href.includes("team")
          ? "team"
          : "settings",
    module: item.href.includes("team") ? "team" : "settings",
    requiresRead: true,
    roles: item.adminOnly ? (["owner", "admin"] as const) : undefined,
  }));
}

const SUPPLEMENTAL_SEARCH_REGISTRY: SearchEntry[] = [
  {
    href: "/profile",
    label: "Profile",
    description: "Account preferences, regional settings, and appearance",
    keywords: "profile account timezone locale region appearance theme preferences",
    icon: "profile",
    module: "dashboard",
    requiresRead: true,
  },
  {
    href: "/onboarding",
    label: "Onboarding",
    description: "Workspace setup hub and activation checklist",
    keywords: "onboarding setup activation checklist getting started",
    icon: "dashboard",
    module: "dashboard",
    requiresRead: true,
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
    href: "/dashboard/compliance",
    label: "Compliance",
    description: "Audit readiness, GDPR, retention, and evidence exports",
    keywords: "compliance governance audit gdpr dsgvo nis2 dora retention evidence security",
    icon: "compliance",
    module: "dashboard",
    requiresRead: true,
    roles: ["owner", "admin"],
  },
  {
    href: "/dashboard/compliance/audit",
    label: "Audit explorer",
    description: "Search and export compliance audit events",
    keywords: "audit explorer compliance events export csv json",
    icon: "compliance",
    module: "dashboard",
    requiresRead: true,
    roles: ["owner", "admin"],
  },
  {
    href: "/dashboard/compliance/einvoice-archive",
    label: "E-Invoice Archive",
    description: "Immutable archived e-invoice XML for compliance review",
    keywords: "e-invoice archive zugferd xrechnung compliance integrity retention",
    icon: "compliance",
    module: "dashboard",
    requiresRead: true,
    roles: ["owner", "admin"],
  },
  {
    href: "/dashboard/insights",
    label: "Insights",
    description: "Operational insights and portfolio analytics",
    keywords: "insights analytics portfolio signals",
    icon: "intelligence",
    module: "executive_intelligence",
    requiresRead: true,
  },
  {
    href: "/predictive",
    label: "Predictive",
    description: "Predictive health and anomaly signals",
    keywords: "predictive forecast anomaly intelligence",
    icon: "predictive",
    module: "executive_intelligence",
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
    href: "/reports/new",
    label: "Create report",
    description: "Draft a new client report",
    keywords: "report new create draft",
    icon: "create",
    module: "reports",
    requiresRead: true,
  },
  {
    href: "/reports/templates",
    label: "Report templates",
    description: "Manage reusable report templates",
    keywords: "report templates library",
    icon: "reports",
    module: "reports",
    requiresRead: true,
  },
  {
    href: "/reports/schedules",
    label: "Report schedules",
    description: "Schedule recurring report delivery",
    keywords: "report schedules recurring delivery",
    icon: "reports",
    module: "reports",
    requiresRead: true,
  },
  {
    href: "/risks/new",
    label: "Create risk",
    description: "Log a new client risk",
    keywords: "risk new create register",
    icon: "create",
    module: "risks",
    requiresRead: true,
    planFeature: "risks",
    showLocked: true,
  },
  {
    href: "/incidents/new",
    label: "Create incident",
    description: "Open a new operational incident",
    keywords: "incident new create triage",
    icon: "create",
    module: "incidents",
    requiresRead: true,
    planFeature: "incidents",
    showLocked: true,
  },
  {
    href: "/automation/connectors",
    label: "Automation connectors",
    description: "Manage automation connectors and providers",
    keywords: "automation connectors providers integrations",
    icon: "automation",
    module: "workflows",
    requiresRead: true,
    planFeature: "ai_automation_builder",
    showLocked: true,
  },
  {
    href: "/automation/integrations",
    label: "Automation integrations",
    description: "Integration status, secrets, and delivery logs",
    keywords: "automation integrations secrets logs oauth",
    icon: "automation",
    module: "workflows",
    requiresRead: true,
    planFeature: "ai_automation_builder",
    showLocked: true,
  },
  {
    href: "/sales/leads",
    label: "Sales leads",
    description: "Browse and qualify sales leads",
    keywords: "sales leads pipeline qualify",
    icon: "sales",
    module: "sales",
    requiresRead: true,
  },
  {
    href: "/sales/proposals",
    label: "Sales proposals",
    description: "Create and manage sales proposals",
    keywords: "sales proposals quotes",
    icon: "sales",
    module: "sales",
    requiresRead: true,
  },
  {
    href: "/sales/outbound",
    label: "Sales outbound",
    description: "Outbound lists and outreach workflows",
    keywords: "sales outbound outreach lists",
    icon: "sales",
    module: "sales",
    requiresRead: true,
  },
  {
    href: "/sales/acquisition",
    label: "Sales acquisition",
    description: "Acquisition metrics and funnel",
    keywords: "sales acquisition funnel metrics",
    icon: "sales",
    module: "sales",
    requiresRead: true,
  },
  {
    href: "/settings/plans",
    label: "Plans",
    description: "Compare plans and manage subscription",
    keywords: "plans pricing subscription tiers upgrade",
    icon: "pricing",
    module: "pricing",
    requiresRead: true,
  },
];

/** Deduplicate by href; first registration wins (PRIMARY_NAV / settings take priority). */
function mergeSearchRegistry(parts: SearchEntry[][]): SearchEntry[] {
  const seen = new Set<string>();
  const merged: SearchEntry[] = [];
  for (const part of parts) {
    for (const entry of part) {
      if (seen.has(entry.href)) continue;
      seen.add(entry.href);
      merged.push(entry);
    }
  }
  return merged;
}

export const WORKSPACE_SEARCH_REGISTRY: SearchEntry[] = mergeSearchRegistry([
  entriesFromPrimaryNav(),
  entriesFromSettingsNav(),
  SUPPLEMENTAL_SEARCH_REGISTRY,
]);

/** Href set used by regression tests — every PRIMARY_NAV and Settings hub destination. */
export function getCanonicalSearchableHrefs(): string[] {
  return WORKSPACE_SEARCH_REGISTRY.map((entry) => entry.href);
}

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
