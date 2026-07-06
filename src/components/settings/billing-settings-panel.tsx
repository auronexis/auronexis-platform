"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { InvoiceCenterPanel } from "@/components/settings/invoice-center-panel";
import { PlanUsageSummary } from "@/components/plans/plan-usage-summary";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import {
  createPortalSessionAction,
  validateDiscountCodeAction,
} from "@/lib/billing/actions";
import { sanitizeBillingCustomerError } from "@/lib/billing/errors";
import {
  billingStatusToneToBadge,
  canOpenBillingPortal,
  findLatestOpenInvoice,
  getBillingStatusTone,
  getPaymentSummaryTone,
} from "@/lib/billing/status";
import {
  formatForecastWarning,
  formatProrationSummary,
} from "@/lib/billing/messages";
import type { BillingDashboardData, StripeBillingUiStatus } from "@/lib/billing/types";
import { formatBillingDateTime } from "@/lib/billing/types";
import type { OrganizationPlanUsageSummary } from "@/lib/plans/types";
import type { OrganizationSeatUsage } from "@/lib/seats/types";
import { EnterpriseRequestCard } from "@/components/settings/enterprise-request-card";
import type { EnterpriseStatus } from "@/lib/enterprise/types";
import type { BillingContactCardContent } from "@/lib/billing/billing-contact";
import { cn } from "@/lib/utils/cn";

type BillingSettingsPanelProps = {
  dashboard: BillingDashboardData;
  seatUsage: OrganizationSeatUsage;
  planUsage: OrganizationPlanUsageSummary;
  canManage: boolean;
  stripeStatus: StripeBillingUiStatus;
  success?: boolean;
  successMessage?: string | null;
  cancelled?: boolean;
  billingContactCard?: BillingContactCardContent | null;
  enterpriseStatus?: EnterpriseStatus;
  enterpriseAutoOpen?: boolean;
};

function BillingCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="mb-0">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="mt-4 space-y-3 text-sm text-muted">{children}</CardContent>
    </Card>
  );
}

function StatusBadge({
  tone,
  label,
}: {
  tone: "green" | "amber" | "red" | "slate";
  label: string;
}) {
  const styles = {
    green: "border-success/25 bg-success/10 text-success",
    amber: "border-warning/25 bg-warning/10 text-warning",
    red: "border-danger/25 bg-danger/10 text-danger",
    slate: "border-border bg-muted/10 text-muted",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        styles[tone],
      )}
    >
      {label}
    </span>
  );
}

function resolveStatusTone(overview: BillingDashboardData["overview"]): "green" | "amber" | "red" | "slate" {
  return billingStatusToneToBadge(
    getBillingStatusTone(overview.subscription?.status ?? "inactive"),
  );
}

function resolvePaymentTone(overview: BillingDashboardData["overview"]): "green" | "amber" | "red" | "slate" {
  return billingStatusToneToBadge(getPaymentSummaryTone(overview.subscription?.status ?? "inactive"));
}

function BillingContactCard({ card }: { card: BillingContactCardContent }) {
  return (
    <PageSurface>
      <PageSurfaceHeading title={card.title} />
      <p className="mt-4 text-sm text-muted">{card.text}</p>
      <FormFooter className="border-t-0 pt-4">
        <LinkButton href={`mailto:${card.email}`} variant="primary">
          Email {card.email}
        </LinkButton>
      </FormFooter>
    </PageSurface>
  );
}

