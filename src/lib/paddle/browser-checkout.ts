"use client";

import { initializePaddle, type Paddle, type PaddleEventData } from "@paddle/paddle-js";
import type { PaddleCheckoutCustomData } from "@/lib/billing/provider-types";
import { getPaddleCheckoutSuccessUrl } from "@/lib/paddle/checkout-success";

export type PaddleCheckoutLaunchInput = {
  priceId: string;
  clientToken: string;
  environment: "sandbox" | "production";
  customData: PaddleCheckoutCustomData;
  customerEmail?: string;
};

let paddleInitPromise: Promise<Paddle | undefined> | null = null;
let initializedToken: string | null = null;

function handleCheckoutCompleted(paddle: Paddle): void {
  try {
    paddle.Checkout.close();
  } catch {
    // Overlay may already be closing; redirect is the source of truth for UX.
  }

  // Navigate back into Auroranexis. Do not grant entitlements here —
  // billing page polls verified server state after webhook sync.
  window.location.assign(getPaddleCheckoutSuccessUrl());
}

async function getInitializedPaddle(
  clientToken: string,
  environment: "sandbox" | "production",
): Promise<Paddle> {
  if (paddleInitPromise && initializedToken === clientToken) {
    const existing = await paddleInitPromise;
    if (existing) {
      return existing;
    }
  }

  initializedToken = clientToken;
  paddleInitPromise = initializePaddle({
    token: clientToken,
    environment,
    eventCallback: (event: PaddleEventData) => {
      if (event.name !== "checkout.completed") {
        return;
      }
      void paddleInitPromise?.then((paddle) => {
        if (paddle) {
          handleCheckoutCompleted(paddle);
        } else {
          window.location.assign(getPaddleCheckoutSuccessUrl());
        }
      });
    },
  });

  const paddle = await paddleInitPromise;
  if (!paddle) {
    throw new Error("Unable to initialize Paddle.js.");
  }
  return paddle;
}

/**
 * Open Paddle overlay checkout. Does not grant access — wait for webhook sync.
 * On checkout.completed: close overlay and redirect to billing success.
 */
export async function openPaddleCheckout(input: PaddleCheckoutLaunchInput): Promise<void> {
  const paddle = await getInitializedPaddle(input.clientToken, input.environment);
  const successUrl = getPaddleCheckoutSuccessUrl();

  paddle.Checkout.open({
    items: [{ priceId: input.priceId, quantity: 1 }],
    customData: { ...input.customData },
    customer: input.customerEmail ? { email: input.customerEmail } : undefined,
    settings: {
      displayMode: "overlay",
      theme: "light",
      // Backup redirect if eventCallback is delayed; primary path closes then assigns.
      successUrl,
    },
  });
}
