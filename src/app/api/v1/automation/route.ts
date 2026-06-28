import type { NextRequest } from "next/server";
import { listWorkflows } from "@/lib/automation/storage/repository";
import { apiContextToSession } from "@/lib/api/resources/session";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { paginateArray } from "@/lib/api/pagination/cursor";
import { apiPaginated } from "@/lib/api/responses/json";
import { parseListQuery, sortByField } from "@/lib/api/validation/query";

export async function GET(request: NextRequest) {
  return withApiHandler(request, {
    scopes: ["automation.read"],
    handler: async (ctx) => {
      const query = parseListQuery(request);
      const session = apiContextToSession(ctx);
      let items = await listWorkflows(session);
      items = sortByField(items, (item) => item.updatedAt, query.sort);
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
