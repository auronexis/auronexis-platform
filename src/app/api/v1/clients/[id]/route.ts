import type { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { apiError, apiJson } from "@/lib/api/responses/json";
import { parseJsonBody } from "@/lib/api/validation/body";
import {
  apiArchiveClient,
  apiGetClient,
  apiUpdateClient,
  clientUpdateBodySchema,
} from "@/lib/api/resources/clients";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withApiHandler(request, {
    scopes: ["clients.read"],
    handler: async (ctx) => {
      const client = await apiGetClient(ctx, id);
      if (!client) {
        return apiError(404, "not_found", "Client not found.");
      }
      return apiJson(client);
    },
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withApiHandler(request, {
    scopes: ["clients.write"],
    handler: async (ctx, req) => {
      const body = await parseJsonBody(req, clientUpdateBodySchema);
      const updated = await apiUpdateClient(ctx, id, body);
      return apiJson(updated);
    },
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withApiHandler(request, {
    scopes: ["clients.write"],
    handler: async (ctx) => {
      const archived = await apiArchiveClient(ctx, id);
      return apiJson(archived);
    },
  });
}
