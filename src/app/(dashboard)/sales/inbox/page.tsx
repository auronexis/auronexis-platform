import type { Metadata } from "next";
import Link from "next/link";
import { ContactInboxWidget } from "@/components/sales/contact-inbox-widget";
import { SalesLeadTable } from "@/components/sales/sales-lead-table";
import { PageHeader } from "@/components/layout/page-header";
import { SALES_INBOXES } from "@/lib/sales/pipeline-stages";
import { getPipelineDashboardMetrics, listSalesLeads } from "@/lib/sales/queries";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import type { SalesInboxKey } from "@/types/database";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Contact Inbox",
};

type InboxPageProps = {
  searchParams: Promise<{ inbox?: string }>;
};

export default async function SalesInboxPage({ searchParams }: InboxPageProps) {
  await requireModuleAccess("sales");
  const session = await requireSession();
  const params = await searchParams;
  const inbox = SALES_INBOXES.some((item) => item.key === params.inbox)
    ? (params.inbox as SalesInboxKey)
    : undefined;
  const [metrics, leads] = await Promise.all([
    getPipelineDashboardMetrics(session),
    listSalesLeads(session, { inbox }),
  ]);

  return (
    <>
      <PageHeader
        module="sales"
        title="Contact inbox"
        description="Inbound activity across support@, sales@, and security@ mailboxes."
      />

      <ContactInboxWidget metrics={metrics} />

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/sales/inbox" className={cn("rounded-full border px-3 py-1 text-xs font-medium", !inbox ? "border-primary/30 bg-primary/10 text-primary" : "border-border-subtle text-muted hover:text-foreground")}>
          All inboxes
        </Link>
        {SALES_INBOXES.map((item) => (
          <Link
            key={item.key}
            href={`/sales/inbox?inbox=${item.key}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              inbox === item.key ? "border-primary/30 bg-primary/10 text-primary" : "border-border-subtle text-muted hover:text-foreground",
            )}
          >
            {item.email}
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-base font-semibold text-foreground">Inbox leads</h2>
        <SalesLeadTable leads={leads} />
      </section>
    </>
  );
}
