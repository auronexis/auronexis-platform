import type { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { apiError, apiPaginated } from "@/lib/api/responses/json";
import { paginateArray } from "@/lib/api/pagination/cursor";
import { apiContextToSession } from "@/lib/api/resources/session";
import { apiGetClient } from "@/lib/api/resources/clients";
import { listRisks } from "@/lib/risks/queries";
import { parseListQuery, applyListFilters, sortByField } from "@/lib/api/validation/query";

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

      const query = parseListQuery(request);
      const session = apiContextToSession(ctx);
      let items = (await listRisks(session)).filter((risk) => risk.client_id === id);
      items = applyListFilters(items, query, {
        status: "status",
        severity: "severity",
        createdAt: "created_at",
        updatedAt: "updated_at",
      });
      items = sortByField(items, (item) => item.updated_at, query.sort);

      return apiPaginated(
        paginateArray(items, {
          limit: query.limit,
          cursor: query.cursor,
          getCursorValue: (item) => item.id,
        }),
      );
    },
  });
}
