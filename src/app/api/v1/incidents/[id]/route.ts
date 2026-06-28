import type { NextRequest } from "next/server";
import { getIncidentById } from "@/lib/incidents/queries";
import { apiContextToSession } from "@/lib/api/resources/session";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { apiJson } from "@/lib/api/responses/json";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withApiHandler(request, {
    scopes: ["incidents.read"],
    handler: async (ctx) => {
      const session = apiContextToSession(ctx);
      const incident = await getIncidentById(session, id);
      if (!incident) {
        return apiJson({ error: { code: "not_found", message: "Incident not found." } }, { status: 404 });
      }
      return apiJson(incident);
    },
  });
}
