import type { Metadata } from "next";
import { PortalEmptyState, PortalPageHeader } from "@/components/client-portal/portal-ui";
import { PortalReportCard } from "@/components/client-portal/portal-v3";
import { getPortalPublishedReports } from "@/lib/client-portal/portal-reports";
import { requireClientPortalSession } from "@/lib/client-portal/session";

export const metadata: Metadata = {
  title: "Portal Reports",
};

export default async function ClientPortalReportsPage() {
  const session = await requireClientPortalSession();
  const reports = await getPortalPublishedReports(session);

  return (
    <>
      <PortalPageHeader
        title="Report Center"
        description="Review published operational reports shared with your organization."
      />

      {reports.length === 0 ? (
        <PortalEmptyState
          title="No reports available"
          description="Your agency will share reports here once they are published."
        />
      ) : (
        <div className="space-y-5">
          {reports.map((report) => (
            <PortalReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </>
  );
}
