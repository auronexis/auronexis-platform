import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IntegrationSecretsWorkspace } from "@/components/automation/integration-secrets-workspace";
import { AutomationUpgradeCard } from "@/components/automation/automation-center-card";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";
import { requireSession } from "@/lib/auth/session";
import { getIntegrationEncryptionKeyStatus } from "@/lib/integrations/secrets/encryption";
import { listSecretReferences } from "@/lib/integrations/secrets/repository";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import {
  checkPlanFeatureForSession,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";

export const metadata: Metadata = {
  title: "Integration secrets",
};

export default async function IntegrationSecretsPage() {
  const session = await requireSession();
  const aiAccess = await checkPlanFeatureForSession(session, "ai_automation_builder");

  if (!canManageOrganizationSettings(session)) {
    redirect("/automation/integrations");
  }

  const keyStatus = getIntegrationEncryptionKeyStatus();
  const secrets = aiAccess.allowed ? await listSecretReferences(session) : [];

  return (
    <>
      <PageHeader
        module="workflows"
        title="Integration secrets"
        description="Encrypted credential vault for enterprise integrations. Values are never shown again after save."
        action={
          <Link href="/automation/integrations" className="text-sm font-medium text-accent-blue hover:underline">
            Back to integrations
          </Link>
        }
      />

      <PageSurface>
        {!aiAccess.allowed ? (
          <AutomationUpgradeCard
            message={getFeatureUpgradeMessage("ai_automation_builder")}
            requiredPlanLabel={getRequiredPlanLabel("ai_automation_builder")}
          />
        ) : (
          <IntegrationSecretsWorkspace
            initialSecrets={secrets}
            encryptionKeyConfigured={keyStatus.configured}
            encryptionKeyWarning={keyStatus.warning}
          />
        )}
      </PageSurface>
    </>
  );
}
