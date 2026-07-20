import type { NextRequest } from "next/server";
import { getRiskById } from "@/lib/risks/queries";
import { apiContextToSession } from "@/lib/api/resources/session";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { apiError, apiJson } from "@/lib/api/responses/json";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withApiHandler(request, {
    scopes: ["risks.read"],
    handler: async (ctx) => {
      const session = apiContextToSession(ctx);
      const risk = await getRiskById(session, id);
      if (!risk) {
        return apiError(404, "not_found", "Risk not found.");
      }
      return apiJson(risk);
    },
  });
}
