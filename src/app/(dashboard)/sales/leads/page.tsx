import type { Metadata } from "next";
import { SalesLeadTable } from "@/components/sales/sales-lead-table";
import { PageHeader } from "@/components/layout/page-header";
import { listSalesLeads } from "@/lib/sales/queries";
import { PIPELINE_STAGES } from "@/lib/sales/pipeline-stages";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import type { SalesPipelineStage } from "@/types/database";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Sales Leads",
};

type SalesLeadsPageProps = {
  searchParams: Promise<{ stage?: string }>;
};

export default async function SalesLeadsPage({ searchParams }: SalesLeadsPageProps) {
  await requireModuleAccess("sales");
  const session = await requireSession();
  const params = await searchParams;
  const stage = PIPELINE_STAGES.some((item) => item.key === params.stage)
    ? (params.stage as SalesPipelineStage)
    : undefined;
  const leads = await listSalesLeads(session, { stage });

  return (
    <>
      <PageHeader
        module="sales"
        title="Leads"
        description="Pilot pipeline from first touch through closed won or lost."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/sales/leads" className={cn("rounded-full border px-3 py-1 text-xs font-medium", !stage ? "border-primary/30 bg-primary/10 text-primary" : "border-border-subtle text-muted hover:text-foreground")}>
          All
        </Link>
        {PIPELINE_STAGES.map((item) => (
          <Link
            key={item.key}
            href={`/sales/leads?stage=${item.key}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              stage === item.key ? "border-primary/30 bg-primary/10 text-primary" : "border-border-subtle text-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <SalesLeadTable leads={leads} />
    </>
  );
}
