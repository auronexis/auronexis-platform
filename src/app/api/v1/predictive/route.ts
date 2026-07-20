import type { NextRequest } from "next/server";
import { getPredictiveIntelligence } from "@/lib/predictive/cache";
import { apiContextToSession } from "@/lib/api/resources/session";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { apiError, apiJson } from "@/lib/api/responses/json";
import { isFeatureEnabled } from "@/lib/plans/features";

export async function GET(request: NextRequest) {
  return withApiHandler(request, {
    scopes: ["predictive.read"],
    handler: async (ctx) => {
      if (!isFeatureEnabled(ctx.planKey, "ai_predictive_intelligence")) {
        return apiError(
          403,
          "forbidden",
          "Predictive intelligence is not enabled on your plan.",
        );
      }
      const session = apiContextToSession(ctx);
      const data = await getPredictiveIntelligence(session);
      return apiJson(data);
    },
  });
}
