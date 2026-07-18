"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormAlert } from "@/components/ui/form-alert";
import { getPaddleCheckoutSyncStatusAction } from "@/lib/billing/checkout-sync-actions";
import type { PaddleCheckoutSyncStatus } from "@/lib/billing/checkout-sync-status";
import {
  PADDLE_CHECKOUT_SUCCESS_MESSAGE,
  PADDLE_CHECKOUT_SYNC_SLOW_MESSAGE,
} from "@/lib/paddle/checkout-success";

const POLL_INTERVAL_MS = 2000;
const SLOW_AFTER_MS = 12_000;
const STOP_AFTER_MS = 45_000;

type BillingCheckoutSyncPollerProps = {
  enabled: boolean;
  initialStatus: PaddleCheckoutSyncStatus | null;
};

/**
 * Bounded post-checkout poller. Refreshes verified server state only —
 * never grants access from the Paddle.js success event.
 */
export function BillingCheckoutSyncPoller({
  enabled,
  initialStatus,
}: BillingCheckoutSyncPollerProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(() => {
    if (!enabled) {
      return null;
    }
    if (initialStatus?.synchronized) {
      return null;
    }
    return PADDLE_CHECKOUT_SUCCESS_MESSAGE;
  });
  const [status, setStatus] = useState<PaddleCheckoutSyncStatus | null>(initialStatus);
  const startedAtRef = useRef<number>(Date.now());
  const refreshedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    startedAtRef.current = Date.now();

    if (initialStatus?.synchronized) {
      setMessage(null);
      return;
    }

    setMessage(PADDLE_CHECKOUT_SUCCESS_MESSAGE);

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) {
        return;
      }

      const elapsed = Date.now() - startedAtRef.current;
      if (elapsed >= SLOW_AFTER_MS) {
        setMessage(PADDLE_CHECKOUT_SYNC_SLOW_MESSAGE);
      }

      const result = await getPaddleCheckoutSyncStatusAction();
      if (cancelled) {
        return;
      }

      if (result.ok) {
        setStatus(result.status);
        if (result.status.synchronized) {
          setMessage(null);
          if (!refreshedRef.current) {
            refreshedRef.current = true;
            router.refresh();
          }
          return;
        }
      }

      if (elapsed >= STOP_AFTER_MS) {
        setMessage(PADDLE_CHECKOUT_SYNC_SLOW_MESSAGE);
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
  }, [enabled, initialStatus?.synchronized, router]);

  if (!enabled || !message) {
    return null;
  }

  return (
    <FormAlert variant="success">
      <p>{message}</p>
      {status && !status.synchronized ? (
        <p className="mt-1 text-sm text-muted">
          Waiting for verified billing sync
          {status.syncPending ? " (sync pending)" : ""}.
        </p>
      ) : null}
    </FormAlert>
  );
}
