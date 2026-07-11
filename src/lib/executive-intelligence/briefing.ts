import { MAX_BRIEFING_SUMMARY_LENGTH } from "@/lib/executive-intelligence/constants";
import type {
  ExecutiveBriefing,
  ExecutiveIntelligenceSnapshot,
  IntelligenceFinding,
} from "@/lib/executive-intelligence/types";

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export function buildExecutiveBriefing(snapshot: ExecutiveIntelligenceSnapshot): ExecutiveBriefing {
  const concerns = snapshot.topFindings.filter((f) =>
    ["critical", "high", "medium"].includes(f.severity),
  );
  const keyWins = snapshot.topFindings.filter((f) => f.severity === "info");

  const healthLabel =
    snapshot.organizationHealth.currentValue !== null
      ? `Organization health score is ${snapshot.organizationHealth.currentValue}.`
      : "Organization health data is limited.";

  const adoptionLabel =
    snapshot.adoption.currentValue !== null
      ? `Adoption score is ${snapshot.adoption.currentValue} (${snapshot.adoption.direction}).`
      : "Adoption data is insufficient.";

  const csLabel = `Customer success portfolio: ${snapshot.customerSuccess.currentValue ?? 0} healthy-weighted clients.`;
  const deliveryLabel =
    snapshot.delivery.currentValue !== null
      ? `${snapshot.delivery.currentValue} reports published in the current period.`
      : "No published reports in the current period.";

  const summary = truncate(
    [
      healthLabel,
      adoptionLabel,
      csLabel,
      deliveryLabel,
      concerns.length > 0
        ? `${concerns.length} concern(s) require leadership attention.`
        : "No major concerns detected in the current period.",
    ].join(" "),
    MAX_BRIEFING_SUMMARY_LENGTH,
  );

  return {
    title: "Executive Intelligence Briefing",
    periodLabel: snapshot.period.label,
    summary,
    keyWins,
    concerns,
    priorityClients: snapshot.priorityClients.slice(0, 10),
    recommendedActions: snapshot.recommendedActions.slice(0, 8),
    narrative: buildDeterministicExecutiveNarrative(snapshot, concerns, keyWins),
    generatedBy: "deterministic",
    generatedAt: new Date().toISOString(),
  };
}

export function buildDeterministicExecutiveNarrative(
  snapshot: ExecutiveIntelligenceSnapshot,
  concerns: IntelligenceFinding[] = snapshot.topFindings.filter((f) =>
    ["critical", "high", "medium"].includes(f.severity),
  ),
  keyWins: IntelligenceFinding[] = snapshot.topFindings.filter((f) => f.severity === "info"),
): string {
  const sections: string[] = [];

  sections.push(`## Executive summary\n${snapshot.period.label}. ${snapshot.hasEnoughData ? "Sufficient operational data is available." : "Limited data — interpret findings cautiously."}`);

  if (keyWins.length > 0) {
    sections.push(
      `## What improved\n${keyWins.map((f) => `- ${f.title}: ${f.summary}`).join("\n")}`,
    );
  }

  if (concerns.length > 0) {
    sections.push(
      `## What deteriorated\n${concerns.map((f) => `- [${f.severity}] ${f.title}: ${f.explanation}`).join("\n")}`,
    );
  }

  if (snapshot.priorityClients.length > 0) {
    sections.push(
      `## Clients requiring attention\n${snapshot.priorityClients
        .slice(0, 5)
        .map((c) => `- Priority ${c.priorityScore}: ${c.primaryReason}`)
        .join("\n")}`,
    );
  }

  if (snapshot.recommendedActions.length > 0) {
    sections.push(
      `## Recommended next actions\n${snapshot.recommendedActions
        .slice(0, 5)
        .map((a) => `- ${a.title}: ${a.rationale}`)
        .join("\n")}`,
    );
  }

  sections.push(
    "\n---\n*This briefing is generated from deterministic workspace data. AI-assisted narrative, when available, supplements but does not replace source records.*",
  );

  return sections.join("\n\n");
}

export function buildOrganizationChangeSummary(snapshot: ExecutiveIntelligenceSnapshot): string {
  const lines = [
    ...snapshot.positiveChanges.map((c) => `+ ${c.label}: ${c.absoluteChange ?? 0}`),
    ...snapshot.negativeChanges.map((c) => `- ${c.label}: ${c.absoluteChange ?? 0}`),
  ];
  return lines.length > 0 ? lines.join("\n") : "No significant changes detected.";
}
