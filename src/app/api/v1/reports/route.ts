import type { NextRequest } from "next/server";
import { listReports } from "@/lib/reports/queries";
import { apiContextToSession } from "@/lib/api/resources/session";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { paginateArray } from "@/lib/api/pagination/cursor";
import { apiPaginated } from "@/lib/api/responses/json";
import { parseListQuery, applyListFilters, sortByField } from "@/lib/api/validation/query";

export async function GET(request: NextRequest) {
  return withApiHandler(request, {
    scopes: ["reports.read"],
    handler: async (ctx) => {
      const query = parseListQuery(request);
      const session = apiContextToSession(ctx);
      let items = await listReports(session);
      items = applyListFilters(items, query, {
        status: "status",
        client: "client_id",
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
