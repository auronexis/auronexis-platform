"use server";

import { recordActivityEvent } from "@/lib/activity/record";
import { runOpenAIConnectionTest } from "@/lib/ai/openai";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import { requireSession } from "@/lib/auth/session";
import type { OpenAIConnectionTestResult } from "@/lib/integrations/center/types";
import { assertCanUseFeature } from "@/lib/plans/guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";

/** Test OpenAI connectivity via a minimal Responses API health probe. */
export async function testOpenAIConnectionAction(): Promise<OpenAIConnectionTestResult> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { ok: false, message: ACTION_DENIED_MESSAGE, latencyMs: null };
  }

  try {
    await assertCanUseFeature(session.organization.id, "ai_report_assistant");
  } catch {
    return {
      ok: false,
      message: "AI features are not available on your current plan.",
      latencyMs: null,
    };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "organization",
    action: "ai_connection_test_started",
    title: "OpenAI connection test started",
    metadata: { provider: "openai" },
  });

  const result = await runOpenAIConnectionTest({
    organizationId: session.organization.id,
    userId: session.user.id,
  });

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "organization",
    action: result.ok ? "ai_connection_test_succeeded" : "ai_connection_test_failed",
    title: result.ok ? "OpenAI connection verified" : "OpenAI connection test failed",
    metadata: {
      provider: "openai",
      state: result.state,
      error_code: result.errorCode ?? undefined,
    },
  });

  return {
    ok: result.ok,
    message: result.message,
    latencyMs: result.latencyMs,
    state: result.state,
    model: result.model,
    errorCode: result.errorCode,
  };
}
