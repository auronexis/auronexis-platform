import type { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { paginateArray } from "@/lib/api/pagination/cursor";
import { apiJson, apiPaginated } from "@/lib/api/responses/json";
import { parseListQuery, applyListFilters, sortByField } from "@/lib/api/validation/query";
import { parseJsonBody } from "@/lib/api/validation/body";
import { apiCreateClient, apiListClients } from "@/lib/api/resources/clients";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  status: z.enum(["active", "watch", "critical", "archived"]).optional(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  return withApiHandler(request, {
    scopes: ["clients.read"],
    handler: async (ctx) => {
      const query = parseListQuery(request);
      let items = await apiListClients(ctx);
      items = applyListFilters(items, query, {
        status: "status",
        createdAt: "created_at",
        updatedAt: "updated_at",
      });
      items = sortByField(items, (item) => item.updated_at, query.sort);
      const page = paginateArray(items, {
        limit: query.limit,
        cursor: query.cursor,
        getCursorValue: (item) => item.id,
      });
      return apiPaginated(page);
    },
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(request, {
    scopes: ["clients.write"],
    handler: async (ctx, req) => {
      const body = await parseJsonBody(req, createSchema);
      const created = await apiCreateClient(ctx, body);
      return apiJson(created, { status: 201 });
    },
  });
}
