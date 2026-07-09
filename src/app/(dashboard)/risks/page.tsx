import type { Metadata } from "next";
import Link from "next/link";
import { RiskCard } from "@/components/risks/risk-card";
import { RiskEmptyState } from "@/components/risks/risk-empty-state";
import { RiskHeatmap } from "@/components/risks/risk-heatmap";
import { RiskMetrics } from "@/components/risks/risk-metrics";
import { RiskList } from "@/components/risks/risk-list";
import { PageHeader } from "@/components/layout/page-header";
import { ArchiveFilterTabs } from "@/components/ui/archive-filter-tabs";
import { LinkButton } from "@/components/ui/link-button";
import { sessionHasPermission } from "@/lib/authorization/guards";
import { requireSession } from "@/lib/auth/session";
import { canCreateRisk } from "@/lib/risks/guards";
import { getRiskHeatmap, getRiskSummary, listOrgUsers, listRisks } from "@/lib/risks/queries";
import { RISK_CATEGORIES, type RiskStatus } from "@/lib/risks/types";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Risks",
};

const TAB_STATUSES: Record<string, RiskStatus | RiskStatus[]> = {
  open: ["open", "acknowledged", "mitigated"],
  critical: ["open", "acknowledged", "mitigated"],
  acknowledged: "acknowledged",
  mitigated: "mitigated",
  resolved: "resolved",
  dismissed: "dismissed",
};

type RisksPageProps = {
  searchParams: Promise<{
    tab?: string;
    view?: string;
    category?: string;
    owner?: string;
    severity?: string;
  }>;
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
  const view = params.view ?? "cards";
  const statusFilter = TAB_STATUSES[tab] ?? TAB_STATUSES.open;

  const listOptions = {
    status: tab === "critical" ? (["open", "acknowledged", "mitigated"] as RiskStatus[]) : statusFilter,
    severity: tab === "critical" ? ("critical" as const) : params.severity as "low" | "medium" | "high" | "critical" | undefined,
    category: params.category || undefined,
    ownerUserId: params.owner || undefined,
  };

  const [summaryResult, heatmap, risks, orgUsers] = await Promise.all([
    getRiskSummary(session),
    getRiskHeatmap(session),
    listRisks(session, listOptions),
    listOrgUsers(session),
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
    highScoreCount: 0,
    overdueCount: 0,
    mitigationRate: 0,
    averageRiskScore: null,
  };

  const canCreate = canCreateRisk(session);

  const filterBase = `/risks?tab=${tab}&view=${view}`;
  const categoryOptions = [
    { label: "All categories", href: filterBase },
    ...RISK_CATEGORIES.map((category) => ({
      label: category,
      href: `${filterBase}&category=${encodeURIComponent(category)}`,
    })),
  ];
  const ownerOptions = [
    { label: "All owners", href: filterBase },
    ...orgUsers.map((user) => ({
      label: user.full_name,
      href: `${filterBase}&owner=${user.id}`,
    })),
  ];

  return (
    <>
      <PageHeader
        module="risks"
        title="Risk Center"
        description="Score, prioritize, and mitigate client risks before they escalate."
        action={canCreate ? <LinkButton href="/risks/new">Add risk</LinkButton> : undefined}
      />

      <section className="mb-8">
        <RiskMetrics summary={summary} />
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-surface/60 p-5">
          <h2 className="text-sm font-semibold text-foreground">Risk heatmap</h2>
          <p className="mt-1 text-sm text-muted">Open risks by likelihood and impact.</p>
          <div className="mt-4">
            <RiskHeatmap heatmap={heatmap} />
          </div>
        </div>
        <div className="rounded-xl border border-border/70 bg-surface/60 p-5">
          <h2 className="text-sm font-semibold text-foreground">Filters</h2>
          <p className="mt-1 text-sm text-muted">Narrow the list by category or owner.</p>
          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Category</p>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((option) => (
                  <Link
                    key={option.href}
                    href={option.href}
                    className={
                      (params.category ?? "") === (option.label === "All categories" ? "" : option.label)
                        ? "rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        : "rounded-full bg-muted/10 px-3 py-1 text-xs text-muted hover:text-foreground"
                    }
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>
            {orgUsers.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Owner</p>
                <div className="flex flex-wrap gap-2">
                  {ownerOptions.slice(0, 8).map((option) => (
                    <Link
                      key={option.href}
                      href={option.href}
                      className={
                        (params.owner ?? "") === (option.label === "All owners" ? "" : option.href.split("owner=")[1])
                          ? "rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                          : "rounded-full bg-muted/10 px-3 py-1 text-xs text-muted hover:text-foreground"
                      }
                    >
                      {option.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
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

      <div className="mb-4 flex gap-2 text-sm">
        <Link
          href={`/risks?tab=${tab}&view=cards${params.category ? `&category=${encodeURIComponent(params.category)}` : ""}${params.owner ? `&owner=${params.owner}` : ""}`}
          className={view === "cards" ? "font-semibold text-foreground" : "text-muted hover:text-foreground"}
        >
          Cards
        </Link>
        <span className="text-muted">·</span>
        <Link
          href={`/risks?tab=${tab}&view=table${params.category ? `&category=${encodeURIComponent(params.category)}` : ""}${params.owner ? `&owner=${params.owner}` : ""}`}
          className={view === "table" ? "font-semibold text-foreground" : "text-muted hover:text-foreground"}
        >
          Table
        </Link>
      </div>

      {risks.length === 0 ? (
        <RiskEmptyState
          title={`No ${tab} risks`}
          description="Track client risks before they escalate into incidents."
          action={canCreate ? <LinkButton href="/risks/new">Add risk</LinkButton> : undefined}
          secondaryHref="/incidents"
          secondaryLabel="View incidents"
        />
      ) : view === "table" ? (
        <RiskList risks={risks} />
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
