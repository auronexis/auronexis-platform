/** Shared operational guidance for module empty states. */
export const ACTIVATION_EMPTY_STATE_LINKS = {
  onboarding: { href: "/onboarding", label: "Open setup hub" },
  dashboard: { href: "/dashboard", label: "Back to dashboard" },
  clients: { href: "/clients/new", label: "Add client" },
  reports: { href: "/reports/new", label: "Create report" },
  risks: { href: "/risks", label: "Add risk" },
  incidents: { href: "/incidents", label: "View incidents" },
  monitoring: { href: "/monitoring", label: "Add connector" },
  team: { href: "/settings/team", label: "Invite member" },
  sla: { href: "/settings/sla", label: "Create SLA policy" },
  plans: { href: "/settings/plans", label: "Review plans" },
} as const;

export const ACTIVATION_EMPTY_STATE_COPY = {
  clients: {
    title: "No clients yet",
    description:
      "Clients anchor monitoring, reports, and operational intelligence. Add your first client to begin.",
  },
  reports: {
    title: "No reports yet",
    description:
      "Reports demonstrate delivery value to clients and leadership. Create your first report after adding a client.",
  },
  reportsNoClients: {
    title: "Add a client first",
    description: "Reports are created per client. Add a client to start generating delivery reports.",
  },
  risks: {
    title: "No risks recorded",
    description:
      "Track operational risks across your portfolio to prioritize mitigation and executive reporting.",
  },
  incidents: {
    title: "No incidents detected",
    description:
      "Incidents surface delivery issues requiring response. Record incidents to activate operational workflows.",
  },
  monitoring: {
    title: "No monitoring connectors",
    description:
      "Connectors collect infrastructure signals that inform risks, incidents, and health scoring.",
  },
  profitability: {
    title: "No profitability data",
    description:
      "Profitability insights require clients with revenue configuration. Add clients and financial data to begin.",
  },
  team: {
    title: "Invite your team",
    description:
      "Collaborate on incidents, reports, and client delivery by inviting workspace members.",
  },
  sla: {
    title: "No SLA policies defined",
    description:
      "SLA policies define response and resolution commitments for client delivery and compliance.",
  },
  sales: {
    title: "Start your sales pipeline",
    description:
      "Track leads, proposals, and customer onboarding to grow your agency revenue.",
  },
} as const;
