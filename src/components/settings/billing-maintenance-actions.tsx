"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import {
  neutralizeStaleStripeCheckoutAction,
  type BillingMaintenanceActionState,
} from "@/lib/billing/maintenance-actions";
import type { CleanupRecommendation } from "@/lib/billing/cleanup-recommendations";
import type { BillingProvider } from "@/lib/billing/provider-types";

type BillingMaintenanceActionsProps = {
  recommendations: CleanupRecommendation[];
  activeProvider?: BillingProvider;
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
  activeProvider = "mollie",
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

  if (activeProvider !== "mollie") {
    return (
      <p className="text-sm text-muted">
        Legacy billing sync actions are disabled. Mollie is the sole active billing provider.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Mollie is the active billing provider. Use neutralization only for abandoned legacy checkout
        remnants that must not block Mollie.
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
          Neutralize stale legacy checkout remnants
        </Button>
      </div>

      <p className="text-xs text-muted">
        Neutralization marks abandoned incomplete legacy rows inactive, clears{" "}
        <code className="font-mono">sync_pending</code>, and preserves archive customer references
        for audit. It never deletes invoices or calls retired provider APIs.
      </p>
    </div>
  );
}
