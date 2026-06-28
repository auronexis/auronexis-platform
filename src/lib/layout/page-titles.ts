/** Maps dashboard routes to human-readable topbar titles. */
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/clients": "Clients",
  "/clients/new": "New client",
  "/risks": "Risk Center",
  "/risks/new": "New risk",
  "/incidents": "Incident Center",
  "/incidents/new": "New incident",
  "/reports": "Reports",
  "/reports/new": "New report",
  "/reports/templates": "Report templates",
  "/reports/templates/new": "New template",
  "/reports/schedules": "Report schedules",
  "/reports/schedules/new": "New schedule",
  "/profitability": "Profitability",
  "/activity": "Activity",
  "/automation": "Automation",
  "/automation/new": "New automation",
  "/knowledge": "Knowledge Hub",
  "/notifications": "Notifications",
  "/profile": "Profile",
  "/settings/plans": "Plans & Pricing",
  "/settings": "Workspace Settings",
  "/settings/organization": "Organization",
  "/settings/branding": "Branding",
  "/settings/email": "Email delivery",
  "/settings/sla": "SLA policies",
  "/settings/sla/new": "New SLA policy",
  "/settings/escalation": "Escalation rules",
  "/settings/escalation/new": "New escalation rule",
  "/settings/billing": "Subscription & Billing",
  "/settings/team": "Workspace Members",
};
const PARENT_TITLES: Record<string, string> = {
  "/clients": "Client",
  "/risks": "Risk",
  "/incidents": "Incident",
  "/reports": "Report",
  "/reports/templates": "Template",
  "/reports/schedules": "Schedule",
  "/settings/sla": "SLA policy",
  "/settings/escalation": "Escalation rule",
  "/automation": "Automation",
};

function formatSegment(segment: string): string {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Resolve a page title from the current pathname. */
export function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname];
  }

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length >= 2) {
    const parentPath = `/${segments.slice(0, -1).join("/")}`;
    if (PARENT_TITLES[parentPath]) {
      return PARENT_TITLES[parentPath];
    }
    if (PAGE_TITLES[parentPath]) {
      return PAGE_TITLES[parentPath];
    }
  }

  const lastSegment = segments.at(-1);
  if (lastSegment) {
    return formatSegment(lastSegment);
  }

  return "Dashboard";
}
