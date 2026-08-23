"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormAlert } from "@/components/ui/form-alert";
import { getMollieUpgradeReturnPollStatusAction } from "@/lib/billing/providers/mollie/upgrade-return-actions";

const POLL_INTERVAL_MS = 1500;
const STOP_AFTER_MS = 18_000;

export const UPGRADE_CONFIRMING_MESSAGE =
  "Payment received. We're confirming your upgrade.";

export const UPGRADE_TIMEOUT_MESSAGE =
  "Payment received. We're still confirming your upgrade. It's safe to leave this page — billing will update shortly.";

export const UPGRADE_SUCCESS_MESSAGE = "Your upgrade is confirmed and active.";

type MollieUpgradeReturnPollerProps = {
  initialKind: "upgrade_success" | "upgrade_confirming" | "upgrade_payment_failed";
  initialPlanName: string | null;
};

/**
 * Bounded server re-fetch poller for upgrade return.
 * Never grants Business from the client — only reflects authoritative server state.
 */
export function MollieUpgradeReturnPoller({
  initialKind,
  initialPlanName,
}: MollieUpgradeReturnPollerProps) {
  const router = useRouter();
  const [kind, setKind] = useState(initialKind);
  const [planName, setPlanName] = useState(initialPlanName);
  const [timedOut, setTimedOut] = useState(false);
  const startedAtRef = useRef(Date.now());
  const refreshedRef = useRef(false);

  useEffect(() => {
    if (initialKind === "upgrade_success" || initialKind === "upgrade_payment_failed") {
      return;
    }

    startedAtRef.current = Date.now();
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) {
        return;
      }

      const elapsed = Date.now() - startedAtRef.current;
      const result = await getMollieUpgradeReturnPollStatusAction();
      if (cancelled) {
        return;
      }

      if (result.ok && result.status?.kind === "upgrade_success") {
        setKind("upgrade_success");
        setPlanName(result.status.appliedPlanName);
        if (!refreshedRef.current) {
          refreshedRef.current = true;
          router.refresh();
        }
        return;
      }

      if (result.ok && result.status?.kind === "upgrade_payment_failed") {
        setKind("upgrade_payment_failed");
        if (!refreshedRef.current) {
          refreshedRef.current = true;
          router.refresh();
        }
        return;
      }

      if (elapsed >= STOP_AFTER_MS) {
        setTimedOut(true);
        if (!refreshedRef.current) {
          refreshedRef.current = true;
          router.refresh();
        }
        return;
      }

      timeoutId = setTimeout(() => {
        void tick();
      }, POLL_INTERVAL_MS);
    };

    void tick();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [initialKind, router]);

  if (kind === "upgrade_success") {
    return (
      <FormAlert variant="success" className="mb-4">
        <span className="block">
          {planName
            ? `Your ${planName} plan is now active.`
            : UPGRADE_SUCCESS_MESSAGE}
        </span>
        <span className="mt-2 block">
          <Link href="/settings/billing" className="font-medium text-primary hover:underline">
            View Billing
          </Link>
        </span>
      </FormAlert>
    );
  }

  if (kind === "upgrade_payment_failed") {
    return (
      <FormAlert variant="error" className="mb-4">
        <span className="block">
          The upgrade payment was canceled, expired, or failed. Your previous plan remains
          active. You can try again from Plans when ready.
        </span>
        <span className="mt-2 block">
          <Link href="/settings/plans" className="font-medium text-primary hover:underline">
            Back to Plans
          </Link>
        </span>
      </FormAlert>
    );
  }

  return (
    <FormAlert variant="warning" className="mb-4">
      <span className="block">{timedOut ? UPGRADE_TIMEOUT_MESSAGE : UPGRADE_CONFIRMING_MESSAGE}</span>
      <span className="mt-2 block text-sm text-muted">
        This page does not activate your plan. Confirmation comes from Mollie webhook
        reconcile.
      </span>
      {timedOut ? (
        <span className="mt-2 block">
          <Link href="/settings/billing" className="font-medium text-primary hover:underline">
            View Billing
          </Link>
        </span>
      ) : null}
    </FormAlert>
  );
}
