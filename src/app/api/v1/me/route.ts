import type { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { apiJson } from "@/lib/api/responses/json";
import { apiGetMe } from "@/lib/public-api/resources";

export async function GET(request: NextRequest) {
  return withApiHandler(request, {
    handler: async (ctx) => apiJson(apiGetMe(ctx)),
  });
}
