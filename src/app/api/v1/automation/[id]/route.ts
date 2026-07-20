import type { NextRequest } from "next/server";
import { getWorkflow } from "@/lib/automation/storage/repository";
import { apiContextToSession } from "@/lib/api/resources/session";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { apiError, apiJson } from "@/lib/api/responses/json";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withApiHandler(request, {
    scopes: ["automation.read"],
    handler: async (ctx) => {
      const session = apiContextToSession(ctx);
      const workflow = await getWorkflow(session, id);
      if (!workflow) {
        return apiError(404, "not_found", "Workflow not found.");
      }
      return apiJson(workflow);
    },
  });
}
