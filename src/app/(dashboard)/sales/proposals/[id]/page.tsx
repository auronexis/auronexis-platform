import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { getSalesLead, getSalesProposal } from "@/lib/sales/queries";
import { mergeProposalContent } from "@/lib/sales/proposal-generator";
import { requireSession } from "@/lib/auth/session";
import { formatWorkspaceMoney, getStoredOrganizationCurrency } from "@/lib/i18n";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = { title: "Proposal Detail" };

type ProposalDetailPageProps = { params: Promise<{ id: string }> };

export default async function SalesProposalDetailPage({ params }: ProposalDetailPageProps) {
  await requireModuleAccess("sales");
  const session = await requireSession();
  const currency = getStoredOrganizationCurrency(session.organization);
  const { id } = await params;
  const proposal = await getSalesProposal(session, id);
  if (!proposal) notFound();

  const lead = await getSalesLead(session, proposal.lead_id);
  const content = mergeProposalContent(
    proposal,
    lead ?? {
      contact_name: "Contact",
      company_name: "Company",
      pain_points: null,
      potential_mrr: Number(proposal.mrr_proposed),
      mrr_estimate: Number(proposal.mrr_proposed),
      employee_count: null,
    },
    currency,
  );

  return (
    <>
      <PageHeader
        module="sales"
        title={content.title}
        description={`Status: ${proposal.status} · MRR ${formatWorkspaceMoney(content.mrrProposed, currency)}`}
        action={
          <Link href={`/sales/proposals/${proposal.id}/export`} className="text-sm font-medium text-primary hover:underline">
            Export PDF
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <ProposalSection title="Pilot agreement" body={content.pilotAgreement} />
        <ProposalSection title="Pricing proposal" body={content.pricingProposal} />
        <ProposalSection title="ROI estimate" body={content.roiEstimate} />
        <ProposalSection title="Timeline" body={content.timeline} />
        <ProposalSection title="Implementation plan" body={content.implementationPlan} className="lg:col-span-2" />
      </div>
    </>
  );
}

function ProposalSection({ title, body, className }: { title: string; body: string; className?: string }) {
  return (
    <section className={`aurora-surface p-5 ${className ?? ""}`}>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <pre className="mt-3 whitespace-pre-wrap text-sm text-muted">{body}</pre>
    </section>
  );
}
