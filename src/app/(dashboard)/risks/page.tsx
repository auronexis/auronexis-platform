import type { Metadata } from "next";
import Link from "next/link";
import { RiskList } from "@/components/risks/risk-list";
import { PageHeader } from "@/components/layout/page-header";
import { ArchiveFilterTabs } from "@/components/ui/archive-filter-tabs";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/session";
import { canCreateRisk } from "@/lib/risks/guards";
import { listRisks } from "@/lib/risks/queries";
import { attachRiskSlaInfo } from "@/lib/sla/queries";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Risks",
};

type RisksPageProps = {
  searchParams: Promise<{ archived?: string }>;
};

export default async function RisksPage({ searchParams }: RisksPageProps) {
  await requireModuleAccess("risks");
  const session = await requireSession();
  const params = await searchParams;
  const includeArchived = params.archived === "1";
  const risks = await attachRiskSlaInfo(
    session.organization.id,
    await listRisks(session, { includeArchived }),
  );

  return (
    <>
      <PageHeader
        module="risks"
        title="Risk Center"
        description="Identify operational threats before they become incidents."
        action={
          canCreateRisk(session) ? (
            <Link href="/risks/new">
              <Button>Add risk</Button>
            </Link>
          ) : undefined
        }
      />

      <ArchiveFilterTabs
        tabs={[
          { label: "Active risks", href: "/risks", active: !includeArchived },
          { label: "Include archived", href: "/risks?archived=1", active: includeArchived },
        ]}
      />

      <RiskList risks={risks} />
    </>
  );
}
