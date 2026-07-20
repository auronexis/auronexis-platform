import type { NextRequest } from "next/server";
import { listWorkflows } from "@/lib/automation/storage/repository";
import { apiContextToSession } from "@/lib/api/resources/session";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { respondWithPaginatedList } from "@/lib/api/list";

export async function GET(request: NextRequest) {
  return withApiHandler(request, {
    scopes: ["automation.read"],
    handler: async (ctx) => {
      const session = apiContextToSession(ctx);
      const items = await listWorkflows(session);
      return respondWithPaginatedList({
        request,
        items: items as Array<Record<string, unknown> & { id: string; updatedAt: string }>,
        getSortValue: (item) => item.updatedAt,
      });
    },
  });
}
