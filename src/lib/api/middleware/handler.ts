import "server-only";

import type { NextResponse } from "next/server";
import {
  ApiAuthenticationError,
  ApiFeatureError,
  authenticateApiRequest,
} from "@/lib/api/auth/validator";
import { ApiScopeError, hasApiScope, type ApiContext } from "@/lib/api/auth/context";
import { recordApiRequestLog } from "@/lib/api/audit";
import { checkApiRateLimit, getRateLimitForPlan } from "@/lib/api/rate-limit/limits";
import { apiError, apiRateLimited } from "@/lib/api/responses/json";
import type { ApiScope } from "@/lib/api/types";

export type ApiHandler = (ctx: ApiContext, request: Request) => Promise<NextResponse>;

export async function withApiHandler(
  request: Request,
  options: {
    scopes?: ApiScope[];
    handler: ApiHandler;
  },
): Promise<NextResponse> {
  const startedAt = Date.now();
  const path = new URL(request.url).pathname;
  let ctx: ApiContext | null = null;
  let statusCode = 500;

  try {
    ctx = await authenticateApiRequest(request);

    const rate = checkApiRateLimit({ apiKeyId: ctx.apiKeyId, planKey: ctx.planKey });
    if (!rate.allowed) {
      statusCode = 429;
      await recordApiRequestLog({
        organizationId: ctx.organization.id,
        apiKeyId: ctx.apiKeyId,
        method: request.method,
        path,
        statusCode,
        durationMs: Date.now() - startedAt,
        rateLimited: true,
      });
      return apiRateLimited(rate.retryAfterSeconds, rate.limit);
    }

    if (options.scopes) {
      for (const scope of options.scopes) {
        if (!hasApiScope(ctx, scope)) {
          statusCode = 403;
          throw new ApiScopeError(scope);
        }
      }
    }

    const response = await options.handler(ctx, request);
    statusCode = response.status;

    response.headers.set("X-RateLimit-Limit", String(getRateLimitForPlan(ctx.planKey)));
    response.headers.set("X-RateLimit-Remaining", String(rate.remaining));
    response.headers.set("X-API-Version", "v1");

    await recordApiRequestLog({
      organizationId: ctx.organization.id,
      apiKeyId: ctx.apiKeyId,
      method: request.method,
      path,
      statusCode,
      durationMs: Date.now() - startedAt,
    });

    return response;
  } catch (error) {
    if (error instanceof ApiAuthenticationError) {
      statusCode = 401;
      return apiError(401, "unauthorized", error.message);
    }
    if (error instanceof ApiFeatureError) {
      statusCode = 403;
      return apiError(403, "forbidden", error.message);
    }
    if (error instanceof ApiScopeError) {
      statusCode = 403;
      return apiError(403, "forbidden", error.message);
    }

    const { ApiValidationError } = await import("@/lib/api/validation/body");
    if (error instanceof ApiValidationError) {
      statusCode = 400;
      return apiError(400, "validation_error", error.message);
    }

    console.error("[api] handler error:", error);
    statusCode = 500;
    return apiError(500, "internal_error", "An unexpected error occurred.");
  }
}
