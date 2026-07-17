import "server-only";

import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { getPaddleApiKey, getPaddleEnvironment } from "@/lib/paddle/env";

let paddleClient: Paddle | null = null;

/** Server-only Paddle Billing SDK singleton. */
export function getPaddleClient(): Paddle {
  if (paddleClient) {
    return paddleClient;
  }

  const environment =
    getPaddleEnvironment() === "production" ? Environment.production : Environment.sandbox;

  paddleClient = new Paddle(getPaddleApiKey(), { environment });
  return paddleClient;
}

/** Reset singleton — tests only. */
export function resetPaddleClientForTests(): void {
  paddleClient = null;
}
