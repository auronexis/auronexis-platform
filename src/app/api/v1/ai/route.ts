import type { NextRequest } from "next/server";
import { getAIUsageSummaryForPlan } from "@/lib/ai/usage/queries";
import { withApiHandler } from "@/lib/api/middleware/handler";
import { apiJson } from "@/lib/api/responses/json";
import { parseJsonBody } from "@/lib/api/validation/body";
import { recordApiAuditEvent } from "@/lib/api/audit";
import { z } from "zod";

const aiBodySchema = z.object({
  module: z.enum(["usage", "echo"]),
  prompt: z.string().max(4000).optional(),
});

export async function POST(request: NextRequest) {
  return withApiHandler(request, {
    scopes: ["ai.execute"],
    handler: async (ctx, req) => {
      const body = await parseJsonBody(req, aiBodySchema);

      if (body.module === "usage") {
        const usage = await getAIUsageSummaryForPlan(ctx.organization.id, ctx.planKey);
        return apiJson({ module: "usage", usage });
      }

      const result = {
        module: "echo",
        prompt: body.prompt ?? "",
        message: "AI execution endpoint is ready. Connect provider credentials to enable full generation.",
        planKey: ctx.planKey,
      };

      await recordApiAuditEvent({
        organizationId: ctx.organization.id,
        actorUserId: ctx.userId,
        entityType: "organization",
        action: "ai_generated",
        title: "AI task executed via Public API",
        metadata: { module: body.module },
      });

      return apiJson(result);
    },
  });
}
