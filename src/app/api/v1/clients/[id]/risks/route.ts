import type { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { apiError } from "@/lib/api/responses/json";
import { respondWithPaginatedList } from "@/lib/api/list";
import { apiContextToSession } from "@/lib/api/resources/session";
import { apiGetClient } from "@/lib/api/resources/clients";
import { listRisks } from "@/lib/risks/queries";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  return withApiHandler(request, {
    scopes: ["risks.read"],
    handler: async (ctx) => {
      const { id } = await context.params;
      const client = await apiGetClient(ctx, id);
      if (!client) {
        return apiError(404, "not_found", "Client not found.");
      }

      const session = apiContextToSession(ctx);
      const items = (await listRisks(session)).filter((risk) => risk.client_id === id);
      return respondWithPaginatedList({
        request,
        items,
        fieldMap: {
          status: "status",
          severity: "severity",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
        getSortValue: (item) => item.updated_at,
      });
    },
  });
}
