import type { Metadata } from "next";
import { IncidentCard } from "@/components/incidents/incident-card";
import { IncidentCreateModal } from "@/components/incidents/incident-create-modal";
import { IncidentMetrics } from "@/components/incidents/incident-metrics";
import { IncidentList } from "@/components/incidents/incident-list";
import { PageHeader } from "@/components/layout/page-header";
import { ArchiveFilterTabs } from "@/components/ui/archive-filter-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { listClients } from "@/lib/clients/queries";
import { canCreateIncident } from "@/lib/incidents/guards";
import { getIncidentSummary, listIncidents, listLinkableRisks } from "@/lib/incidents/queries";
import {
  INCIDENT_STATUSES,
  OPEN_INCIDENT_STATUSES,
  STAFF_INCIDENT_STATUSES,
} from "@/lib/incidents/types";
import { listOrgUsers } from "@/lib/risks/queries";
import { attachIncidentSlaInfo } from "@/lib/sla/queries";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import type { IncidentStatus } from "@/types/database";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Incidents",
};

const TAB_CONFIG: Record<string, { status?: IncidentStatus | IncidentStatus[]; severity?: "critical" }> = {
  open: { status: OPEN_INCIDENT_STATUSES },
  critical: { status: OPEN_INCIDENT_STATUSES, severity: "critical" },
  investigating: { status: "investigating" },
  resolved: { status: "resolved" },
  archived: { status: "archived" },
};

type IncidentsPageProps = {
  searchParams: Promise<{ tab?: string; view?: string }>;
};

export default async function IncidentsPage({ searchParams }: IncidentsPageProps) {
  await requireModuleAccess("incidents");
  const session = await requireSession();
  const params = await searchParams;
  const tab = params.tab ?? "open";
  const view = params.view ?? "cards";
  const tabConfig = TAB_CONFIG[tab] ?? TAB_CONFIG.open;
  const includeArchived = tab === "archived";

  const [summary, incidents, clients, risks, orgUsers] = await Promise.all([
    getIncidentSummary(session),
    attachIncidentSlaInfo(
      session.organization.id,
      await listIncidents(session, {
        includeArchived,
        status: tabConfig.status,
        severity: tabConfig.severity,
      }),
    ),
    listClients(session),
    listLinkableRisks(session),
    session.role === "owner" || session.role === "admin" ? listOrgUsers(session) : Promise.resolve([]),
  ]);

  const canCreate = canCreateIncident(session);
  const showAssigneeSelect = session.role === "owner" || session.role === "admin";
  const allowedStatuses =
    session.role === "staff" ? STAFF_INCIDENT_STATUSES : INCIDENT_STATUSES.filter((s) => s !== "archived");

  return (
    <>
      <PageHeader
        module="incidents"
        title="Incident Command Center"
        description="Track operational failures, investigate root cause, and measure response performance."
        action={
          canCreate ? (
            <IncidentCreateModal
              clients={clients}
              risks={risks}
              orgUsers={orgUsers}
              showAssigneeSelect={showAssigneeSelect}
              defaultAssignedUserId={session.user.id}
              allowedStatuses={allowedStatuses}
            />
          ) : undefined
        }
      />

      <section className="mb-8">
        <IncidentMetrics summary={summary} />
      </section>

      <ArchiveFilterTabs
        tabs={[
          { label: "Open", href: "/incidents?tab=open", active: tab === "open" },
          { label: "Critical", href: "/incidents?tab=critical", active: tab === "critical" },
          { label: "Investigating", href: "/incidents?tab=investigating", active: tab === "investigating" },
          { label: "Resolved", href: "/incidents?tab=resolved", active: tab === "resolved" },
          { label: "Archived", href: "/incidents?tab=archived", active: tab === "archived" },
        ]}
      />

      <div className="mb-4 flex gap-2 text-sm">
        <a
          href={`/incidents?tab=${tab}&view=cards`}
          className={view === "cards" ? "font-semibold text-foreground" : "text-muted hover:text-foreground"}
        >
          Cards
        </a>
        <span className="text-muted">·</span>
        <a
          href={`/incidents?tab=${tab}&view=table`}
          className={view === "table" ? "font-semibold text-foreground" : "text-muted hover:text-foreground"}
        >
          Table
        </a>
      </div>

      {incidents.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title={`No ${tab} incidents`}
          description="Operational failures will surface here for triage and resolution."
        />
      ) : view === "table" ? (
        <IncidentList incidents={incidents} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {incidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
        </div>
      )}
    </>
  );
}
