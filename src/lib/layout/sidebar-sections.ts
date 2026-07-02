/** Sidebar section grouping — UI only; does not affect routes or permissions. */
export const SIDEBAR_SECTIONS = [
  {
    id: "main",
    label: "Main",
    itemLabels: ["Dashboard"],
  },
  {
    id: "operations",
    label: "Operations",
    itemLabels: ["Clients", "Reports", "Automation", "Knowledge", "Activity"],
  },
  {
    id: "monitoring",
    label: "Monitoring",
    itemLabels: ["Risks", "Incidents", "Monitoring", "Profitability"],
  },
  {
    id: "administration",
    label: "Administration",
    itemLabels: ["Team", "Pricing", "Sales", "Settings"],
  },
] as const;
