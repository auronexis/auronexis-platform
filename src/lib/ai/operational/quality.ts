import type {
  OperationalAIContext,
  OperationalAIWarning,
  OperationalChecklistItem,
  OperationalContextSnapshot,
  OperationalRelatedItem,
  OperationalRiskAssessment,
} from "@/lib/ai/operational/types";

export function buildOperationalContextSnapshot(
  context: OperationalAIContext,
): OperationalContextSnapshot {
  return {
    clientName: context.clientName,
    entityTitle: context.title,
    severity: context.severity,
    status: context.status,
    assignee: context.assigneeName,
    slaPolicy: context.slaPolicyName,
    openRisksCount: context.openRisksCount,
    openIncidentsCount: context.openIncidentsCount,
    relatedReportsCount: context.relatedReports.length,
    recentActivityCount: context.recentActivity.length,
    customerHealth: context.customerHealth,
  };
}

export function buildOperationalWarnings(context: OperationalAIContext): OperationalAIWarning[] {
  const warnings: OperationalAIWarning[] = [];

  if (context.entityType === "incident") {
    if (!context.assigneeName && context.severity === "critical") {
      warnings.push({
        id: "no-assignee",
        message: "Critical incident without assignee — assign an owner immediately.",
      });
    }
    if (context.slaBreached) {
      warnings.push({ id: "sla-breach", message: "Incident is older than SLA or breached." });
    }
    if (!context.description.trim()) {
      warnings.push({ id: "no-investigation", message: "Missing investigation notes in description." });
    }
    if (!context.resolutionNotes.trim() && context.status === "investigating") {
      warnings.push({ id: "no-resolution", message: "No resolution notes documented yet." });
    }
  }

  if (context.entityType === "risk") {
    if (context.dueDate && new Date(context.dueDate) < new Date()) {
      warnings.push({ id: "overdue", message: "Risk is overdue — review mitigation progress." });
    }
    if (!context.resolutionNotes.trim()) {
      warnings.push({ id: "no-mitigation", message: "Missing mitigation plan in resolution notes." });
    }
  }

  if (context.customerHealth === "critical") {
    warnings.push({ id: "high-risk-client", message: "High-risk client — handle with elevated care." });
  }

  if (context.recentActivity.length === 0) {
    warnings.push({ id: "no-activity", message: "No recent activity on this entity." });
  }

  return warnings;
}

export function buildOperationalChecklist(
  context: OperationalAIContext,
): OperationalChecklistItem[] {
  if (context.entityType === "risk") {
    return [
      { id: "description", label: "Description", complete: Boolean(context.description.trim()) },
      { id: "impact", label: "Impact", complete: Boolean(context.description.trim()) },
      { id: "mitigation", label: "Mitigation", complete: Boolean(context.resolutionNotes.trim()) },
      { id: "owner", label: "Owner", complete: Boolean(context.assigneeName) },
      { id: "review", label: "Review date", complete: Boolean(context.dueDate) },
    ];
  }

  return [
    { id: "summary", label: "Summary", complete: Boolean(context.description.trim()) },
    { id: "investigation", label: "Investigation", complete: Boolean(context.description.trim()) },
    { id: "resolution", label: "Resolution", complete: Boolean(context.resolutionNotes.trim()) },
    {
      id: "customer",
      label: "Customer update",
      complete: context.recentActivity.some((event) => event.action.includes("email")),
    },
    { id: "sla", label: "SLA reviewed", complete: !context.slaBreached },
  ];
}

export function buildRelatedItems(context: OperationalAIContext): OperationalRelatedItem[] {
  const items: OperationalRelatedItem[] = [
    {
      id: `client-${context.clientId}`,
      title: context.clientName,
      href: `/clients/${context.clientId}`,
      kind: "client",
    },
  ];

  if (context.assigneeName) {
    items.push({
      id: "engineer",
      title: context.assigneeName,
      href: "/settings/team",
      kind: "engineer",
    });
  }

  if (context.slaPolicyName) {
    items.push({
      id: "sla",
      title: context.slaPolicyName,
      href: "/settings/sla",
      kind: "sla",
    });
  }

  for (const risk of context.openRisks.slice(0, 3)) {
    items.push({
      id: risk.id,
      title: risk.title,
      href: `/risks/${risk.id}`,
      kind: "risk",
    });
  }

  for (const incident of context.openIncidents.slice(0, 3)) {
    items.push({
      id: incident.id,
      title: incident.title,
      href: `/incidents/${incident.id}`,
      kind: "incident",
    });
  }

  for (const report of context.relatedReports.slice(0, 2)) {
    items.push({
      id: report.id,
      title: report.title,
      href: `/reports/${report.id}`,
      kind: "report",
    });
  }

  return items;
}

export function calculateOperationalConfidence(context: OperationalAIContext): {
  score: number;
  label: string;
} {
  let score = 35;
  if (context.description.trim()) score += 15;
  if (context.resolutionNotes.trim()) score += 10;
  if (context.assigneeName) score += 10;
  if (context.recentActivity.length > 0) score += 10;
  if (context.relatedReports.length > 0) score += 5;
  if (context.openRisks.length > 0 || context.openIncidents.length > 0) score += 5;
  if (context.slaPolicyName) score += 5;
  if (context.customerHealth) score += 5;

  const clamped = Math.min(100, score);
  let label = "Low";
  if (clamped >= 75) label = "High";
  else if (clamped >= 55) label = "Medium";

  return { score: clamped, label };
}

export function parseRiskAssessment(content: string): OperationalRiskAssessment | undefined {
  if (!content.toLowerCase().includes("likelihood")) return undefined;

  return {
    likelihood: extractSection(content, "Likelihood") ?? "Unknown",
    impact: extractSection(content, "Impact") ?? "Unknown",
    priority: extractSection(content, "Priority") ?? "Unknown",
    confidence: extractSection(content, "Confidence") ?? "Medium",
    reasoning: extractSection(content, "Reasoning") ?? content.slice(0, 300),
  };
}

function extractSection(content: string, label: string): string | null {
  const regex = new RegExp(`${label}:\\s*(.+?)(?=\\n[A-Z]|$)`, "is");
  const match = content.match(regex);
  return match?.[1]?.trim() ?? null;
}
