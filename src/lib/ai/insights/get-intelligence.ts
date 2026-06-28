import "server-only";

import { cache } from "react";
import { buildOperationalSnapshot } from "@/lib/ai/insights/queries";
import { generateOperationalIntelligence } from "@/lib/ai/insights/engine";
import type { DashboardData } from "@/lib/dashboard/types";
import type { OperationalIntelligenceResult } from "@/lib/ai/insights/types";
import type { SessionContext } from "@/lib/tenancy/context";

/** Cached per-request operational intelligence — avoids duplicate DB work. */
export const getOperationalIntelligence = cache(
  async (
    session: SessionContext,
    existingDashboard?: DashboardData,
  ): Promise<OperationalIntelligenceResult> => {
    const started = Date.now();
    const snapshot = await buildOperationalSnapshot(session, existingDashboard);
    return generateOperationalIntelligence(snapshot, {
      providerId: "operational-engine",
      model: "rules-v1",
      durationMs: Date.now() - started,
    });
  },
);

export async function refreshOperationalIntelligence(
  session: SessionContext,
): Promise<OperationalIntelligenceResult> {
  const started = Date.now();
  const snapshot = await buildOperationalSnapshot(session);
  return generateOperationalIntelligence(snapshot, {
    providerId: "operational-engine",
    model: "rules-v1",
    durationMs: Date.now() - started,
  });
}
