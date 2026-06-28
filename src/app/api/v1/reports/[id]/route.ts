import type { NextRequest } from "next/server";
import { getReportById } from "@/lib/reports/queries";
import { apiContextToSession } from "@/lib/api/resources/session";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { apiJson } from "@/lib/api/responses/json";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withApiHandler(request, {
    scopes: ["reports.read"],
    handler: async (ctx) => {
      const session = apiContextToSession(ctx);
      const report = await getReportById(session, id);
      if (!report) {
        return apiJson({ error: { code: "not_found", message: "Report not found." } }, { status: 404 });
      }
      return apiJson(report);
    },
  });
}
