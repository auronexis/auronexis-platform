import type { Metadata } from "next";
import Link from "next/link";
import { ConnectorsWorkspace } from "@/components/connectors/connectors-workspace";
import { AutomationUpgradeCard } from "@/components/automation/automation-center-card";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";
import { requireSession } from "@/lib/auth/session";
import { getConnectorsDashboardSnapshot } from "@/lib/connectors/queries";
import {
  checkPlanFeatureForSession,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export const metadata: Metadata = {
  title: "Enterprise Connectors",
};

const ERROR_MESSAGES: Record<string, string> = {
  access: "You need owner or admin access and the automation builder plan to connect services.",
  unknown: "Unknown connector.",
  oauth: "This connector does not support OAuth.",
  not_configured: "OAuth app credentials are not configured for this connector.",
  session: "Your session expired. Sign in and try again.",
  missing_code: "OAuth callback did not include an authorization code.",
  invalid_state: "OAuth state validation failed. Please try connecting again.",
  organization: "OAuth state does not match your organization.",
  exchange: "Token exchange failed. Check OAuth app credentials and redirect URI.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AutomationConnectorsPage({ searchParams }: PageProps) {
  const session = await requireSession();
  const aiAccess = await checkPlanFeatureForSession(session, "ai_automation_builder");
  const canManage = canManageOrganizationSettings(session);
  const params = await searchParams;

  const connected = typeof params.connected === "string" ? params.connected : null;
  const errorKey = typeof params.error === "string" ? params.error : null;

  const statusMessage = connected
    ? `${connected} connected successfully. Tokens are stored in the secrets vault.`
    : errorKey
      ? ERROR_MESSAGES[errorKey] ?? `Connection failed (${errorKey}).`
      : null;
  const statusVariant = connected ? "success" : errorKey ? "error" : null;

  const snapshot = aiAccess.allowed
    ? await getConnectorsDashboardSnapshot(session)
    : null;

  return (
    <>
      <PageHeader
        module="workflows"
        title="Enterprise Connectors"
        description="Native OAuth connectors for Google Workspace, Microsoft 365, dev tools, CRM, and helpdesk platforms."
        action={
          <div className="flex items-center gap-4">
            <Link
              href="/automation/integrations"
              className="text-sm font-medium text-accent-blue hover:underline"
            >
              Integrations
            </Link>
            <Link href="/automation" className="text-sm font-medium text-accent-blue hover:underline">
              Back to automation
            </Link>
          </div>
        }
      />

      <PageSurface>
        {!aiAccess.allowed ? (
          <AutomationUpgradeCard
            message={getFeatureUpgradeMessage("ai_automation_builder")}
            requiredPlanLabel={getRequiredPlanLabel("ai_automation_builder")}
          />
        ) : snapshot ? (
          <ConnectorsWorkspace
            snapshot={snapshot}
            canManage={canManage}
            statusMessage={statusMessage}
            statusVariant={statusVariant}
          />
        ) : null}
      </PageSurface>
    </>
  );
}
