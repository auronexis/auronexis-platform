"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import {
  clearStaleLocalInvoicesAction,
  markInvoiceIgnoredAction,
  refreshBillingFromStripeAction,
  resyncCurrentSubscriptionAction,
  resyncInvoicesAction,
  type BillingMaintenanceActionState,
} from "@/lib/billing/maintenance-actions";
import type { CleanupRecommendation } from "@/lib/billing/cleanup-recommendations";

type BillingMaintenanceActionsProps = {
  recommendations: CleanupRecommendation[];
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

export function BillingMaintenanceActions({ recommendations }: BillingMaintenanceActionsProps) {
  const [result, setResult] = useState<BillingMaintenanceActionState | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<BillingMaintenanceActionState>) => {
    setResult(null);
    startTransition(async () => {
      const next = await action();
      setResult(next);
    });
  };

  const ignorableInvoice = recommendations.find(
    (item) => item.code === "open_unpaid_invoice" && item.stripeId,
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Safe maintenance actions use Stripe as source of truth. Nothing is canceled in Stripe from
        this screen, and active production rows are never deleted automatically.
      </p>

      <ActionResultAlert result={result} />

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          loading={isPending}
          onClick={() => run(refreshBillingFromStripeAction)}
        >
          Refresh billing from Stripe
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          loading={isPending}
          onClick={() => run(resyncCurrentSubscriptionAction)}
        >
          Re-sync current subscription
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          loading={isPending}
          onClick={() => run(resyncInvoicesAction)}
        >
          Re-sync invoices
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          loading={isPending}
          onClick={() => run(clearStaleLocalInvoicesAction)}
        >
          Clear stale local invoices
        </Button>
        {ignorableInvoice?.stripeId ? (
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            loading={isPending}
            onClick={() => run(() => markInvoiceIgnoredAction(ignorableInvoice.stripeId!))}
          >
            Mark blocking invoice ignored
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-muted">
        Clear stale local invoices only removes mirror rows after Stripe confirms{" "}
        <code className="font-mono">void</code> or <code className="font-mono">uncollectible</code>.
        Ignored invoices affect checkout diagnostics only — Stripe remains authoritative.
      </p>
    </div>
  );
}
