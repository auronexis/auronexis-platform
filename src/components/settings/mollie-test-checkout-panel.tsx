"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import {
  createMollieTestCheckoutAction,
  getMollieTestDiagnosticsAction,
  refreshMollieTestStateAction,
} from "@/lib/billing/providers/mollie/test-checkout-actions";
import type { MollieTestDiagnostics } from "@/lib/billing/providers/mollie/checkout";
import { cn } from "@/lib/utils/cn";

const PLAN_OPTIONS = [
  { key: "professional", name: "Professional", priceUsd: 179 },
  { key: "business", name: "Business", priceUsd: 599 },
] as const;

type MollieTestCheckoutPanelProps = {
  configured: boolean;
  initialDiagnostics: MollieTestDiagnostics | null;
};

export function MollieTestCheckoutPanel({
  configured,
  initialDiagnostics,
}: MollieTestCheckoutPanelProps) {
  const [pending, startTransition] = useTransition();
  const [refreshPending, startRefresh] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<(typeof PLAN_OPTIONS)[number]["key"]>("professional");
  const [diagnostics, setDiagnostics] = useState<MollieTestDiagnostics | null>(initialDiagnostics);

  useEffect(() => {
    if (!configured) return;
    void getMollieTestDiagnosticsAction().then((result) => {
      if (result.diagnostics) {
        setDiagnostics(result.diagnostics);
      }
    });
  }, [configured]);

  function onLaunch() {
    setError(null);
    setStatus(null);
    startTransition(async () => {
      const result = await createMollieTestCheckoutAction(selectedPlan);
      if (result.error || !result.checkout) {
        setError(result.error ?? "Unable to start Mollie test checkout.");
        return;
      }

      setStatus(`Redirecting to Mollie TEST hosted checkout for ${result.checkout.planName}…`);
      window.location.assign(result.checkout.checkoutUrl);
    });
  }

  function onRefresh() {
    setError(null);
    startRefresh(async () => {
      const result = await refreshMollieTestStateAction();
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.diagnostics) {
        setDiagnostics(result.diagnostics);
        setStatus("Reconciled Mollie test state from authoritative API.");
      }
    });
  }

  return (
    <PageSurface>
      <PageSurfaceHeading
        title="Mollie Test Checkout"
        description="TEST MODE only. First payment → mandate → subscription lifecycle isolated in mollie_test_subscriptions. Does not affect production Mollie entitlements."
      />

      {!configured ? (
        <FormAlert variant="warning" className="mb-4">
          Mollie TEST checkout requires MOLLIE_API_KEY with a test_ prefix in the server environment.
        </FormAlert>
      ) : null}

      {error ? (
        <FormAlert variant="error" className="mb-4">
          {error}
        </FormAlert>
      ) : null}
      {status ? (
        <FormAlert variant="success" className="mb-4">
          {status}
        </FormAlert>
      ) : null}

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Select a self-serve plan (Enterprise excluded)</p>
        <ul className="space-y-2">
          {PLAN_OPTIONS.map((entry) => {
            const selected = entry.key === selectedPlan;
            return (
              <li key={entry.key}>
                <button
                  type="button"
                  onClick={() => setSelectedPlan(entry.key)}
                  className={cn(
                    "flex w-full items-start justify-between rounded-lg border px-3 py-2 text-left text-sm transition",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/40",
                  )}
                >
                  <span>
                    <span className="font-medium text-foreground">{entry.name}</span>
                    <span className="mt-0.5 block font-mono text-xs text-muted">{entry.key}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">${entry.priceUsd}/mo USD</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={onLaunch} disabled={pending || !configured}>
          {pending ? "Starting…" : "Launch Mollie TEST Checkout"}
        </Button>
        <Button type="button" variant="secondary" onClick={onRefresh} disabled={refreshPending || !configured}>
          {refreshPending ? "Refreshing…" : "Refresh test state"}
        </Button>
      </div>

      {diagnostics ? (
        <div className="mt-6 rounded-lg border border-border bg-muted/20 p-4 text-sm">
          <p className="mb-2 font-medium text-foreground">Mollie TEST diagnostics (sanitized)</p>
          <dl className="grid gap-1 text-muted">
            <div>Credential mode: {diagnostics.credentialMode}</div>
            <div>Customer mapped: {diagnostics.customerMapped ? "yes" : "no"}</div>
            <div>Customer id prefix: {diagnostics.customerIdPrefix ?? "—"}</div>
            <div>First payment prefix: {diagnostics.firstPaymentIdPrefix ?? "—"}</div>
            <div>Mandate prefix: {diagnostics.mandateIdPrefix ?? "—"}</div>
            <div>Subscription prefix: {diagnostics.subscriptionIdPrefix ?? "—"}</div>
            <div>Plan key: {diagnostics.planKey ?? "—"}</div>
            <div>Provider status: {diagnostics.providerStatus ?? "—"}</div>
            <div>Normalized status: {diagnostics.normalizedStatus ?? "—"}</div>
            <div>Sync pending: {diagnostics.syncPending == null ? "—" : diagnostics.syncPending ? "yes" : "no"}</div>
            <div>Last reconciled: {diagnostics.lastReconciledAt ?? "—"}</div>
          </dl>
        </div>
      ) : null}
    </PageSurface>
  );
}
