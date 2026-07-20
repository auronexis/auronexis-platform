import type { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { respondWithPaginatedList } from "@/lib/api/list";
import { apiJson } from "@/lib/api/responses/json";
import { parseJsonBody } from "@/lib/api/validation/body";
import {
  apiCreateClient,
  apiListClients,
  clientCreateBodySchema,
} from "@/lib/api/resources/clients";

export async function GET(request: NextRequest) {
  return withApiHandler(request, {
    scopes: ["clients.read"],
    handler: async (ctx) => {
      const items = await apiListClients(ctx);
      return respondWithPaginatedList({
        request,
        items,
        fieldMap: {
          status: "status",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
        getSortValue: (item) => item.updated_at,
      });
    },
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(request, {
    scopes: ["clients.write"],
    handler: async (ctx, req) => {
      const body = await parseJsonBody(req, clientCreateBodySchema);
      const created = await apiCreateClient(ctx, body);
      return apiJson(created, { status: 201 });
    },
  });
}
