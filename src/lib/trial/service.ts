import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  TRIAL_CLIENT_LIMIT,
  TRIAL_LENGTH_DAYS,
  TRIAL_PLAN,
  TRIAL_SEAT_LIMIT,
  computeTrialExpiry,
  normalizeEmailForTrial,
} from "@/lib/trial/policy";

const HASH_NAMESPACE = "auroranexis-trial-v1";

export type StartTrialResult =
  | { status: "started"; expiresAt: string }
  | { status: "already_used" }
  | { status: "not_eligible" }
  | { status: "error" };

function hash(value: string): string {
  return createHash("sha256").update(`${HASH_NAMESPACE}:${value}`).digest("hex");
}

/**
 * Grant the 7-day trial to a freshly created workspace — once per email address and once per
 * company domain. Never throws: signup must succeed even if the trial cannot be granted.
 */
export async function startTrialForNewOrganization(input: {
  organizationId: string;
  email: string;
}): Promise<StartTrialResult> {
  const email = normalizeEmailForTrial(input.email);
  if (!email || email.isDisposable) {
    return { status: "not_eligible" };
  }

  try {
    const admin = createAdminClient();
    const { data: claim, error: claimError } = await admin
      .from("trial_claims")
      .insert({
        email_hash: hash(`email:${email.normalized}`),
        domain_hash: email.isFreemail ? null : hash(`domain:${email.domain}`),
        organization_id: input.organizationId,
      } as never)
      .select("id")
      .single();

    if (claimError || !claim) {
      return claimError?.code === "23505" ? { status: "already_used" } : { status: "error" };
    }

    const expiresAt = computeTrialExpiry().toISOString();
    const { error: overrideError } = await admin.from("organization_plan_overrides").insert({
      organization_id: input.organizationId,
      plan: TRIAL_PLAN,
      status: "active",
      source: "trial",
      expires_at: expiresAt,
      clients_limit: TRIAL_CLIENT_LIMIT,
      seats_limit: TRIAL_SEAT_LIMIT,
      notes: `Self-serve ${TRIAL_LENGTH_DAYS}-day free trial`,
    } as never);

    if (overrideError) {
      await admin.from("trial_claims").delete().eq("id", (claim as { id: string }).id);
      return { status: "error" };
    }

    return { status: "started", expiresAt };
  } catch {
    return { status: "error" };
  }
}
