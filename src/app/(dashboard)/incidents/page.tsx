import type { Metadata } from "next";
import Link from "next/link";
import { IncidentList } from "@/components/incidents/incident-list";
import { PageHeader } from "@/components/layout/page-header";
import { ArchiveFilterTabs } from "@/components/ui/archive-filter-tabs";
import { Button } from "@/components/ui/button";
import { canCreateIncident } from "@/lib/incidents/guards";
import { listIncidents } from "@/lib/incidents/queries";
import { attachIncidentSlaInfo } from "@/lib/sla/queries";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Incidents",
};

type IncidentsPageProps = {
  searchParams: Promise<{ archived?: string }>;
};

export default async function IncidentsPage({ searchParams }: IncidentsPageProps) {
  await requireModuleAccess("incidents");
  const session = await requireSession();
  const params = await searchParams;
  const includeArchived = params.archived === "1";
  const incidents = await attachIncidentSlaInfo(
    session.organization.id,
    await listIncidents(session, { includeArchived }),
  );

  return (
    <>
      <PageHeader
        module="incidents"
        title="Incident Center"
        description="Track and resolve operational failures across your agency."
        action={
          canCreateIncident(session) ? (
            <Link href="/incidents/new">
              <Button>Add incident</Button>
            </Link>
          ) : undefined
        }
      />

      <ArchiveFilterTabs
        tabs={[
          { label: "Active incidents", href: "/incidents", active: !includeArchived },
          { label: "Include archived", href: "/incidents?archived=1", active: includeArchived },
        ]}
      />

      <IncidentList incidents={incidents} />
    </>
  );
}
