import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  KnowledgeArticle,
  KnowledgeEntityRef,
  KnowledgePlaybook,
  KnowledgeSourceType,
} from "@/lib/ai/knowledge/types";
import { PLAYBOOK_TITLES } from "@/lib/ai/knowledge/types";
import type { SessionContext } from "@/lib/tenancy/context";

function excerpt(text: string | null | undefined, max = 180): string {
  const value = text?.trim() ?? "";
  if (!value) return "";
  return value.length <= max ? value : `${value.slice(0, max)}…`;
}

function buildRef(input: {
  id: string;
  title: string;
  href: string;
  excerpt: string;
  date: string;
  entityType: KnowledgeSourceType;
  clientId?: string | null;
  clientName?: string | null;
  severity?: string | null;
  status?: string | null;
  tags?: string[];
}): KnowledgeEntityRef {
  return {
    entityId: input.id,
    entityType: input.entityType,
    title: input.title,
    href: input.href,
    excerpt: input.excerpt,
    date: input.date,
    clientId: input.clientId,
    clientName: input.clientName,
    severity: input.severity,
    status: input.status,
    tags: input.tags ?? [],
  };
}

export async function fetchPublishedReports(
  session: SessionContext,
  clientId?: string,
  limit = 20,
): Promise<KnowledgeEntityRef[]> {
  const supabase = await createClient();
  let query = supabase
    .from("reports")
    .select("id, title, status, executive_summary, updated_at, client_id, clients(name)")
    .eq("organization_id", session.organization.id)
    .in("status", ["published", "sent"]);

  if (clientId) query = query.eq("client_id", clientId);

  const { data } = await query.order("updated_at", { ascending: false }).limit(limit);
  return (data ?? []).map((row) => {
    const report = row as {
      id: string;
      title: string;
      status: string;
      executive_summary: string | null;
      updated_at: string;
      client_id: string;
      clients: { name: string } | null;
    };
    return buildRef({
      id: report.id,
      title: report.title,
      href: `/reports/${report.id}`,
      excerpt: excerpt(report.executive_summary),
      date: report.updated_at,
      entityType: "report",
      clientId: report.client_id,
      clientName: report.clients?.name ?? null,
      status: report.status,
      tags: ["report", "published"],
    });
  });
}

export async function fetchResolvedRisks(
  session: SessionContext,
  clientId?: string,
  limit = 20,
): Promise<KnowledgeEntityRef[]> {
  const supabase = await createClient();
  let query = supabase
    .from("risks")
    .select("id, title, severity, status, description, resolution_notes, updated_at, client_id, clients(name)")
    .eq("organization_id", session.organization.id)
    .in("status", ["resolved", "archived"]);

  if (clientId) query = query.eq("client_id", clientId);

  const { data } = await query.order("updated_at", { ascending: false }).limit(limit);
  return (data ?? []).map((row) => {
    const risk = row as {
      id: string;
      title: string;
      severity: string;
      status: string;
      description: string | null;
      resolution_notes: string | null;
      updated_at: string;
      client_id: string;
      clients: { name: string } | null;
    };
    return buildRef({
      id: risk.id,
      title: risk.title,
      href: `/risks/${risk.id}`,
      excerpt: excerpt(risk.resolution_notes || risk.description),
      date: risk.updated_at,
      entityType: "risk",
      clientId: risk.client_id,
      clientName: risk.clients?.name ?? null,
      severity: risk.severity,
      status: risk.status,
      tags: ["risk", "mitigation"],
    });
  });
}

export async function fetchResolvedIncidents(
  session: SessionContext,
  clientId?: string,
  limit = 20,
): Promise<KnowledgeEntityRef[]> {
  const supabase = await createClient();
  let query = supabase
    .from("incidents")
    .select("id, title, severity, status, description, resolution_notes, updated_at, client_id, clients(name)")
    .eq("organization_id", session.organization.id)
    .in("status", ["resolved", "archived"]);

  if (clientId) query = query.eq("client_id", clientId);

  const { data } = await query.order("updated_at", { ascending: false }).limit(limit);
  return (data ?? []).map((row) => {
    const incident = row as {
      id: string;
      title: string;
      severity: string;
      status: string;
      description: string | null;
      resolution_notes: string | null;
      updated_at: string;
      client_id: string;
      clients: { name: string } | null;
    };
    return buildRef({
      id: incident.id,
      title: incident.title,
      href: `/incidents/${incident.id}`,
      excerpt: excerpt(incident.resolution_notes || incident.description),
      date: incident.updated_at,
      entityType: "incident",
      clientId: incident.client_id,
      clientName: incident.clients?.name ?? null,
      severity: incident.severity,
      status: incident.status,
      tags: ["incident", "resolution"],
    });
  });
}

export async function fetchReportTemplates(
  session: SessionContext,
  limit = 10,
): Promise<KnowledgeEntityRef[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("report_templates")
    .select("id, name, executive_summary_template, updated_at")
    .eq("organization_id", session.organization.id)
    .order("updated_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const template = row as {
      id: string;
      name: string;
      executive_summary_template: string | null;
      updated_at: string;
    };
    return buildRef({
      id: template.id,
      title: template.name,
      href: `/reports/templates/${template.id}`,
      excerpt: excerpt(template.executive_summary_template),
      date: template.updated_at,
      entityType: "template",
      tags: ["template"],
    });
  });
}

