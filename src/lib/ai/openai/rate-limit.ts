import "server-only";

import { countRecentOpenAIRequests } from "@/lib/ai/openai/request-log";

const USER_COOLDOWN_SECONDS = 30;
const ORG_HOURLY_LIMIT = 60;
const FEATURE_COOLDOWN_SECONDS = 45;

export type OpenAIRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  reason: "user_cooldown" | "org_limit" | "feature_cooldown" | null;
};

export async function checkOpenAIGenerationLimits(input: {
  organizationId: string;
  userId: string;
  feature: string;
  reportId?: string;
}): Promise<OpenAIRateLimitResult> {
  const now = Date.now();
  const userSince = new Date(now - USER_COOLDOWN_SECONDS * 1000).toISOString();
  const orgSince = new Date(now - 60 * 60 * 1000).toISOString();
  const featureSince = new Date(now - FEATURE_COOLDOWN_SECONDS * 1000).toISOString();

  const [userRecent, orgRecent, featureRecent] = await Promise.all([
    countRecentOpenAIRequests({
      organizationId: input.organizationId,
      userId: input.userId,
      sinceIso: userSince,
    }),
    countRecentOpenAIRequests({
      organizationId: input.organizationId,
      sinceIso: orgSince,
    }),
    input.reportId
      ? countRecentOpenAIRequests({
          organizationId: input.organizationId,
          feature: input.feature,
          reportId: input.reportId,
          sinceIso: featureSince,
        })
      : Promise.resolve(0),
  ]);

  if (userRecent > 0) {
    return { allowed: false, retryAfterSeconds: USER_COOLDOWN_SECONDS, reason: "user_cooldown" };
  }
  if (orgRecent >= ORG_HOURLY_LIMIT) {
    return { allowed: false, retryAfterSeconds: 300, reason: "org_limit" };
  }
  if (input.reportId && featureRecent > 0) {
    return { allowed: false, retryAfterSeconds: FEATURE_COOLDOWN_SECONDS, reason: "feature_cooldown" };
  }

  return { allowed: true, retryAfterSeconds: 0, reason: null };
}
