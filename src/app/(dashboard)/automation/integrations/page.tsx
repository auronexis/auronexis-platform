import type { Metadata } from "next";
import Link from "next/link";
import { IntegrationsCatalog, IntegrationSimulationPreview } from "@/components/automation/integrations-workspace";
import { AutomationUpgradeCard } from "@/components/automation/automation-center-card";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";
import { requireSession } from "@/lib/auth/session";
import { evaluateProviderHealth } from "@/lib/integrations/health";
import {
  getIntegrationsDashboardSummary,
  listIntegrationProviders,
  simulateIntegration,
} from "@/lib/integrations";
import { getProviderCredentialSummaries } from "@/lib/integrations/secrets/repository";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import {
  checkPlanFeatureForSession,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";

export const metadata: Metadata = {
  title: "Integrations",
};

export default async function AutomationIntegrationsPage() {
  const session = await requireSession();
  const aiAccess = await checkPlanFeatureForSession(session, "ai_automation_builder");
  const canManageSecrets = canManageOrganizationSettings(session);
  const credentialSummaries =
    aiAccess.allowed && canManageSecrets
      ? await getProviderCredentialSummaries(session)
      : [];
  const summaryByProvider = new Map(
    credentialSummaries.map((item) => [item.providerId, item.activeSecretCount]),
  );
  const providers = listIntegrationProviders().map((provider) =>
    evaluateProviderHealth(provider, undefined, {
      configuredSecretCount: summaryByProvider.get(provider.id) ?? 0,
    }),
  );
  const summary = aiAccess.allowed
    ? await getIntegrationsDashboardSummary({
        organizationId: session.organization.id,
        userId: session.user.id,
      })
    : null;
  const sampleSimulation = simulateIntegration("slack", {
    config: {
      url: "https://hooks.slack.com/services/simulated",
      secretId: "00000000-0000-0000-0000-000000000000",
      body: { text: "Workflow event simulated from Auroranexis." },
    },
    templateContext: { workflow_name: "Sample workflow" },
  });

  return (
    <>
      <PageHeader
        module="workflows"
        title="Enterprise Integrations"
        description="Connect Slack, Teams, webhooks, and issue trackers. Live delivery for configured providers; simulation always available."
        action={
          <div className="flex items-center gap-4">
            {canManageSecrets && aiAccess.allowed ? (
              <>
                <Link
                  href="/automation/connectors"
                  className="text-sm font-medium text-accent-blue hover:underline"
                >
                  Enterprise connectors
                </Link>
                <Link
                  href="/automation/integrations/logs"
                  className="text-sm font-medium text-accent-blue hover:underline"
                >
                  Runtime logs
                </Link>
                <Link
                  href="/automation/integrations/secrets"
                  className="text-sm font-medium text-accent-blue hover:underline"
                >
                  Manage secrets
                </Link>
              </>
            ) : null}
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
        ) : (
          <div className="space-y-8">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Registered providers", value: summary?.registeredCount ?? 0 },
                { label: "Configured", value: summary?.configuredCount ?? 0 },
                { label: "Ready", value: summary?.readyCount ?? 0 },
                { label: "Workflow integration actions", value: summary?.workflowIntegrationActionCount ?? 0 },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-border bg-surface/80 px-4 py-4">
                  <p className="text-xs text-muted">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Provider catalog</h2>
                  <p className="mt-1 text-sm text-muted">
                    Credential readiness is derived from the encrypted secrets vault. Secret values are never displayed.
                  </p>
                </div>
                {canManageSecrets ? (
                  <Link
                    href="/automation/integrations/secrets"
                    className="text-sm font-medium text-accent-blue hover:underline"
                  >
                    Open secrets vault
                  </Link>
                ) : null}
              </div>
              <IntegrationsCatalog
                providers={providers}
                credentialSummaries={credentialSummaries}
                canManageSecrets={canManageSecrets}
              />
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Health & simulation</h2>
                <p className="mt-1 text-sm text-muted">
                  Previews use secret references only — decrypted values are never included.
                </p>
              </div>
              <IntegrationSimulationPreview sample={sampleSimulation} />
            </section>
          </div>
        )}
      </PageSurface>
    </>
  );
}