export function BillingSettingsPanel({
  dashboard,
  seatUsage,
  planUsage,
  canManage,
  stripeStatus,
  success,
  successMessage,
  cancelled,
  billingContactCard,
  enterpriseStatus,
  enterpriseAutoOpen = false,
}: BillingSettingsPanelProps) {
  const { overview } = dashboard;
  const [actionError, setActionError] = useState<string | null>(null);
  const [discountNotice, setDiscountNotice] = useState<{
    variant: "success" | "warning";
    message: string;
  } | null>(null);
  const [isPortalPending, startPortalTransition] = useTransition();
  const [isDiscountPending, startDiscountTransition] = useTransition();

  const showPortal = canOpenBillingPortal({
    canManage,
    portalAvailable: stripeStatus.portalAvailable,
    isUsable: overview.isUsable,
    hasPaymentProblem: overview.hasPaymentProblem,
    isPaymentPending: overview.isPaymentPending,
    stripeCustomerId: overview.subscription?.stripe_customer_id,
  });
  const showPromotions = canManage && !enterpriseAutoOpen;
  const latestOpenInvoice = findLatestOpenInvoice(dashboard.invoices);
  const usingStarterFallback =
    planUsage.plan.planSource === "starter_fallback" ||
    planUsage.plan.planSource === "unmapped_price_id";

  const runPortal = () => {
    setActionError(null);
    startPortalTransition(async () => {
      const result = await createPortalSessionAction();
      if (result?.error) {
        setActionError(sanitizeBillingCustomerError(new Error(result.error), "Unable to open billing portal."));
      }
    });
  };

  const previewDiscount = (formData: FormData) => {
    const code = String(formData.get("discountCode") ?? "").trim();
    setDiscountNotice(null);

    if (!code) {
      return;
    }

    startDiscountTransition(async () => {
      const result = await validateDiscountCodeAction({}, formData);
      if (result.error) {
        setDiscountNotice({ variant: "warning", message: result.error });
        return;
      }

      if (result.success) {
        setDiscountNotice({ variant: "success", message: result.success });
      }
    });
  };

  return (
    <div className="space-y-8">
      {success ? (
        <FormAlert variant="success">
          {successMessage ?? "Payment received. Your plan may update shortly."}
        </FormAlert>
      ) : null}
      {cancelled ? (
        <FormAlert variant="warning">
          Checkout was cancelled. No changes were made to your subscription.
        </FormAlert>
      ) : null}
      {billingContactCard ? <BillingContactCard card={billingContactCard} /> : null}
      {enterpriseStatus ? (
        <EnterpriseRequestCard
          status={enterpriseStatus}
          canManage={canManage}
          autoOpen={enterpriseAutoOpen}
        />
      ) : null}
      {overview.isUsable ? null : overview.hasPaymentProblem || overview.isPaymentPending ? (
        <FormAlert variant="warning">
          Your subscription is not fully active yet. Please complete or update your payment.
          {latestOpenInvoice?.hostedInvoiceUrl ? (
            <>
              {" "}
              <a
                href={latestOpenInvoice.hostedInvoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium underline"
              >
                Open invoice
              </a>
            </>
          ) : null}
          {showPortal ? (
            <>
              {" "}
              <button
                type="button"
                className="font-medium underline"
                onClick={runPortal}
                disabled={isPortalPending}
              >
                Open billing portal
              </button>
            </>
          ) : null}
        </FormAlert>
      ) : overview.isInactive || usingStarterFallback ? (
        <FormAlert variant="warning">
          No active subscription is linked to this workspace.{" "}
          <Link href="/settings/plans" className="font-medium underline">
            Choose a plan
          </Link>
        </FormAlert>
      ) : null}
      {dashboard.forecastStatus !== "healthy" && !enterpriseAutoOpen ? (
        <FormAlert variant={dashboard.forecastStatus === "critical" ? "warning" : "warning"}>
          {formatForecastWarning(dashboard.forecastStatus === "critical" ? "critical" : "warning")}{" "}
          <Link href="/settings/usage" className="font-medium underline">
            Usage dashboard
          </Link>
        </FormAlert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <BillingCard title="Current plan">
          <p className="text-lg font-semibold text-foreground">{overview.planLabel}</p>
          {overview.isUsable ? (
            <p className="text-muted">Your workspace has an active paid subscription.</p>
          ) : overview.hasPaymentProblem || overview.isPaymentPending ? (
            <p className="text-muted">Plan selected, waiting for payment to complete.</p>
          ) : (
            <p className="text-muted">
              {stripeStatus.checkoutAvailable ? (
                <>
                  <Link href="/settings/plans" className="font-medium text-primary hover:underline">
                    Choose a plan
                  </Link>{" "}
                  to subscribe.
                </>
              ) : (
                "Billing is currently unavailable. Contact sales for assistance."
              )}
            </p>
          )}
        </BillingCard>
        <BillingCard title="Subscription status">
          <div className="flex items-center justify-between gap-3">
            <span>{overview.statusLabel}</span>
            <StatusBadge tone={resolveStatusTone(overview)} label={overview.statusLabel} />
          </div>
          {overview.cancelAtPeriodEnd ? (
            <p className="text-warning">Cancellation scheduled at end of billing period.</p>
          ) : null}
          {overview.trialEndsAt ? <p>Trial ends {formatBillingDateTime(overview.trialEndsAt) ?? "—"}</p> : null}
        </BillingCard>
        <BillingCard title="Billing period">
          {overview.billingPeriodLabel ? <p>{overview.billingPeriodLabel}</p> : <p>No billing period on file.</p>}
          <p>
            Renewal date:{" "}
            <span className="font-medium text-foreground">{overview.renewalDate ?? "—"}</span>
          </p>
        </BillingCard>
        <BillingCard title="Payment status">
          <div className="flex items-center justify-between gap-3">
            <span>{overview.paymentStatusLabel}</span>
            <StatusBadge tone={resolvePaymentTone(overview)} label={overview.paymentStatusLabel} />
          </div>
        </BillingCard>
      </div>

      <PlanUsageSummary summary={planUsage} seatUsage={seatUsage} />

      {showPortal ? (
        <PageSurface>
          <PageSurfaceHeading
            title="Self-service billing"
            description="Update payment methods, download invoices, and manage your subscription in Stripe."
          />
          {actionError ? <FormAlert variant="warning">{actionError}</FormAlert> : null}
          <FormFooter className="border-t-0 pt-4">
            <Button
              type="button"
              disabled={isPortalPending}
              loading={isPortalPending}
              loadingText="Opening…"
              onClick={runPortal}
            >
              Open billing portal
            </Button>
            {overview.isUsable ? (
              <Link href="/settings/plans">
                <Button type="button" variant="secondary">
                  Change plan
                </Button>
              </Link>
            ) : null}
          </FormFooter>
        </PageSurface>
      ) : null}

      <PageSurface>
        <PageSurfaceHeading title="Plan limits" description="Monthly quotas enforced server-side for your current plan." />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {dashboard.limits.slice(0, 9).map((limit) => (
            <div key={limit.key} className="rounded-lg border border-border/70 px-3 py-2 text-sm">
              <p className="font-medium text-foreground">{limit.label}</p>
              <p className="text-muted">
                {limit.used.toLocaleString()}
                {limit.limit !== null ? ` / ${limit.limit.toLocaleString()}` : " / Unlimited"}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          Full usage charts and forecasts on{" "}
          <Link href="/settings/usage" className="font-medium text-primary hover:underline">
            Usage dashboard
          </Link>
          .
        </p>
      </PageSurface>

      <InvoiceCenterPanel invoices={dashboard.invoices} canManage={canManage} />

      {showPromotions ? (
        <PageSurface>
          <PageSurfaceHeading title="Promotions" description="Check whether a promo code applies to your plan before checkout." />
          <form action={previewDiscount} className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <input type="hidden" name="planKey" value={overview.currentPlanKey ?? "professional"} />
            <div className="min-w-0 flex-1 sm:min-w-[220px]">
              <Input name="discountCode" label="Promo code" placeholder="LAUNCH20" />
            </div>
            <Button type="submit" variant="secondary" loading={isDiscountPending}>
              Check promotion
            </Button>
          </form>
          {discountNotice ? (
            <FormAlert variant={discountNotice.variant}>{discountNotice.message}</FormAlert>
          ) : null}
          {dashboard.discounts.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {dashboard.discounts.map((discount) => (
                <div key={discount.code} className="rounded-lg border border-border/70 p-3 text-sm">
                  <p className="font-semibold text-foreground">{discount.code}</p>
                  <p className="text-muted">{discount.description ?? "Available promotion"}</p>
                  <p className="mt-1 text-foreground">Saves {discount.formattedSavings}</p>
                </div>
              ))}
            </div>
          ) : null}
        </PageSurface>
      ) : null}

      {canManage && overview.isUsable && dashboard.prorationPreviews.length > 0 ? (
        <PageSurface>
          <PageSurfaceHeading
            title="Plan change estimate"
            description="Estimated costs if you change plans before your current billing period ends."
          />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {dashboard.prorationPreviews.map((preview) => (
              <div key={preview.toPlanKey} className="rounded-lg border border-border/70 p-4 text-sm">
                <p className="font-medium capitalize text-foreground">
                  {preview.direction} to {preview.toPlanKey}
                </p>
                <p className="mt-1 text-muted">
                  {formatProrationSummary(preview)}
                </p>
              </div>
            ))}
          </div>
        </PageSurface>
      ) : null}

      {canManage ? (
        <PageSurface>
          <PageSurfaceHeading title="Billing actions" description="Upgrade, downgrade, cancel, or manage payment methods." />
          {!showPortal && actionError ? <FormAlert variant="warning">{actionError}</FormAlert> : null}
          {!stripeStatus.portalAvailable ? (
            <p className="text-sm text-muted">Billing is currently unavailable.</p>
          ) : null}
          {!showPortal && stripeStatus.portalAvailable && (overview.isInactive || usingStarterFallback) ? (
            <p className="text-sm text-muted">
              Choose a plan to start a subscription. The billing portal opens after checkout or when a
              subscription needs payment.
            </p>
          ) : null}
          <FormFooter className="border-t-0 pt-0">
            {!overview.isUsable ? (
              <Link href="/settings/plans">
                <Button type="button">Choose a plan</Button>
              </Link>
            ) : (
              <Link href="/settings/plans">
                <Button type="button" variant={showPortal ? "secondary" : undefined}>
                  Change plan
                </Button>
              </Link>
            )}
            <LinkButton href="/settings/usage" variant="secondary" size="md">
              Usage dashboard
            </LinkButton>
            {showPortal ? (
              <Button
                type="button"
                disabled={isPortalPending}
                loading={isPortalPending}
                loadingText="Opening…"
                onClick={runPortal}
              >
                Open billing portal
              </Button>
            ) : null}
          </FormFooter>
        </PageSurface>
      ) : (
        <p className="text-sm text-muted">Billing management is limited to organization owners and admins.</p>
      )}

      {canManage ? (
        <p className="text-xs text-muted">
          Internal billing diagnostics for owners and admins:{" "}
          <Link href="/settings/billing/diagnostics" className="font-medium text-primary hover:underline">
            Billing diagnostics
          </Link>
        </p>
      ) : null}
    </div>
  );
}
