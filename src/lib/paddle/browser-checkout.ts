"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import type { PaddleCheckoutCustomData } from "@/lib/billing/provider-types";

export type PaddleCheckoutLaunchInput = {
  priceId: string;
  clientToken: string;
  environment: "sandbox" | "production";
  customData: PaddleCheckoutCustomData;
  customerEmail?: string;
};

let paddleInitPromise: Promise<Paddle | undefined> | null = null;
let initializedToken: string | null = null;

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
  });

  const paddle = await paddleInitPromise;
  if (!paddle) {
    throw new Error("Unable to initialize Paddle.js.");
  }
  return paddle;
}

/**
 * Open Paddle overlay checkout. Does not grant access — wait for webhook sync.
 */
export async function openPaddleCheckout(input: PaddleCheckoutLaunchInput): Promise<void> {
  const paddle = await getInitializedPaddle(input.clientToken, input.environment);

  paddle.Checkout.open({
    items: [{ priceId: input.priceId, quantity: 1 }],
    customData: { ...input.customData },
    customer: input.customerEmail ? { email: input.customerEmail } : undefined,
    settings: {
      displayMode: "overlay",
      theme: "light",
    },
  });
}
