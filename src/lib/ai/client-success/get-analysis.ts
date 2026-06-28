import "server-only";

import { cache } from "react";
import { generateClientSuccessAnalysis } from "@/lib/ai/client-success/engine";
import { buildClientSuccessSnapshot } from "@/lib/ai/client-success/queries";
import { buildClientSuccessPortfolio } from "@/lib/ai/client-success/portfolio";
import type { ClientSuccessAnalysis, ClientSuccessPortfolioResult } from "@/lib/ai/client-success/types";
import type { SessionContext } from "@/lib/tenancy/context";

export const getClientSuccessAnalysis = cache(
  async (session: SessionContext, clientId: string): Promise<ClientSuccessAnalysis | null> => {
    const started = Date.now();
    const snapshot = await buildClientSuccessSnapshot(session, clientId);
    if (!snapshot) return null;

    return generateClientSuccessAnalysis(snapshot, {
      providerId: "client-success-engine",
      model: "rules-v1",
      durationMs: Date.now() - started,
    });
  },
);

export const getClientSuccessPortfolio = cache(
  async (session: SessionContext): Promise<ClientSuccessPortfolioResult> => {
    return buildClientSuccessPortfolio(session);
  },
);

export async function refreshClientSuccessAnalysis(
  session: SessionContext,
  clientId: string,
): Promise<ClientSuccessAnalysis | null> {
  const started = Date.now();
  const snapshot = await buildClientSuccessSnapshot(session, clientId);
  if (!snapshot) return null;

  return generateClientSuccessAnalysis(snapshot, {
    providerId: "client-success-engine",
    model: "rules-v1",
    durationMs: Date.now() - started,
  });
}

export async function refreshClientSuccessPortfolio(
  session: SessionContext,
): Promise<ClientSuccessPortfolioResult> {
  return buildClientSuccessPortfolio(session);
}
