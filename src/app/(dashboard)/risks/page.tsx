import type { Metadata } from "next";
import Link from "next/link";
import { RiskCard } from "@/components/risks/risk-card";
import { RiskEmptyState } from "@/components/risks/risk-empty-state";
import { RiskSummaryCards } from "@/components/risks/risk-summary-cards";
import { PageHeader } from "@/components/layout/page-header";
import { ArchiveFilterTabs } from "@/components/ui/archive-filter-tabs";
import { Button } from "@/components/ui/button";
import { sessionHasPermission } from "@/lib/authorization/guards";
import { requireSession } from "@/lib/auth/session";
import { canCreateRisk } from "@/lib/risks/guards";
import { getRiskSummary, listRisks } from "@/lib/risks/queries";
import type { RiskStatus } from "@/lib/risks/types";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Risks",
};

const TAB_STATUSES: Record<string, RiskStatus | RiskStatus[]> = {
  open: ["open", "acknowledged", "mitigated"],
  critical: "open",
  acknowledged: "acknowledged",
  mitigated: "mitigated",
  resolved: "resolved",
  dismissed: "dismissed",
};

type RisksPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function RisksPage({ searchParams }: RisksPageProps) {
  await requireModuleAccess("risks");
  const session = await requireSession();

  if (!sessionHasPermission(session, "risks.read")) {
    return (
      <>
        <PageHeader module="risks" title="Risk Center" description="Track client risks before they become incidents." />
        <p className="text-sm text-muted">You do not have permission to view risks.</p>
      </>
    );
  }

  const params = await searchParams;
  const tab = params.tab ?? "open";
  const statusFilter = TAB_STATUSES[tab] ?? TAB_STATUSES.open;

  const [summaryResult, risks] = await Promise.all([
    getRiskSummary(session),
    listRisks(session, {
      status: tab === "critical" ? ["open", "acknowledged", "mitigated"] : statusFilter,
      severity: tab === "critical" ? "critical" : undefined,
    }),
  ]);

  const summary = summaryResult.data ?? {
    openCount: 0,
    criticalCount: 0,
    highCount: 0,
    dueSoonCount: 0,
    acknowledgedCount: 0,
    mitigatedCount: 0,
    resolvedCount: 0,
    dismissedCount: 0,
  };

  const canCreate = canCreateRisk(session);

  return (
    <>
      <PageHeader
        module="risks"
        title="Risk Center"
        description="Track client risks before they become incidents."
        action={
          canCreate ? (
            <Link href="/risks/new">
              <Button>Add risk</Button>
            </Link>
          ) : undefined
        }
      />

      <section className="mb-8">
        <RiskSummaryCards summary={summary} />
      </section>

      <ArchiveFilterTabs
        tabs={[
          { label: "Open", href: "/risks?tab=open", active: tab === "open" },
          { label: "Critical", href: "/risks?tab=critical", active: tab === "critical" },
          { label: "Acknowledged", href: "/risks?tab=acknowledged", active: tab === "acknowledged" },
          { label: "Mitigated", href: "/risks?tab=mitigated", active: tab === "mitigated" },
          { label: "Resolved", href: "/risks?tab=resolved", active: tab === "resolved" },
          { label: "Dismissed", href: "/risks?tab=dismissed", active: tab === "dismissed" },
        ]}
      />

      {risks.length === 0 ? (
        <RiskEmptyState title={`No ${tab} risks`} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {risks.map((risk) => (
            <RiskCard key={risk.id} risk={risk} />
          ))}
        </div>
      )}
    </>
  );
}
