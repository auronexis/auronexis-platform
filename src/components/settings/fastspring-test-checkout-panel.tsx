"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import { createFastSpringTestCheckoutAction } from "@/lib/fastspring/test-checkout-actions";
import type { FastSpringProductCatalogEntry } from "@/lib/fastspring/products";
import type { FastSpringTestCheckoutPayload } from "@/lib/fastspring/test-checkout-types";
import { cn } from "@/lib/utils/cn";

type FastSpringBuilder = {
  reset: () => void;
  tag: (tags: Record<string, string>) => void;
  add: (productPath: string) => void;
  checkout: () => void;
};

declare global {
  interface Window {
    fastspring?: {
      builder?: FastSpringBuilder;
    };
  }
}

type FastSpringTestCheckoutPanelProps = {
  catalog: FastSpringProductCatalogEntry[];
  storeConfigured: boolean;
};

function loadStoreBuilderScript(payload: FastSpringTestCheckoutPayload): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById("fsc-api");
    if (existing) {
      existing.remove();
    }

    const script = document.createElement("script");
    script.id = "fsc-api";
    script.src = payload.sblScriptSrc;
    script.type = "text/javascript";
    script.async = true;
    script.dataset.storefront = payload.storefront;
    script.dataset.continuous = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load FastSpring Store Builder."));
    document.body.appendChild(script);
  });
}

async function waitForBuilder(timeoutMs = 10_000): Promise<FastSpringBuilder> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const builder = window.fastspring?.builder;
    if (builder && typeof builder.checkout === "function") {
      return builder;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("FastSpring Store Builder did not initialize.");
}

async function launchFastSpringTestCheckout(payload: FastSpringTestCheckoutPayload): Promise<void> {
  await loadStoreBuilderScript(payload);
  const builder = await waitForBuilder();
  builder.reset();
  builder.tag({
    organization_id: payload.tags.organization_id,
    user_id: payload.tags.user_id,
    internal_plan: payload.tags.internal_plan,
  });
  builder.add(payload.productPath);
  builder.checkout();
}

export function FastSpringTestCheckoutPanel({
  catalog,
  storeConfigured,
}: FastSpringTestCheckoutPanelProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState(catalog[0]?.path ?? "professional");

  function onLaunch() {
    setError(null);
    setStatus(null);
    startTransition(async () => {
      const result = await createFastSpringTestCheckoutAction(selectedPath);
      if (result.error || !result.checkout) {
        setError(result.error ?? "Unable to start FastSpring test checkout.");
        return;
      }

      try {
        setStatus(`Opening FastSpring TEST checkout for ${result.checkout.displayName}…`);
        await launchFastSpringTestCheckout(result.checkout);
        setStatus(
          "FastSpring TEST popup opened. Complete the test purchase, then confirm the webhook updated billing state.",
        );
      } catch (launchError) {
        const message =
          launchError instanceof Error
            ? launchError.message
            : "Unable to open FastSpring checkout popup.";
        setError(message);
        setStatus(null);
      }
    });
  }

  return (
    <PageSurface>
      <PageSurfaceHeading
        title="FastSpring Test Checkout"
        description="TEST MODE only. Opens FastSpring popup-defaultB2B for webhook and subscription verification. Does not affect the live production storefront."
      />

      {!storeConfigured ? (
        <FormAlert variant="warning" className="mb-4">
          FastSpring test checkout is not configured. Set FASTSPRING_STORE_ID in the server
          environment.
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
        <p className="text-sm font-medium text-foreground">Select a FastSpring product path</p>
        <ul className="space-y-2">
          {catalog.map((entry) => {
            const selected = entry.path === selectedPath;
            return (
              <li key={entry.path}>
                <button
                  type="button"
                  onClick={() => setSelectedPath(entry.path)}
                  className={cn(
                    "flex w-full items-start justify-between rounded-lg border px-3 py-2 text-left text-sm transition",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/40",
                  )}
                >
                  <span>
                    <span className="font-medium text-foreground">{entry.displayName}</span>
                    <span className="mt-0.5 block font-mono text-xs text-muted">{entry.path}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {entry.visibility === "public" ? "Public plan" : "Private / controlled"} · maps to{" "}
                      {entry.mappedPlan}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">${entry.monthlyPriceUsd}/mo</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={onLaunch} disabled={pending || !storeConfigured}>
          {pending ? "Starting…" : "Launch FastSpring TEST Checkout"}
        </Button>
        <p className="text-xs text-muted">
          Uses Store Builder popup path <span className="font-mono">popup-defaultB2B</span> in test mode
          and passes <span className="font-mono">organization_id</span> via order tags.
        </p>
      </div>
    </PageSurface>
  );
}
