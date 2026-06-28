import type { SalesLead } from "@/types/database";
import type { SalesProposal } from "@/types/database";
import { FOUNDING_CUSTOMER_DISCOUNT_PERCENT } from "@/lib/sales/founding-program";

export type ProposalContent = {
  title: string;
  pilotAgreement: string;
  pricingProposal: string;
  roiEstimate: string;
  timeline: string;
  implementationPlan: string;
  mrrProposed: number;
  arrProposed: number;
};

export function buildProposalFromLead(lead: Pick<
  SalesLead,
  "contact_name" | "company_name" | "pain_points" | "potential_mrr" | "mrr_estimate" | "employee_count"
>): ProposalContent {
  const baseMrr = Number(lead.potential_mrr ?? lead.mrr_estimate ?? 299);
  const foundingMrr = Math.round(baseMrr * (1 - FOUNDING_CUSTOMER_DISCOUNT_PERCENT / 100));
  const company = lead.company_name ?? "your agency";

  return {
    title: `Auroranexis Proposal — ${company}`,
    pilotAgreement: [
      `6-week founding customer pilot for ${company}.`,
      "Scope: workspace setup, client import, risk/incident workflows, first report.",
      `Beta pricing: $${foundingMrr}/mo (${FOUNDING_CUSTOMER_DISCOUNT_PERCENT}% founding discount).`,
      "Success criteria: onboarding checklist complete, first client live, kickoff feedback captured.",
      "Conversion: roll to standard plan at pilot end or extend 4 weeks.",
    ].join("\n"),
    pricingProposal: [
      `Standard MRR: $${baseMrr}/mo`,
      `Founding customer MRR: $${foundingMrr}/mo`,
      `ARR (founding): $${foundingMrr * 12}/yr`,
      "Includes: GRC workspace, client portal, reports, automation, priority support.",
    ].join("\n"),
    roiEstimate: [
      `Estimated hours saved: ${Math.max(5, Math.round((lead.employee_count ?? 10) * 0.5))} hrs/client/month`,
      "Risk reduction: centralized register and incident workflow",
      "Retention uplift: branded client portal and scheduled reports",
      `Payback target: < 3 months at $${foundingMrr}/mo`,
    ].join("\n"),
    timeline: [
      "Week 1: Kickoff, workspace provisioned, team invited",
      "Week 2: First client imported, risk register configured",
      "Week 3: Incident workflow, integrations connected",
      "Week 4: First report generated, portal enabled",
      "Week 5–6: Optimization, health baseline, conversion review",
    ].join("\n"),
    implementationPlan: [
      `Primary contact: ${lead.contact_name}`,
      `Pain focus: ${lead.pain_points ?? "Multi-client GRC and reporting efficiency"}`,
      "Deliverables: workspace, onboarding checklist, success scores, renewal review",
    ].join("\n"),
    mrrProposed: foundingMrr,
    arrProposed: foundingMrr * 12,
  };
}

export function mergeProposalContent(
  proposal: SalesProposal,
  lead: Pick<SalesLead, "contact_name" | "company_name" | "pain_points" | "potential_mrr" | "mrr_estimate" | "employee_count">,
): ProposalContent {
  const generated = buildProposalFromLead(lead);
  return {
    title: proposal.title,
    pilotAgreement: proposal.pilot_agreement ?? generated.pilotAgreement,
    pricingProposal: proposal.pricing_proposal ?? generated.pricingProposal,
    roiEstimate: proposal.roi_estimate ?? generated.roiEstimate,
    timeline: proposal.timeline ?? generated.timeline,
    implementationPlan: proposal.implementation_plan ?? generated.implementationPlan,
    mrrProposed: Number(proposal.mrr_proposed ?? generated.mrrProposed),
    arrProposed: Number(proposal.arr_proposed ?? generated.arrProposed),
  };
}