export function buildArticlesFromHistory(input: {
  reports: KnowledgeEntityRef[];
  risks: KnowledgeEntityRef[];
  incidents: KnowledgeEntityRef[];
}): KnowledgeArticle[] {
  const articles: KnowledgeArticle[] = [];

  for (const incident of input.incidents.slice(0, 8)) {
    if (!incident.excerpt) continue;
    articles.push({
      id: `article-incident-${incident.entityId}`,
      title: `Resolution: ${incident.title}`,
      summary: incident.excerpt,
      problem: incident.excerpt,
      resolution: incident.excerpt,
      lessonsLearned: "Derived from verified resolved incident notes.",
      recommendations: "Review similar incidents before responding to repeat issues.",
      relatedEntities: [incident],
      generatedFrom: "incident",
      sourceId: incident.entityId,
      sourceHref: incident.href,
      createdAt: incident.date,
      updatedAt: incident.date,
      confidence: 72,
      clientId: incident.clientId,
      clientName: incident.clientName,
    });
  }

  for (const risk of input.risks.slice(0, 6)) {
    if (!risk.excerpt) continue;
    articles.push({
      id: `article-risk-${risk.entityId}`,
      title: `Mitigation: ${risk.title}`,
      summary: risk.excerpt,
      problem: risk.excerpt,
      resolution: risk.excerpt,
      lessonsLearned: "Derived from verified risk mitigation notes.",
      recommendations: "Apply mitigation patterns that succeeded previously.",
      relatedEntities: [risk],
      generatedFrom: "risk",
      sourceId: risk.entityId,
      sourceHref: risk.href,
      createdAt: risk.date,
      updatedAt: risk.date,
      confidence: 68,
      clientId: risk.clientId,
      clientName: risk.clientName,
    });
  }

  for (const report of input.reports.slice(0, 4)) {
    if (!report.excerpt) continue;
    articles.push({
      id: `article-report-${report.entityId}`,
      title: `Report insight: ${report.title}`,
      summary: report.excerpt,
      problem: "Operational context from published report period.",
      resolution: report.excerpt,
      lessonsLearned: "Historical executive summary from verified report.",
      recommendations: report.excerpt,
      relatedEntities: [report],
      generatedFrom: "report",
      sourceId: report.entityId,
      sourceHref: report.href,
      createdAt: report.date,
      updatedAt: report.date,
      confidence: 75,
      clientId: report.clientId,
      clientName: report.clientName,
    });
  }

  return articles;
}

export function buildPlaybooksFromHistory(input: {
  incidents: KnowledgeEntityRef[];
  risks: KnowledgeEntityRef[];
  reports: KnowledgeEntityRef[];
}): KnowledgePlaybook[] {
  const playbooks: KnowledgePlaybook[] = [];
  const criticalIncidents = input.incidents.filter((item) => item.severity === "critical");
  const slaIncidents = input.incidents.filter((item) =>
    item.tags.includes("resolution") || item.title.toLowerCase().includes("sla"),
  );

  const mappings: Array<{ title: (typeof PLAYBOOK_TITLES)[number]; items: KnowledgeEntityRef[]; steps: string[] }> = [
    {
      title: "Critical Incident Response",
      items: criticalIncidents,
      steps: [
        "Assign owner and confirm severity.",
        "Review previous critical incident resolutions in Knowledge Hub.",
        "Document investigation notes and customer update.",
        "Verify SLA impact and escalate if breached.",
      ],
    },
    {
      title: "SLA Breach",
      items: slaIncidents,
      steps: [
        "Confirm SLA policy and breach timestamp.",
        "Search Knowledge Hub for prior SLA breach resolutions.",
        "Prepare customer communication and internal update.",
        "Schedule review to prevent recurrence.",
      ],
    },
    {
      title: "Executive Reporting",
      items: input.reports,
      steps: [
        "Review last published report for the client.",
        "Incorporate verified wins, risks, and recommendations.",
        "Cross-check operational intelligence and client health.",
        "Publish only after internal review.",
      ],
    },
  ];

  for (const mapping of mappings) {
    if (mapping.items.length === 0) continue;
    playbooks.push({
      id: `playbook-${mapping.title.toLowerCase().replace(/\s+/g, "-")}`,
      title: mapping.title,
      summary: `Evolved from ${mapping.items.length} verified historical record${mapping.items.length === 1 ? "" : "s"}.`,
      steps: mapping.steps,
      relatedEntities: mapping.items.slice(0, 3),
      generatedFrom: "history",
      createdAt: mapping.items[0]?.date ?? new Date().toISOString(),
      updatedAt: mapping.items[0]?.date ?? new Date().toISOString(),
      confidence: Math.min(90, 55 + mapping.items.length * 8),
    });
  }

  return playbooks;
}
