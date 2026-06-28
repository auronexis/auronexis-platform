import type { Metadata } from "next";
import { OutboundListGrid } from "@/components/sales/outbound-list-grid";
import { SalesLeadTable } from "@/components/sales/sales-lead-table";
import { PageHeader } from "@/components/layout/page-header";
import {
  countLeadsByOutboundType,
  ensureOutboundLists,
  listOutboundLeads,
} from "@/lib/sales/queries";
import { OUTBOUND_LIST_TYPES } from "@/lib/sales/outbound-lists";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import type { ProspectSegment } from "@/types/database";

export const metadata: Metadata = {
  title: "Outbound Workspace",
};

type OutboundPageProps = {
  searchParams: Promise<{ segment?: string }>;
};

export default async function OutboundWorkspacePage({ searchParams }: OutboundPageProps) {
  await requireModuleAccess("sales");
  const session = await requireSession();
  const params = await searchParams;
  const segment = OUTBOUND_LIST_TYPES.some((item) => item.key === params.segment)
    ? (params.segment as ProspectSegment)
    : undefined;

  const [lists, leadCounts, leads] = await Promise.all([
    ensureOutboundLists(session),
    countLeadsByOutboundType(session),
    listOutboundLeads(session, { segment, limit: 25 }),
  ]);

  return (
    <>
      <PageHeader
        module="sales"
        title="Outbound workspace"
        description="Prospect lists by segment — companies, agencies, MSPs, consultants, and AI agencies."
      />

      <OutboundListGrid lists={lists} leadCounts={leadCounts} activeType={segment} />

      <section className="mt-8">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          {segment ? `${OUTBOUND_LIST_TYPES.find((item) => item.key === segment)?.label ?? "Segment"} leads` : "All outbound leads"}
        </h2>
        <SalesLeadTable leads={leads} showScores />
      </section>
    </>
  );
}
