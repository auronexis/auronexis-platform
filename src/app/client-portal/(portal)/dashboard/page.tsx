import type { Metadata } from "next";

import {

  Activity,

  AlertTriangle,

  FileText,

  ShieldAlert,

} from "lucide-react";

import {

  PortalHero,

  PortalKpiCard,

  PortalKpiMetric,

  PortalQuickAccessCard,

} from "@/components/client-portal/portal-ui";

import { getOrganizationBrandingForOrganization } from "@/lib/branding/queries";

import { getHealthDisplay } from "@/components/client-portal/portal-theme";

import { getPortalDashboardData } from "@/lib/client-portal/queries";

import { requireClientPortalSession } from "@/lib/client-portal/session";

import { getOrganizationPlanContext } from "@/lib/plans/queries";

import { formatReportPeriod } from "@/lib/reports/types";



export const metadata: Metadata = {

  title: "Portal Dashboard",

};



export default async function ClientPortalDashboardPage() {

  const session = await requireClientPortalSession();

  const [data, branding, plan] = await Promise.all([

    getPortalDashboardData(session),

    getOrganizationBrandingForOrganization(session.organization.id, session.organization.name),

    getOrganizationPlanContext(session.organization.id),

  ]);

  const health = getHealthDisplay(data.clientStatus);

  const showRisks = plan.features.risks;

  const showIncidents = plan.features.incidents;



  return (

    <>

      <PortalHero clientName={data.clientName} branding={branding} />



      <div

        className={`grid gap-5 sm:grid-cols-2 ${

          showRisks && showIncidents ? "xl:grid-cols-4" : showRisks || showIncidents ? "xl:grid-cols-3" : "xl:grid-cols-2"

        }`}

      >

        <PortalKpiCard

          label="Health Status"

          icon={Activity}

          tone={health.tone}

          subtext={health.subtext}

        >

          <PortalKpiMetric className={health.tone === "success" ? "text-success" : undefined}>

            {health.label}

          </PortalKpiMetric>

        </PortalKpiCard>



        {showRisks ? (

          <PortalKpiCard

            label="Open Risks"

            icon={AlertTriangle}

            tone="warning"

            href="/client-portal/risks"

            subtext={data.openRisksCount > 0 ? "Requires your attention" : "No open risks"}

          >

            <PortalKpiMetric>{data.openRisksCount}</PortalKpiMetric>

          </PortalKpiCard>

        ) : null}



        {showIncidents ? (

          <PortalKpiCard

            label="Open Incidents"

            icon={ShieldAlert}

            tone="danger"

            href="/client-portal/incidents"

            subtext={data.openIncidentsCount > 0 ? "Requires your attention" : "No open incidents"}

          >

            <PortalKpiMetric>{data.openIncidentsCount}</PortalKpiMetric>

          </PortalKpiCard>

        ) : null}



        <PortalKpiCard

          label="Latest Report"

          icon={FileText}

          tone="primary"

          href={data.latestReport ? `/client-portal/reports/${data.latestReport.id}` : "/client-portal/reports"}

          subtext={

            data.latestReport

              ? formatReportPeriod(

                  data.latestReport.reporting_period_start,

                  data.latestReport.reporting_period_end,

                )

              : "No reports available yet."

          }

        >

          {data.latestReport ? (

            <p className="line-clamp-2 text-base font-semibold leading-snug text-foreground">

              {data.latestReport.title}

            </p>

          ) : (

            <p className="text-sm font-medium text-muted">No reports available yet.</p>

          )}

        </PortalKpiCard>

      </div>



      <section className="mt-10">

        <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">

          Quick Access

        </h2>

        <div

          className={`grid gap-5 ${

            showRisks && showIncidents ? "lg:grid-cols-3" : showRisks || showIncidents ? "lg:grid-cols-2" : "max-w-md"

          }`}

        >

          <PortalQuickAccessCard

            href="/client-portal/reports"

            icon={FileText}

            tone="primary"

            title="Reports"

            description="View and download your sent reports."

          />

          {showRisks ? (

            <PortalQuickAccessCard

              href="/client-portal/risks"

              icon={AlertTriangle}

              tone="warning"

              title="Risks"

              description="Track open operational risks."

            />

          ) : null}

          {showIncidents ? (

            <PortalQuickAccessCard

              href="/client-portal/incidents"

              icon={ShieldAlert}

              tone="danger"

              title="Incidents"

              description="Monitor open incidents affecting your account."

            />

          ) : null}

        </div>

      </section>

    </>

  );

}


