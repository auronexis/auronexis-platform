import type { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { apiJson } from "@/lib/api/responses/json";
import { parseJsonBody } from "@/lib/api/validation/body";
import {
  apiArchiveClient,
  apiGetClient,
  apiUpdateClient,
} from "@/lib/api/resources/clients";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  status: z.enum(["active", "watch", "critical", "archived"]).optional(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withApiHandler(request, {
    scopes: ["clients.read"],
    handler: async (ctx) => {
      const client = await apiGetClient(ctx, id);
      if (!client) {
        return apiJson({ error: { code: "not_found", message: "Client not found." } }, { status: 404 });
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
      const body = await parseJsonBody(req, updateSchema);
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
