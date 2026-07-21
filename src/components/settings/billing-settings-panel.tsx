"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckoutBlockBanner } from "@/components/billing/checkout-block-banner";
import { BillingCheckoutSyncPoller } from "@/components/settings/billing-checkout-sync-poller";
import { BillingHistoryPanel } from "@/components/settings/billing-history-panel";
import { PlanUsageSummary } from "@/components/plans/plan-usage-summary";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter } from "@/components/ui/form-section";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import { createPortalSessionAction } from "@/lib/billing/actions";
import { sanitizeBillingCustomerError } from "@/lib/billing/errors";
import { PADDLE_PORTAL_UNAVAILABLE_MESSAGE } from "@/lib/billing/active-billing";
import type { PaddleCheckoutSyncStatus } from "@/lib/billing/checkout-sync-status";
import {
  billingStatusToneToBadge,
  canOpenBillingPortal,
  formatMoneyFromCents,
  getBillingStatusTone,
  getPaymentSummaryTone,
} from "@/lib/billing/status";
import {
  formatForecastWarning,
  formatProrationSummary,
} from "@/lib/billing/messages";
import type { BillingDashboardData, BillingUiStatus } from "@/lib/billing/types";
import type { AppLocale } from "@/lib/i18n";
import { formatBillingDateTime } from "@/lib/billing/types";
import type { OrganizationPlanUsageSummary } from "@/lib/plans/types";
import type { OrganizationSeatUsage } from "@/lib/seats/types";
import { EnterpriseRequestCard } from "@/components/settings/enterprise-request-card";
import { BillingConversionTracker } from "@/components/analytics/billing-conversion-tracker";
import type { EnterpriseStatus } from "@/lib/enterprise/types";
import type { BillingContactCardContent } from "@/lib/billing/billing-contact";
import { cn } from "@/lib/utils/cn";

