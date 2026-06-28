import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { getBuildInfo } from "@/lib/diagnostics/platform-health";
import { APP_VERSION, COMPANY_NAME } from "@/lib/company/contact";

export const metadata: Metadata = {
  title: "About",
};

export default async function SettingsAboutPage() {
  await requireModuleAccess("settings");
  const build = getBuildInfo();

  return (
    <>
      <PageHeader
        module="settings"
        title="About"
        description={`${COMPANY_NAME} workspace information and program details.`}
      />

      <dl className="space-y-4 rounded-xl border border-border/70 bg-surface/40 p-6 text-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <dt className="text-muted">Product</dt>
          <dd className="font-medium text-foreground">{COMPANY_NAME}</dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <dt className="text-muted">Version</dt>
          <dd className="font-medium text-foreground">{APP_VERSION}</dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <dt className="text-muted">Environment</dt>
          <dd className="font-medium text-foreground">{build.environment}</dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
          <dt className="text-muted">Build</dt>
          <dd className="font-medium text-foreground">{build.deploymentUrl ?? build.nodeEnv}</dd>
        </div>
      </dl>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Pilot program</h2>
        <p className="text-sm text-muted">
          Auroranexis is accepting up to three pilot agencies for a six-week program with direct support and
          discounted pricing. See workspace Help → Feedback or contact support@auroranexis.com.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Roadmap</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
          <li>v1.0 GA — production hardening, status page, expanded E2E</li>
          <li>SSO / SAML for enterprise workspaces</li>
          <li>Public API keys and webhook expansion</li>
          <li>Additional connector catalog</li>
          <li>External docs site at docs.auroranexis.com</li>
        </ul>
        <p className="text-sm text-muted">
          <Link href="/docs" className="text-primary hover:underline">
            Documentation hub
          </Link>
          {" · "}
          <Link href="/docs/release-notes" className="text-primary hover:underline">
            Release notes
          </Link>
        </p>
      </section>
    </>
  );
}
