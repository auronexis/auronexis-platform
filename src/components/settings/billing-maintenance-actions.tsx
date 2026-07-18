"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import {
  neutralizeStaleStripeCheckoutAction,
  type BillingMaintenanceActionState,
} from "@/lib/billing/maintenance-actions";
import type { CleanupRecommendation } from "@/lib/billing/cleanup-recommendations";

type BillingMaintenanceActionsProps = {
  recommendations: CleanupRecommendation[];
  activeProvider?: "stripe" | "paddle";
};

function ActionResultAlert({ result }: { result: BillingMaintenanceActionState | null }) {
  if (!result) {
    return null;
  }

  return (
    <FormAlert variant={result.success ? "success" : "warning"}>
      <p>{result.message}</p>
      {result.details && result.details.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {result.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
    </FormAlert>
  );
}

export function BillingMaintenanceActions({
  activeProvider = "paddle",
}: BillingMaintenanceActionsProps) {
  const [result, setResult] = useState<BillingMaintenanceActionState | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<BillingMaintenanceActionState>) => {
    setResult(null);
    startTransition(async () => {
      const next = await action();
      setResult(next);
    });
  };

  if (activeProvider !== "paddle") {
    return (
      <p className="text-sm text-muted">
        Stripe sync actions are disabled. Paddle is the sole active billing provider.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Paddle is the active billing provider. Use neutralization only for abandoned Stripe checkout
        remnants that must not block Paddle.
      </p>

      <ActionResultAlert result={result} />

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          loading={isPending}
          onClick={() => run(neutralizeStaleStripeCheckoutAction)}
        >
          Neutralize stale Stripe checkout remnants
        </Button>
      </div>

      <p className="text-xs text-muted">
        Neutralization marks abandoned incomplete Stripe rows inactive, clears{" "}
        <code className="font-mono">sync_pending</code>, and preserves{" "}
        <code className="font-mono">stripe_customer_id</code> for audit. It never deletes invoices
        or calls Stripe APIs.
      </p>
    </div>
  );
}
