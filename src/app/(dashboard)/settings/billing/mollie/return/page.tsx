import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormAlert } from "@/components/ui/form-alert";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import { PageHeader } from "@/components/layout/page-header";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { resolveMollieProductionReturnPageState } from "@/lib/billing/providers/mollie/return-state";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export const metadata: Metadata = {
  title: "Checkout Return",
};

type MollieReturnPageProps = {
  searchParams: Promise<{ attempt?: string; purpose?: string }>;
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
  const returnState = await resolveMollieProductionReturnPageState({
    organizationId: session.organization.id,
  });

  const title =
    returnState.kind === "success"
      ? "Subscription active"
      : returnState.kind === "activation_failed"
        ? "Activation needs attention"
        : returnState.kind === "processing"
          ? "Activating subscription"
          : "Verifying payment";

  const description =
    returnState.kind === "success"
      ? "Your workspace billing state is active. Entitlements were confirmed from authoritative provider sync — not this redirect."
      : returnState.kind === "activation_failed"
        ? "Payment was confirmed but subscription activation did not complete. Contact support or run operator recovery — do not pay again."
        : returnState.kind === "processing"
          ? "Payment confirmed. Subscription activation is still in progress via webhook reconcile."
          : "Return from hosted checkout. Payment confirmation happens via webhook and authoritative API re-fetch — not this page.";

  const alertVariant =
    returnState.kind === "success"
      ? "success"
      : returnState.kind === "activation_failed"
        ? "error"
        : "warning";

  const alertMessage =
    returnState.kind === "success"
      ? "Your subscription is active."
      : returnState.kind === "activation_failed"
        ? `Paid payment detected (${returnState.paymentId ?? "unknown"}) but activation failed. Support can recover without a new payment.`
        : returnState.kind === "processing"
          ? attemptPresent
            ? "Checkout attempt recorded. Final activation is processing."
            : "Checkout returned. Final activation is processing."
          : attemptPresent
            ? "Checkout attempt recorded. Awaiting authoritative payment confirmation."
            : "Returned from checkout. Awaiting authoritative payment status — redirect query params are not trusted.";

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
        title={title}
        description={description}
      />

      <PageSurface>
        <PageSurfaceHeading
          title={returnState.statusLabel}
          description="This page reflects reconciled billing state only."
        />

        <FormAlert variant={alertVariant} className="mb-4">
          {alertMessage}
        </FormAlert>

        <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted">
          <p className="mb-2 font-medium text-foreground">Current billing sync</p>
          <p>Sync pending: {returnState.syncPending ? "yes" : "no"}</p>
          <p>State: {returnState.kind}</p>
        </div>

        <p className="mt-4 text-sm">
          <Link href="/settings/billing" className="font-medium text-primary hover:underline">
            Back to Billing
          </Link>
        </p>
      </PageSurface>
    </>
  );
}
