import type { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { apiError, apiJson } from "@/lib/api/responses/json";
import { apiGetClientHealth } from "@/lib/public-api/resources";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  return withApiHandler(request, {
    scopes: ["health.read"],
    handler: async (ctx) => {
      const { id } = await context.params;
      const health = await apiGetClientHealth(ctx, id);
      if (!health) {
        return apiError(404, "not_found", "Client not found.");
      }
      return apiJson(health);
    },
  });
}
