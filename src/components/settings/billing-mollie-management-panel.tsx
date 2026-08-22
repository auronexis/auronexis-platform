"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter } from "@/components/ui/form-section";
import { LinkButton } from "@/components/ui/link-button";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import {
  cancelMollieScheduledPlanChangeAction,
  cancelMollieSubscriptionAction,
} from "@/lib/billing/actions";
import { sanitizeBillingCustomerError } from "@/lib/billing/errors";
import { formatScheduledPlanChangeSummary } from "@/lib/billing/plan-change";
import { formatMoneyFromCents } from "@/lib/billing/status";
import type { BillingOverview } from "@/lib/billing/types";
import { getPlanByKey } from "@/lib/billing/plans";
import { cn } from "@/lib/utils/cn";

type BillingMollieManagementPanelProps = {
  overview: BillingOverview;
  canManage: boolean;
};

function formatPlanPrice(planKey: string | null | undefined): string | null {
  if (!planKey) {
    return null;
  }
  const plan = getPlanByKey(planKey as "professional" | "business" | "enterprise" | "starter");
  return formatMoneyFromCents(plan.priceMonthly * 100, plan.currency);
}

export function BillingMollieManagementPanel({
  overview,
  canManage,
}: BillingMollieManagementPanelProps) {
  const management = overview.subscriptionManagement;
  const scheduled = overview.scheduledPlanChange;
  const currentPlanKey = overview.currentPlanKey;
  const currentPlan = currentPlanKey ? getPlanByKey(currentPlanKey) : null;

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isCancelChangePending, startCancelChangeTransition] = useTransition();
  const [isCancelSubPending, startCancelSubTransition] = useTransition();

  const cancelChangeDialogRef = useRef<HTMLDialogElement>(null);
  const cancelSubDialogRef = useRef<HTMLDialogElement>(null);

  if (!canManage) {
    return null;
  }

  const showManagementPanel =
    overview.isUsable ||
    (management.cancelAtPeriodEnd && management.isPaidThrough);

  if (!showManagementPanel) {
    return null;
  }

  const openCancelChangeDialog = () => {
    setActionError(null);
    setActionSuccess(null);
    cancelChangeDialogRef.current?.showModal();
  };

  const openCancelSubDialog = () => {
    setActionError(null);
    setActionSuccess(null);
    cancelSubDialogRef.current?.showModal();
  };

  const closeCancelChangeDialog = () => cancelChangeDialogRef.current?.close();
  const closeCancelSubDialog = () => cancelSubDialogRef.current?.close();

  const confirmCancelScheduledChange = () => {
    startCancelChangeTransition(async () => {
      const result = await cancelMollieScheduledPlanChangeAction();
      closeCancelChangeDialog();
      if (result?.error) {
        setActionError(result.error);
        return;
      }
      if (result?.success) {
        setActionSuccess(result.success);
        window.setTimeout(() => window.location.reload(), 800);
      }
    });
  };

  const confirmCancelSubscription = () => {
    startCancelSubTransition(async () => {
      const result = await cancelMollieSubscriptionAction();
      closeCancelSubDialog();
      if (result?.error) {
        setActionError(result.error);
        return;
      }
      if (result?.success) {
        setActionSuccess(result.success);
        window.setTimeout(() => window.location.reload(), 800);
      }
    });
  };

  const scheduledDirection = scheduled?.changeType === "upgrade" ? "upgrade" : "downgrade";
  const scheduledTargetPlan = scheduled
    ? getPlanByKey(scheduled.pendingPlanKey)
    : null;
  const scheduledTargetPrice = scheduled ? formatPlanPrice(scheduled.pendingPlanKey) : null;

  return (
    <PageSurface>
      <PageSurfaceHeading
        title="Professional subscription management"
        description="Manage your Mollie subscription, scheduled changes, and cancellation."
      />

      {actionSuccess ? <FormAlert variant="success">{actionSuccess}</FormAlert> : null}
      {actionError ? <FormAlert variant="warning">{actionError}</FormAlert> : null}

      <div className="mt-4 space-y-6">
        <div className="rounded-lg border border-border/70 p-4">
          <p className="text-sm font-semibold text-foreground">Current subscription</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {currentPlan?.name ?? overview.planLabel}
            {currentPlan ? (
              <span className="ml-2 text-sm font-normal text-muted">
                {formatPlanPrice(currentPlanKey)}/month
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-sm text-muted">
            Status: <span className="font-medium text-foreground">{management.statusLabel}</span>
          </p>
          {management.isPaidThrough && management.accessUntilLabel ? (
            <p className="mt-1 text-sm text-muted">
              Access until:{" "}
              <span className="font-medium text-foreground">{management.accessUntilLabel}</span>
            </p>
          ) : null}
          <p className="mt-1 text-sm text-muted">
            Renewal:{" "}
            <span className="font-medium text-foreground">{management.renewalLabel}</span>
          </p>
          <FormFooter className="border-t-0 pt-3">
            <LinkButton href="/settings/plans" variant="secondary" size="md">
              Manage plan
            </LinkButton>
          </FormFooter>
        </div>

        {scheduled && management.canCancelScheduledPlanChange ? (
          <div className="rounded-lg border border-success/25 bg-success/5 p-4">
            <p className="text-sm font-semibold text-foreground">Scheduled plan change</p>
            <FormAlert variant="success" className="mt-3">
              {formatScheduledPlanChangeSummary(scheduled)}
            </FormAlert>
            <FormFooter className="border-t-0 pt-3">
              <Button
                type="button"
                variant="secondary"
                disabled={isCancelChangePending}
                loading={isCancelChangePending}
                loadingText="Canceling…"
                onClick={openCancelChangeDialog}
              >
                Cancel scheduled {scheduledDirection}
              </Button>
            </FormFooter>
          </div>
        ) : null}

        <div className="rounded-lg border border-border/70 p-4">
          <p className="text-sm font-semibold text-foreground">Subscription</p>
          {management.cancelAtPeriodEnd && management.isPaidThrough ? (
            <p className="mt-2 text-sm text-muted">
              Cancellation is scheduled. You keep access until{" "}
              <span className="font-medium text-foreground">
                {management.accessUntilLabel ?? "the end of your billing period"}
              </span>
              .
            </p>
          ) : management.canCancelSubscription ? (
            <p className="mt-2 text-sm text-muted">
              Cancel future renewals. You keep paid access until the end of your current billing
              period. Any scheduled plan change will be removed.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">No subscription actions are available.</p>
          )}
          {management.canCancelSubscription ? (
            <FormFooter className="border-t-0 pt-3">
              <Button
                type="button"
                variant="secondary"
                className={cn("border-danger/30 text-danger hover:bg-danger/10")}
                disabled={isCancelSubPending}
                loading={isCancelSubPending}
                loadingText="Scheduling…"
                onClick={openCancelSubDialog}
              >
                Cancel subscription
              </Button>
            </FormFooter>
          ) : null}
        </div>
      </div>

      <Dialog
        dialogRef={cancelChangeDialogRef}
        title={`Cancel scheduled ${scheduledDirection}?`}
        description="This restores your Mollie subscription to your current plan amount."
        onClose={closeCancelChangeDialog}
      >
        {scheduled && scheduledTargetPlan ? (
          <div className="space-y-3 text-sm text-muted">
            <p>
              Current plan:{" "}
              <span className="font-medium text-foreground">
                {scheduled.currentPlanName}
                {formatPlanPrice(scheduled.currentPlanKey)
                  ? ` (${formatPlanPrice(scheduled.currentPlanKey)}/month)`
                  : ""}
              </span>
            </p>
            <p>
              Scheduled {scheduledDirection}:{" "}
              <span className="font-medium text-foreground">
                {scheduledTargetPlan.name}
                {scheduledTargetPrice ? ` (${scheduledTargetPrice}/month)` : ""}
              </span>
              {scheduled.effectiveAtLabel ? ` on ${scheduled.effectiveAtLabel}` : ""}
            </p>
          </div>
        ) : null}
        <FormFooter className="border-t-0 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={closeCancelChangeDialog}
            disabled={isCancelChangePending}
          >
            Keep scheduled change
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={isCancelChangePending}
            loading={isCancelChangePending}
            loadingText="Confirming…"
            onClick={confirmCancelScheduledChange}
          >
            Cancel scheduled change
          </Button>
        </FormFooter>
      </Dialog>

      <Dialog
        dialogRef={cancelSubDialogRef}
        title="Cancel subscription?"
        description="Your paid access continues until the end of the current billing period."
        onClose={closeCancelSubDialog}
      >
        <div className="space-y-3 text-sm text-muted">
          <p>
            Plan:{" "}
            <span className="font-medium text-foreground">
              {currentPlan?.name ?? overview.planLabel}
            </span>
          </p>
          {management.accessUntilLabel ? (
            <p>
              Access until:{" "}
              <span className="font-medium text-foreground">{management.accessUntilLabel}</span>
            </p>
          ) : (
            <p>You keep access until the end of your current billing period.</p>
          )}
          {scheduled ? (
            <p className="text-warning">
              Your scheduled plan change to {scheduled.pendingPlanName} will be removed.
            </p>
          ) : null}
          <p>Mollie will not charge again after this period. Your payment mandate stays on file.</p>
        </div>
        <FormFooter className="border-t-0 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={closeCancelSubDialog}
            disabled={isCancelSubPending}
          >
            Keep subscription
          </Button>
          <Button
            type="button"
            variant="primary"
            className="bg-danger text-white hover:bg-danger/90"
            disabled={isCancelSubPending}
            loading={isCancelSubPending}
            loadingText="Confirming…"
            onClick={confirmCancelSubscription}
          >
            Confirm cancellation
          </Button>
        </FormFooter>
      </Dialog>

      <p className="mt-4 text-xs text-muted">
        Mollie does not provide a hosted billing portal.{" "}
        <Link href="/settings/plans" className="font-medium text-primary hover:underline">
          Change plan
        </Link>
      </p>
    </PageSurface>
  );
}
