import type { ClientSuccessAnalysis, ClientSuccessPortfolioEntry, ClientSuccessPortfolioResult, CustomerSuccessHighlight } from "@/lib/ai/client-success/types";
import { generateClientSuccessAnalysis } from "@/lib/ai/client-success/engine";
import { buildClientSuccessSnapshot } from "@/lib/ai/client-success/queries";
import { listClients } from "@/lib/clients/queries";
import type { SessionContext } from "@/lib/tenancy/context";

function toPortfolioEntry(
  analysis: ClientSuccessAnalysis,
  snapshot: NonNullable<Awaited<ReturnType<typeof buildClientSuccessSnapshot>>>,
): ClientSuccessPortfolioEntry {
  return {
    ...analysis,
    monthlyRevenue: snapshot.profitability?.monthlyRevenue ?? 0,
    margin: snapshot.profitability?.margin ?? null,
    status: snapshot.clientStatus,
    openRisks: snapshot.overview.kpis.openRisksCount,
    openIncidents: snapshot.overview.kpis.openIncidentsCount,
  };
}

function buildHighlights(clients: ClientSuccessPortfolioEntry[]): CustomerSuccessHighlight[] {
  const highlights: CustomerSuccessHighlight[] = [];

  const followUp = clients.filter((client) => client.priority === "attention" || client.priority === "critical");
  if (followUp.length > 0) {
    highlights.push({
      id: "follow-up",
      message: `${followUp.length} customer${followUp.length === 1 ? "" : "s"} require follow-up`,
      priority: followUp.some((client) => client.priority === "critical") ? "critical" : "attention",
    });
  }

  const outdatedReports = clients.filter(
    (client) => client.checklist.find((item) => item.id === "reports-current")?.complete === false,
  );
  if (outdatedReports.length > 0) {
    highlights.push({
      id: "outdated-reports",
      message: `${outdatedReports.length} customer${outdatedReports.length === 1 ? "" : "s"} have outdated reports`,
      priority: "attention",
    });
  }

  const strategicRisk = clients
    .filter((client) => client.monthlyRevenue >= 1000 && (client.priority === "attention" || client.priority === "critical"))
    .slice(0, 1);

  if (strategicRisk.length > 0) {
    highlights.push({
      id: "strategic-risk",
      message: `1 strategic customer shows increasing risk (${strategicRisk[0].clientName})`,
      priority: "critical",
    });
  }

  return highlights.slice(0, 5);
}

/** Build portfolio-level client success intelligence. */
export async function buildClientSuccessPortfolio(
  session: SessionContext,
): Promise<ClientSuccessPortfolioResult> {
  const started = Date.now();
  const clients = await listClients(session);
  const entries: ClientSuccessPortfolioEntry[] = [];

  for (const client of clients) {
    const snapshot = await buildClientSuccessSnapshot(session, client.id);
    if (!snapshot) continue;
    const analysis = generateClientSuccessAnalysis(snapshot);
    entries.push(toPortfolioEntry(analysis, snapshot));
  }

  const highestRisk = [...entries].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5);
  const highestValue = [...entries].sort((a, b) => b.monthlyRevenue - a.monthlyRevenue).slice(0, 5);
  const bestPerforming = [...entries]
    .sort((a, b) => b.healthScore - a.healthScore)
    .slice(0, 5);
  const needsAttention = entries
    .filter((entry) => entry.priority === "attention" || entry.priority === "critical")
    .slice(0, 10);
  const mostImproved = [...entries]
    .filter((entry) => entry.trends.some((trend) => trend.id === "health" && trend.direction === "up"))
    .slice(0, 5);

  return {
    clients: entries,
    highlights: buildHighlights(entries),
    highestRisk,
    highestValue,
    mostImproved,
    needsAttention,
    bestPerforming,
    generatedAt: new Date().toISOString(),
    providerId: "client-success-engine",
    model: "rules-v1",
    durationMs: Date.now() - started,
  };
}
