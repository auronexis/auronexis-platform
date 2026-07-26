"use client";

import type { FastSpringCheckoutTags } from "@/lib/fastspring/checkout-tags";
import type { FastSpringProductPath } from "@/lib/billing/catalog";

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

export type OpenFastSpringCheckoutInput = {
  storefront: string;
  sblScriptSrc: string;
  productPath: FastSpringProductPath;
  tags: FastSpringCheckoutTags;
};

function loadStoreBuilderScript(input: {
  storefront: string;
  sblScriptSrc: string;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById("fsc-api");
    if (existing) {
      existing.remove();
    }

    const script = document.createElement("script");
    script.id = "fsc-api";
    script.src = input.sblScriptSrc;
    script.type = "text/javascript";
    script.async = true;
    script.dataset.storefront = input.storefront;
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

/**
 * Official Store Builder flow: reset → tag → add(productPath) → checkout().
 * https://developer.fastspring.com/reference/methods
 */
export async function openFastSpringCheckout(input: OpenFastSpringCheckoutInput): Promise<void> {
  await loadStoreBuilderScript({
    storefront: input.storefront,
    sblScriptSrc: input.sblScriptSrc,
  });
  const builder = await waitForBuilder();
  builder.reset();
  builder.tag({
    organization_id: input.tags.organization_id,
    user_id: input.tags.user_id,
    internal_plan: input.tags.internal_plan,
  });
  builder.add(input.productPath);
  builder.checkout();
}
