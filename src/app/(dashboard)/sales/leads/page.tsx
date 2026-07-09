import type { Metadata } from "next";
import { SalesLeadTable } from "@/components/sales/sales-lead-table";
import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { listSalesLeads } from "@/lib/sales/queries";
import { LEAD_SOURCES, PIPELINE_STAGES } from "@/lib/sales/pipeline-stages";
import { requireSession } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/rbac/permissions";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import type { SalesLeadSource, SalesPipelineStage } from "@/types/database";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Sales Leads",
};

type SalesLeadsPageProps = {
  searchParams: Promise<{ stage?: string; source?: string }>;
};

export default async function SalesLeadsPage({ searchParams }: SalesLeadsPageProps) {
  await requireModuleAccess("sales");
  const session = await requireSession();
  const canCreate = canAccessModule(session.role, "sales", "create");
  const params = await searchParams;
  const stage = PIPELINE_STAGES.some((item) => item.key === params.stage)
    ? (params.stage as SalesPipelineStage)
    : undefined;
  const source = LEAD_SOURCES.some((item) => item.key === params.source)
    ? (params.source as SalesLeadSource)
    : undefined;
  const leads = await listSalesLeads(session, { stage, source });

  return (
    <>
      <PageHeader
        module="sales"
        title="Leads"
        description="B2B pipeline from first touch through closed won or lost."
        action={
          canCreate ? (
            <LinkButton href="/sales/leads/new" size="sm">
              Add lead
            </LinkButton>
          ) : undefined
        }
      />

      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Stage</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={source ? `/sales/leads?source=${source}` : "/sales/leads"}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              !stage ? "border-primary/30 bg-primary/10 text-primary" : "border-border-subtle text-muted hover:text-foreground",
            )}
          >
            All
          </Link>
          {PIPELINE_STAGES.map((item) => (
            <Link
              key={item.key}
              href={`/sales/leads?stage=${item.key}${source ? `&source=${source}` : ""}`}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                stage === item.key ? "border-primary/30 bg-primary/10 text-primary" : "border-border-subtle text-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Source</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={stage ? `/sales/leads?stage=${stage}` : "/sales/leads"}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              !source ? "border-primary/30 bg-primary/10 text-primary" : "border-border-subtle text-muted hover:text-foreground",
            )}
          >
            All sources
          </Link>
          {LEAD_SOURCES.map((item) => (
            <Link
              key={item.key}
              href={`/sales/leads?source=${item.key}${stage ? `&stage=${stage}` : ""}`}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                source === item.key ? "border-primary/30 bg-primary/10 text-primary" : "border-border-subtle text-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <SalesLeadTable leads={leads} showCreateCta={canCreate} />
    </>
  );
}
