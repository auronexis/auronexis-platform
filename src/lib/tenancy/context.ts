import type { AppUser, Organization, UserRole } from "@/types/database";
import type { PlanKey } from "@/lib/billing/plans";
import { getRequiredPlanLabel, isFeatureEnabled } from "@/lib/plans/features";
import type { PlanFeatureKey } from "@/lib/plans/types";
import {
  canAccessModule,
  canAccessProfitability,
  canAccessSettings,
  type AppModule,
} from "@/lib/rbac/permissions";

/** Authenticated session with organization tenancy context. */
export type SessionContext = {
  authUserId: string;
  email: string;
  user: AppUser;
  organization: Organization;
  role: UserRole;
};

/** Navigation item for the primary sidebar — docs/04 UX. */
export type NavItem = {
  label: string;
  href: string;
  module: AppModule;
  /** When true, item is hidden for roles without module read access. */
  requiresRead?: boolean;
  planFeature?: PlanFeatureKey;
  /** When true, show a locked nav item instead of hiding it. */
  showLocked?: boolean;
};

export type NavItemView = NavItem & {
  locked: boolean;
  requiredPlanLabel?: string;
};

export const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", module: "dashboard", requiresRead: true },
  { label: "Adoption", href: "/adoption", module: "dashboard", requiresRead: true },
  {
    label: "Customer Success",
    href: "/customer-success",
    module: "customer_success",
    requiresRead: true,
  },
  {
    label: "Intelligence",
    href: "/intelligence",
    module: "executive_intelligence",
    requiresRead: true,
  },
  {
    label: "Ask Auroranexis",
    href: "/copilot",
    module: "dashboard",
    requiresRead: true,
    planFeature: "ai_report_assistant",
    showLocked: true,
  },
  { label: "Clients", href: "/clients", module: "clients", requiresRead: true },
  {
    label: "Risks",
    href: "/risks",
    module: "risks",
    requiresRead: true,
    planFeature: "risks",
    showLocked: true,
  },
  {
    label: "Incidents",
    href: "/incidents",
    module: "incidents",
    requiresRead: true,
    planFeature: "incidents",
    showLocked: true,
  },
  {
    label: "Monitoring",
    href: "/monitoring",
    module: "monitoring",
    requiresRead: true,
  },
  { label: "Reports", href: "/reports", module: "reports", requiresRead: true },
  {
    label: "Profitability",
    href: "/profitability",
    module: "profitability",
    requiresRead: true,
    planFeature: "profitability",
    showLocked: true,
  },
  {
    label: "Automation",
    href: "/automation",
    module: "workflows",
    requiresRead: true,
    planFeature: "ai_automation_builder",
    showLocked: true,
  },
  {
    label: "Knowledge",
    href: "/knowledge",
    module: "knowledge",
    requiresRead: true,
    planFeature: "ai_knowledge_search",
    showLocked: true,
  },
  { label: "Activity", href: "/activity", module: "activity", requiresRead: true },
  { label: "Team", href: "/settings/team", module: "team", requiresRead: true },
  { label: "Pricing", href: "/settings/plans", module: "pricing", requiresRead: true },
  { label: "Sales", href: "/sales", module: "sales", requiresRead: true },
  { label: "Settings", href: "/settings", module: "settings", requiresRead: true },
];

function passesRoleFilter(item: NavItem, role: UserRole): boolean {
  if (item.module === "profitability") {
    return canAccessProfitability(role);
  }
  if (item.module === "settings") {
    return canAccessSettings(role);
  }
  if (item.requiresRead) {
    return canAccessModule(role, item.module, "read");
  }
  return true;
}

function resolveNavItem(
  item: NavItem,
  planKey: PlanKey,
): NavItemView | null {
  if (!item.planFeature) {
    return { ...item, locked: false };
  }

  const allowed = isFeatureEnabled(planKey, item.planFeature);

  if (allowed) {
    return { ...item, locked: false };
  }

  if (item.showLocked) {
    return {
      ...item,
      locked: true,
      requiredPlanLabel: getRequiredPlanLabel(item.planFeature),
    };
  }

  return null;
}

/** Filter navigation items based on the user's role. */
export function getNavItemsForRole(role: UserRole): NavItem[] {
  return PRIMARY_NAV.filter((item) => passesRoleFilter(item, role));
}

/** Filter navigation items based on role and plan features. */
export function getNavItemsForRoleAndPlan(role: UserRole, planKey: PlanKey): NavItemView[] {
  return PRIMARY_NAV.filter((item) => passesRoleFilter(item, role))
    .map((item) => resolveNavItem(item, planKey))
    .filter((item): item is NavItemView => item !== null);
}

/** Generate a URL-safe organization slug from a name. */
export function slugifyOrganizationName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
