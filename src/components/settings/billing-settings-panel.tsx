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
import type { BillingDashboardData } from "@/lib/billing/types";
import { formatBillingDateTime } from "@/lib/billing/types";
import { PLAN_SOURCE_LABELS } from "@/lib/plans/plan-source-labels";
import type { OrganizationPlanUsageSummary } from "@/lib/plans/types";
import type { OrganizationSeatUsage } from "@/lib/seats/types";
import { cn } from "@/lib/utils/cn";

type BillingSettingsPanelProps = {
  dashboard: BillingDashboardData;
  seatUsage: OrganizationSeatUsage;
  planUsage: OrganizationPlanUsageSummary;
  canManage: boolean;
  success?: boolean;
  cancelled?: boolean;
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
  if (overview.isActive) return "green";
  if (overview.subscription?.status === "past_due" || overview.subscription?.status === "unpaid") return "red";
  if (overview.subscription?.status === "trialing") return "amber";
  return "slate";
}

function resolvePaymentTone(overview: BillingDashboardData["overview"]): "green" | "amber" | "red" | "slate" {
  if (overview.paymentStatusLabel === "Paid") return "green";
  if (overview.paymentStatusLabel === "Payment failed") return "red";
  if (overview.paymentStatusLabel === "Incomplete") return "amber";
  return "slate";
}

export function BillingSettingsPanel({
  dashboard,
  seatUsage,
  planUsage,
  canManage,
  success,
  cancelled,
}: BillingSettingsPanelProps) {
  const { overview } = dashboard;
  const [actionError, setActionError] = useState<string | null>(null);
  const [discountMessage, setDiscountMessage] = useState<string | null>(null);
  const [isPortalPending, startPortalTransition] = useTransition();
  const [isDiscountPending, startDiscountTransition] = useTransition();

  const showManage = canManage && Boolean(overview.subscription?.stripe_customer_id);
  const usingStarterFallback =
    planUsage.plan.planSource === "starter_fallback" ||
    planUsage.plan.planSource === "unmapped_price_id";
  const showDiagnosticsHint =
    canManage &&
    (!overview.subscription || !overview.isActive || planUsage.plan.planSource === "unmapped_price_id");

  const runPortal = () => {
    setActionError(null);
    startPortalTransition(async () => {
      const result = await createPortalSessionAction();
      if (result?.error) setActionError(result.error);
    });
  };

  const previewDiscount = (formData: FormData) => {
    setDiscountMessage(null);
    setActionError(null);
    startDiscountTransition(async () => {
      const result = await validateDiscountCodeAction({}, formData);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      setDiscountMessage(result.success ?? "Discount validated.");
    });
  };

  return (
    <div className="space-y-8">
      {success ? (
        <FormAlert variant="success">
          Subscription checkout completed. Your billing status will update shortly.
        </FormAlert>
      ) : null}
      {cancelled ? (
        <FormAlert variant="warning">
          Checkout was cancelled. No changes were made to your subscription.
        </FormAlert>
      ) : null}
      {usingStarterFallback ? (
        <FormAlert variant="warning">
          No active Stripe subscription found with a mapped plan. Your workspace is using Starter fallback.
        </FormAlert>
      ) : null}
      {planUsage.plan.devOverrideActive ? (
        <FormAlert variant="warning">
          Development override active — resolved plan is {planUsage.plan.planLabel} (
          {PLAN_SOURCE_LABELS.dev_override}).
        </FormAlert>
      ) : null}
      {dashboard.forecastStatus !== "healthy" ? (
        <FormAlert variant={dashboard.forecastStatus === "critical" ? "error" : "warning"}>
          Usage forecast is {dashboard.forecastStatus}. Review{" "}
          <Link href="/settings/usage" className="font-medium underline">
            Usage
          </Link>{" "}
          for details.
        </FormAlert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <BillingCard title="Current plan">
          <p className="text-lg font-semibold text-foreground">{overview.planLabel}</p>
          <p className="text-sm text-muted">Source: {PLAN_SOURCE_LABELS[planUsage.plan.planSource]}</p>
          {!overview.isActive ? <p>Select a plan on the pricing page to subscribe.</p> : null}
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

      {canManage ? (
        <PageSurface>
          <PageSurfaceHeading title="Discount codes" description="Validate coupon codes before checkout." />
          <form action={previewDiscount} className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="planKey" value={overview.currentPlanKey ?? "starter"} />
            <div className="min-w-[220px] flex-1">
              <Input name="discountCode" label="Coupon code" placeholder="LAUNCH20" />
            </div>
            <Button type="submit" variant="secondary" loading={isDiscountPending}>
              Preview discount
            </Button>
          </form>
          {discountMessage ? <FormAlert variant="success">{discountMessage}</FormAlert> : null}
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

      {canManage && dashboard.prorationPreviews.length > 0 ? (
        <PageSurface>
          <PageSurfaceHeading title="Proration preview" description="Estimated mid-cycle plan change costs before confirmation." />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {dashboard.prorationPreviews.map((preview) => (
              <div key={preview.toPlanKey} className="rounded-lg border border-border/70 p-4 text-sm">
                <p className="font-medium capitalize text-foreground">
                  {preview.direction} to {preview.toPlanKey}
                </p>
                <p className="mt-1 text-muted">
                  {preview.daysRemainingInPeriod} day(s) remaining · Net due {preview.formattedNetDue}
                </p>
              </div>
            ))}
          </div>
        </PageSurface>
      ) : null}

      {showDiagnosticsHint ? (
        <FormAlert variant="warning">
          Billing or plan mapping may be incomplete.{" "}
          <Link href="/settings/diagnostics" className="font-medium text-primary hover:underline">
            Open Diagnostics
          </Link>{" "}
          to inspect subscription rows, Stripe env vars, and plan resolution.
        </FormAlert>
      ) : null}

      {canManage ? (
        <PageSurface>
          <PageSurfaceHeading title="Billing actions" description="Upgrade, downgrade, cancel, or manage payment methods." />
          {actionError ? <FormAlert variant="error">{actionError}</FormAlert> : null}
          <FormFooter className="border-t-0 pt-0">
            <Link href="/settings/plans">
              <Button type="button">Upgrade plan</Button>
            </Link>
            <LinkButton href="/settings/usage" variant="secondary" size="md">
              Usage dashboard
            </LinkButton>
            <LinkButton href="/settings/diagnostics" variant="secondary" size="md">
              Open Diagnostics
            </LinkButton>
            {showManage ? (
              <>
                <Button type="button" variant="secondary" disabled={isPortalPending} loading={isPortalPending} loadingText="Opening…" onClick={runPortal}>
                  Manage billing
                </Button>
                <Button type="button" variant="ghost" disabled={isPortalPending} onClick={runPortal}>
                  Customer portal
                </Button>
              </>
            ) : null}
          </FormFooter>
        </PageSurface>
      ) : (
        <p className="text-sm text-muted">Billing management is limited to organization owners and admins.</p>
      )}
    </div>
  );
}
