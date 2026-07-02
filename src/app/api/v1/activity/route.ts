import type { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { apiJson } from "@/lib/api/responses/json";
import { apiListActivityEvents } from "@/lib/public-api/resources";

export async function GET(request: NextRequest) {
  return withApiHandler(request, {
    scopes: ["activity.read"],
    handler: async (ctx, req) => {
      const limit = Number(new URL(req.url).searchParams.get("limit") ?? "20");
      const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 20;
      const events = await apiListActivityEvents(ctx, safeLimit);
      return apiJson({ data: events });
    },
  });
}
