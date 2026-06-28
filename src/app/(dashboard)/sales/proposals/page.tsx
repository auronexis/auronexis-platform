import type { Metadata } from "next";
import { SalesProposalList } from "@/components/sales/sales-proposal-list";
import { PageHeader } from "@/components/layout/page-header";
import { listSalesProposals } from "@/lib/sales/queries";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = { title: "Proposals" };

export default async function SalesProposalsPage() {
  await requireModuleAccess("sales");
  const session = await requireSession();
  const proposals = await listSalesProposals(session);

  return (
    <>
      <PageHeader
        module="sales"
        title="Proposal generator"
        description="Pilot agreements, pricing proposals, ROI estimates, timelines, and PDF export."
      />
      <SalesProposalList proposals={proposals} />
    </>
  );
}
