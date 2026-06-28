import type { Metadata } from "next";
import { LeadSourcingGrid } from "@/components/sales/lead-sourcing-grid";
import { SalesLeadTable } from "@/components/sales/sales-lead-table";
import { PageHeader } from "@/components/layout/page-header";
import {
  countLeadsByAgencyType,
  countLeadsByRegion,
  listSourcedLeads,
} from "@/lib/sales/queries";
import { AGENCY_TYPES, LEAD_SOURCE_REGIONS } from "@/lib/sales/lead-sourcing";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import type { AgencyType, LeadSourceRegion } from "@/types/database";

export const metadata: Metadata = { title: "Lead Sourcing" };

type SourcingPageProps = {
  searchParams: Promise<{ region?: string; agency?: string }>;
};

export default async function LeadSourcingPage({ searchParams }: SourcingPageProps) {
  await requireModuleAccess("sales");
  const session = await requireSession();
  const params = await searchParams;
  const region = LEAD_SOURCE_REGIONS.some((r) => r.key === params.region)
    ? (params.region as LeadSourceRegion)
    : undefined;
  const agencyType = AGENCY_TYPES.some((a) => a.key === params.agency)
    ? (params.agency as AgencyType)
    : undefined;

  const [regionCounts, agencyCounts, leads] = await Promise.all([
    countLeadsByRegion(session),
    countLeadsByAgencyType(session),
    listSourcedLeads(session, { region, agencyType, limit: 25 }),
  ]);

  const totalSourced = Object.values(regionCounts).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeader
        module="sales"
        title="Lead sourcing"
        description="Top 100 agency targets — Germany, DACH, EU, MSP, AI, and automation agencies."
      />
      <LeadSourcingGrid
        regionCounts={regionCounts}
        agencyCounts={agencyCounts}
        activeRegion={region}
        activeAgency={agencyType}
        totalSourced={totalSourced}
      />
      <section className="mt-8">
        <h2 className="mb-4 text-base font-semibold text-foreground">Sourced leads</h2>
        <SalesLeadTable leads={leads} showScores />
      </section>
    </>
  );
}
