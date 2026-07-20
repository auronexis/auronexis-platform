import type { NextRequest } from "next/server";
import { listIncidents } from "@/lib/incidents/queries";
import { apiContextToSession } from "@/lib/api/resources/session";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { respondWithPaginatedList } from "@/lib/api/list";

export async function GET(request: NextRequest) {
  return withApiHandler(request, {
    scopes: ["incidents.read"],
    handler: async (ctx) => {
      const session = apiContextToSession(ctx);
      const items = await listIncidents(session);
      return respondWithPaginatedList({
        request,
        items,
        fieldMap: {
          status: "status",
          client: "client_id",
          severity: "severity",
          owner: "assigned_user_id",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
        getSortValue: (item) => item.updated_at,
      });
    },
  });
}
