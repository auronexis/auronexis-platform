import type { Metadata } from "next";
import Link from "next/link";
import { ApiSettingsWorkspace } from "@/components/settings/api-settings-workspace";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";
import { requireSession } from "@/lib/auth/session";
import { getApiDashboardSnapshot } from "@/lib/api/diagnostics";
import {
  checkPlanFeatureForSession,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Public API",
};

export default async function SettingsApiPage() {
  await requireModuleAccess("settings");
  const session = await requireSession();
  const apiAccess = await checkPlanFeatureForSession(session, "future_api_webhooks");
  const canManage = canManageOrganizationSettings(session);

  if (!canManage) {
    return (
      <>
        <PageHeader
          module="settings"
          title="Public API"
          description="Manage API keys, scopes, usage, and outbound webhooks."
        />
        <PageSurface>
          <p className="text-sm text-muted">Only organization owners and admins can manage the Public API.</p>
        </PageSurface>
      </>
    );
  }

  const snapshot = apiAccess.allowed ? await getApiDashboardSnapshot(session) : null;

  return (
    <>
      <PageHeader
        module="settings"
        title="Public API"
        description="Versioned REST API with scoped keys, rate limits, OpenAPI docs, and signed outbound webhooks."
        action={
          <div className="flex items-center gap-4">
            <Link href="/api/docs" className="text-sm font-medium text-accent-blue hover:underline">
              OpenAPI docs
            </Link>
            <Link href="/settings" className="text-sm font-medium text-accent-blue hover:underline">
              Back to settings
            </Link>
          </div>
        }
      />
      <PageSurface>
        {!apiAccess.allowed ? (
          <div className="rounded-2xl border border-border bg-surface/80 p-6">
            <h2 className="text-lg font-semibold text-foreground">Enterprise plan required</h2>
            <p className="mt-2 text-sm text-muted">{getFeatureUpgradeMessage("future_api_webhooks")}</p>
            <p className="mt-2 text-sm text-muted">
              Required plan: {getRequiredPlanLabel("future_api_webhooks")}
            </p>
          </div>
        ) : snapshot ? (
          <ApiSettingsWorkspace snapshot={snapshot} />
        ) : null}
      </PageSurface>
    </>
  );
}