type BillingSettingsPanelProps = {
  dashboard: BillingDashboardData;
  seatUsage: OrganizationSeatUsage;
  planUsage: OrganizationPlanUsageSummary;
  canManage: boolean;
  stripeStatus: BillingUiStatus;
  /** Active billing provider — Paddle is the sole active provider. */
  activeProvider?: "stripe" | "paddle";
  locale: AppLocale;
  success?: boolean;
  successMessage?: string | null;
  /** Paddle overlay redirected here with ?checkout=success */
  paddleCheckoutSuccess?: boolean;
  paddleSyncStatus?: PaddleCheckoutSyncStatus | null;
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
  activeProvider = "paddle",
  locale,
  success,
  successMessage,
  paddleCheckoutSuccess = false,
  paddleSyncStatus = null,
  cancelled,
  billingContactCard,
  enterpriseStatus,
  enterpriseAutoOpen = false,
}: BillingSettingsPanelProps) {
  void locale;
  const { overview } = dashboard;
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPortalPending, startPortalTransition] = useTransition();

  const showPortal = canOpenBillingPortal({
    canManage,
    portalAvailable: stripeStatus.portalAvailable,
    isUsable: overview.isUsable,
    hasPaymentProblem: overview.hasPaymentProblem,
    isPaymentPending: overview.isPaymentPending,
    stripeCustomerId: overview.subscription?.stripe_customer_id,
    providerCustomerId: overview.subscription?.provider_customer_id,
    activeProvider,
    billingProvider: overview.subscription?.billing_provider,
  });
  const showPortalUnavailableHint =
    activeProvider === "paddle" && canManage && stripeStatus.portalAvailable && !showPortal;
  const showPromotions = canManage && !enterpriseAutoOpen;
  const usingStarterFallback =
    planUsage.plan.planSource === "starter_fallback" ||
    planUsage.plan.planSource === "unmapped_price_id";
  const showSubscriptionManagement = canManage && overview.isUsable && showPortal;
  const showCancelSubscription =
    showSubscriptionManagement && stripeStatus.portalCancellationAvailable;

  const runPortal = () => {
    if (!showPortal) {
      setActionError(PADDLE_PORTAL_UNAVAILABLE_MESSAGE);
      return;
    }
    setActionError(null);
    startPortalTransition(async () => {
      const result = await createPortalSessionAction();
      if (result?.error) {
        setActionError(
          sanitizeBillingCustomerError(new Error(result.error), "Unable to open billing portal."),
        );
      }
    });
  };

  return (
    <div className="space-y-8">
      <BillingConversionTracker
        checkoutSuccess={Boolean(success) || paddleCheckoutSuccess}
        checkoutCancelled={Boolean(cancelled)}
        planTier={overview.currentPlanKey ?? "free"}
      />
      {paddleCheckoutSuccess ? (
        <BillingCheckoutSyncPoller
          enabled={paddleCheckoutSuccess}
          initialStatus={paddleSyncStatus}
        />
      ) : null}
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
      {overview.isCanceled ? (
        <FormAlert variant="warning">Subscription canceled</FormAlert>
      ) : null}
      {overview.cancelAtPeriodEnd && overview.scheduledCancellationDate ? (
        <FormAlert variant="warning">
          Your subscription will end on {overview.scheduledCancellationDate}. You keep access until
          then.
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
      {overview.isUsable ? null : overview.isInactive || usingStarterFallback ? (
        <FormAlert variant="warning">
          No active subscription is linked to this workspace.{" "}
          <Link href="/settings/plans" className="font-medium underline">
            Choose a plan
          </Link>
        </FormAlert>
      ) : null}
      {dashboard.checkoutBlock.blocked ? (
        <PageSurface>
          <PageSurfaceHeading
            title="Checkout blocked"
            description="New plan checkout stays disabled until this billing state is resolved."
          />
          <CheckoutBlockBanner
            checkoutBlock={dashboard.checkoutBlock}
            canManage={canManage}
            portalAvailable={stripeStatus.portalAvailable}
            showPortalAction={showPortal}
            onOpenPortal={runPortal}
            isPortalPending={isPortalPending}
            showBackToBilling={false}
          />
          {dashboard.checkoutBlock.blockingInvoiceStripeId ? (
            <p className="mt-3 text-sm text-muted">
              Blocking invoice:{" "}
              <code className="font-mono text-xs">
                {dashboard.checkoutBlock.blockingInvoiceStripeId}
              </code>
            </p>
          ) : null}
          {canManage ? (
            <p className="mt-2 text-sm text-muted">
              Owner/admin cleanup tools are in{" "}
              <Link href="/settings/billing/diagnostics" className="font-medium text-primary hover:underline">
                Billing diagnostics
              </Link>
              .
            </p>
          ) : null}
        </PageSurface>
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
          {overview.subscription?.billing_provider ? (
            <p className="text-muted">
              Provider:{" "}
              <span className="font-medium text-foreground">
                {overview.subscription.billing_provider === "paddle" ? "Paddle" : "Stripe"}
              </span>
              {overview.subscription.provider_status
                ? ` · provider status: ${overview.subscription.provider_status}`
                : null}
            </p>
          ) : null}
          {overview.subscription?.sync_pending ? (
            <p className="text-muted">
              Payment confirmation is syncing. Access updates after the billing provider confirms the
              transaction.
            </p>
          ) : null}
          {overview.isCanceled ? <p className="text-muted">Subscription canceled</p> : null}
          {overview.trialEndsAt ? <p>Trial ends {formatBillingDateTime(overview.trialEndsAt) ?? "—"}</p> : null}
        </BillingCard>
        <BillingCard title="Billing period">
          {overview.isUsable ? (
            <>
              {overview.billingPeriodLabel ? (
                <p>
                  Current period:{" "}
                  <span className="font-medium text-foreground">{overview.billingPeriodLabel}</span>
                </p>
              ) : (
                <p>No billing period on file.</p>
              )}
              <p>
                Renewal date:{" "}
                <span className="font-medium text-foreground">{overview.renewalDate ?? "—"}</span>
              </p>
              <p>
                Cancel at period end:{" "}
                <span className="font-medium text-foreground">
                  {overview.cancelAtPeriodEnd ? "Yes" : "No"}
                </span>
              </p>
              {overview.scheduledCancellationDate ? (
                <p>
                  Scheduled cancellation:{" "}
                  <span className="font-medium text-foreground">
                    {overview.scheduledCancellationDate}
                  </span>
                </p>
              ) : null}
            </>
          ) : (
            <>
              {overview.billingPeriodLabel ? <p>{overview.billingPeriodLabel}</p> : <p>No billing period on file.</p>}
              <p>
                Renewal date:{" "}
                <span className="font-medium text-foreground">{overview.renewalDate ?? "—"}</span>
              </p>
            </>
          )}
        </BillingCard>
        <BillingCard title="Payment status">
          <div className="flex items-center justify-between gap-3">
            <span>{overview.paymentStatusLabel}</span>
            <StatusBadge tone={resolvePaymentTone(overview)} label={overview.paymentStatusLabel} />
          </div>
        </BillingCard>
      </div>

      <PlanUsageSummary summary={planUsage} seatUsage={seatUsage} />

      {showSubscriptionManagement ? (
        <PageSurface>
          <PageSurfaceHeading
            title="Subscription management"
            description={
              activeProvider === "paddle"
                ? "Manage your subscription, payment methods, and invoices in the Paddle customer portal."
                : "Manage your subscription, payment methods, and invoices in the Stripe Customer Portal."
            }
          />
          {actionError ? <FormAlert variant="warning">{actionError}</FormAlert> : null}
          {!stripeStatus.portalCancellationAvailable ? (
            <p className="text-sm text-muted">
              Subscription cancellation is not currently available.
            </p>
          ) : null}
          <FormFooter className="border-t-0 pt-4">
            <Button
              type="button"
              disabled={isPortalPending}
              loading={isPortalPending}
              loadingText="Opening…"
              onClick={runPortal}
            >
              Open Billing Portal
            </Button>
            <LinkButton href="/settings/plans" variant="secondary">
              Change Plan
            </LinkButton>
            {showCancelSubscription ? (
              <Button
                type="button"
                variant="secondary"
                disabled={isPortalPending}
                loading={isPortalPending}
                loadingText="Opening…"
                onClick={runPortal}
              >
                Cancel Subscription
              </Button>
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

      {dashboard.paddleDetails ? (
        <div className="grid gap-4 md:grid-cols-2">
          <BillingCard title="Payment method">
            {dashboard.paddleDetails.paymentMethod?.brand ||
            dashboard.paddleDetails.paymentMethod?.last4 ? (
              <p className="text-foreground">
                {[dashboard.paddleDetails.paymentMethod.brand, dashboard.paddleDetails.paymentMethod.last4
                  ? `•••• ${dashboard.paddleDetails.paymentMethod.last4}`
                  : null]
                  .filter(Boolean)
                  .join(" ")}
                {dashboard.paddleDetails.paymentMethod.expMonth &&
                dashboard.paddleDetails.paymentMethod.expYear
                  ? ` · expires ${String(dashboard.paddleDetails.paymentMethod.expMonth).padStart(2, "0")}/${dashboard.paddleDetails.paymentMethod.expYear}`
                  : null}
              </p>
            ) : (
              <p className="text-muted">
                No upcoming payment method summary is currently available.
                {showPortal ? " Manage payment methods in the billing portal." : null}
              </p>
            )}
            {showPortal ? (
              <FormFooter className="border-t-0 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isPortalPending}
                  loading={isPortalPending}
                  onClick={runPortal}
                >
                  Manage payment method
                </Button>
              </FormFooter>
            ) : null}
          </BillingCard>
          <BillingCard title="Next payment">
            {dashboard.paddleDetails.nextPayment?.date ||
            dashboard.paddleDetails.nextPayment?.total != null ? (
              <>
                <p className="text-foreground">
                  {dashboard.paddleDetails.nextPayment.date
                    ? formatBillingDateTime(dashboard.paddleDetails.nextPayment.date)
                    : "Date unavailable"}
                </p>
                {dashboard.paddleDetails.nextPayment.total != null &&
                dashboard.paddleDetails.nextPayment.currency ? (
                  <p className="text-muted">
                    Total{" "}
                    {formatMoneyFromCents(
                      dashboard.paddleDetails.nextPayment.total,
                      dashboard.paddleDetails.nextPayment.currency,
                    )}
                    {dashboard.paddleDetails.nextPayment.subtotal != null
                      ? ` · subtotal ${formatMoneyFromCents(dashboard.paddleDetails.nextPayment.subtotal, dashboard.paddleDetails.nextPayment.currency)}`
                      : null}
                    {dashboard.paddleDetails.nextPayment.tax != null
                      ? ` · tax ${formatMoneyFromCents(dashboard.paddleDetails.nextPayment.tax, dashboard.paddleDetails.nextPayment.currency)}`
                      : null}
                  </p>
                ) : (
                  <p className="text-muted">No upcoming payment amount is currently available.</p>
                )}
              </>
            ) : (
              <p className="text-muted">No upcoming payment is currently available.</p>
            )}
          </BillingCard>
        </div>
      ) : null}

      <BillingHistoryPanel
        initialItems={dashboard.billingHistory}
        canManage={canManage}
        pageSize={10}
      />

      {showPromotions ? (
        <PageSurface>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Promotions</h2>
            <StatusBadge tone="slate" label="Coming Soon" />
          </div>
          <p className="text-sm text-muted">
            Promotion codes are currently under development and will become available in a future
            release.
          </p>
          <p className="mt-2 text-sm text-muted">
            Customers will be able to redeem promotional and campaign codes directly during checkout
            once this feature becomes available.
          </p>
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

      {canManage && !showSubscriptionManagement ? (
        <PageSurface>
          <PageSurfaceHeading title="Billing actions" description="Upgrade, downgrade, or manage payment methods." />
          {!showPortal && actionError ? <FormAlert variant="warning">{actionError}</FormAlert> : null}
          {!stripeStatus.portalAvailable ? (
            <p className="text-sm text-muted">Billing is currently unavailable.</p>
          ) : null}
          {!showPortal && stripeStatus.portalAvailable && (overview.isInactive || usingStarterFallback) ? (
            <p className="text-sm text-muted">
              {showPortalUnavailableHint
                ? "A billing portal will be available after your first completed subscription."
                : "Choose a plan to start a subscription. The billing portal opens after checkout or when a subscription needs payment."}
            </p>
          ) : null}
          {showPortalUnavailableHint && !(overview.isInactive || usingStarterFallback) ? (
            <p className="text-sm text-muted">
              A billing portal will be available after your first completed subscription.
            </p>
          ) : null}
          {showPortal && !overview.isUsable ? (
            <>
              {actionError ? <FormAlert variant="warning">{actionError}</FormAlert> : null}
              <FormFooter className="border-t-0 pt-0">
                <Button
                  type="button"
                  disabled={isPortalPending}
                  loading={isPortalPending}
                  loadingText="Opening…"
                  onClick={runPortal}
                >
                  Open Billing Portal
                </Button>
              </FormFooter>
            </>
          ) : null}
          {!overview.isUsable && !showPortal ? (
            <FormFooter className="border-t-0 pt-0">
              <LinkButton href="/settings/plans">Choose a plan</LinkButton>
              <LinkButton href="/settings/usage" variant="secondary" size="md">
                Usage dashboard
              </LinkButton>
            </FormFooter>
          ) : null}
        </PageSurface>
      ) : null}
      {!canManage ? (
        <p className="text-sm text-muted">Billing management is limited to organization owners and admins.</p>
      ) : null}

      {canManage ? (
        <p className="text-[11px] text-muted/80">
          Internal ·{" "}
          <Link
            href="/settings/billing/diagnostics"
            className="text-muted hover:text-foreground hover:underline"
          >
            Billing diagnostics
          </Link>
        </p>
      ) : null}
    </div>
  );
}
