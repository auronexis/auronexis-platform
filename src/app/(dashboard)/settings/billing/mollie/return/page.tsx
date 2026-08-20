import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormAlert } from "@/components/ui/form-alert";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import { PageHeader } from "@/components/layout/page-header";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { getOrganizationSubscription } from "@/lib/billing/queries";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export const metadata: Metadata = {
  title: "Checkout Return",
};

type MollieReturnPageProps = {
  searchParams: Promise<{ attempt?: string }>;
};

/**
 * Informational return page only — never grants entitlements from query params.
 * Paid access activates only after classic Mollie webhook + API reconcile.
 */
export default async function MollieProductionReturnPage({ searchParams }: MollieReturnPageProps) {
  await requireModuleAccess("settings");
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const attemptPresent = Boolean(params.attempt?.trim());
  const subscription = await getOrganizationSubscription(session).catch(() => null);

  return (
    <>
      <div className="mb-4 text-sm text-muted">
        <Link href="/settings/billing" className="font-medium text-primary hover:underline">
          Billing
        </Link>
      </div>

      <PageHeader
        module="settings"
        eyebrow="Billing"
        title="Verifying payment"
        description="Return from hosted checkout. Payment confirmation happens via webhook and authoritative API re-fetch — not this page."
      />

      <PageSurface>
        <PageSurfaceHeading
          title="Verification in progress"
          description="If you completed checkout, your plan updates after the billing provider confirms payment. This page does not activate access."
        />

        <FormAlert variant="warning" className="mb-4">
          {attemptPresent
            ? "Checkout attempt recorded. Awaiting authoritative payment confirmation."
            : "Returned from checkout. Awaiting authoritative payment status — redirect query params are not trusted."}
        </FormAlert>

        {subscription?.billing_provider === "mollie" ? (
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted">
            <p className="mb-2 font-medium text-foreground">Current billing sync</p>
            <p>Sync pending: {subscription.sync_pending ? "yes" : "no"}</p>
            <p>Status: {subscription.status}</p>
          </div>
        ) : null}

        <p className="mt-4 text-sm">
          <Link href="/settings/billing" className="font-medium text-primary hover:underline">
            Back to Billing
          </Link>
        </p>
      </PageSurface>
    </>
  );
}
