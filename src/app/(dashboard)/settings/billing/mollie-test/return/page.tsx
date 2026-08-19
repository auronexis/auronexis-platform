import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormAlert } from "@/components/ui/form-alert";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import { PageHeader } from "@/components/layout/page-header";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { getMollieTestDiagnostics, isMollieTestCheckoutConfigured } from "@/lib/billing/providers/mollie/checkout";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export const metadata: Metadata = {
  title: "Mollie Checkout Return",
};

type MollieTestReturnPageProps = {
  searchParams: Promise<{ attempt?: string }>;
};

/**
 * Safe return page — does not trust query params for entitlement or paid state.
 * Shows neutral verifying message; operator refreshes diagnostics separately.
 */
export default async function MollieTestReturnPage({ searchParams }: MollieTestReturnPageProps) {
  await requireModuleAccess("settings");
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const attemptPresent = Boolean(params.attempt?.trim());

  const configured = isMollieTestCheckoutConfigured();
  const diagnostics = configured
    ? await getMollieTestDiagnostics(session.organization.id).catch(() => null)
    : null;

  return (
    <>
      <div className="mb-4 text-sm text-muted">
        <Link href="/settings/billing/mollie-test" className="font-medium text-primary hover:underline">
          Mollie test checkout
        </Link>
      </div>

      <PageHeader
        module="settings"
        eyebrow="Internal · TEST MODE"
        title="Verifying Mollie payment"
        description="Return from Mollie hosted checkout. Payment confirmation happens via webhook and authoritative API re-fetch — not this page."
      />

      <PageSurface>
        <PageSurfaceHeading
          title="Verification in progress"
          description="If you completed checkout, Mollie will notify our webhook. Use Refresh test state on the test checkout page once processing completes."
        />

        <FormAlert variant="warning" className="mb-4">
          {attemptPresent
            ? "Checkout attempt recorded. Awaiting authoritative Mollie payment status."
            : "Returned from Mollie. Awaiting authoritative payment status — redirect query params are not trusted."}
        </FormAlert>

        {diagnostics ? (
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted">
            <p className="mb-2 font-medium text-foreground">Current isolated test state</p>
            <p>Sync pending: {diagnostics.syncPending == null ? "unknown" : diagnostics.syncPending ? "yes" : "no"}</p>
            <p>Subscription prefix: {diagnostics.subscriptionIdPrefix ?? "not yet created"}</p>
            <p>Last reconciled: {diagnostics.lastReconciledAt ?? "never"}</p>
          </div>
        ) : null}

        <p className="mt-4 text-sm">
          <Link href="/settings/billing/mollie-test" className="font-medium text-primary hover:underline">
            Back to Mollie test checkout
          </Link>
        </p>
      </PageSurface>
    </>
  );
}
