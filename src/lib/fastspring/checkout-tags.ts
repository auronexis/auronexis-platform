/**
 * Order tags attached to FastSpring Store Builder sessions.
 * Must match webhook org matching in `org-matching.ts` (`organization_id` tag).
 *
 * Official mechanism: `fastspring.builder.tag({ key: value })`
 * https://developer.fastspring.com/reference/methods
 */
export type FastSpringCheckoutTags = {
  organization_id: string;
  user_id: string;
  internal_plan: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function buildFastSpringCheckoutTags(input: {
  organizationId: string;
  userId: string;
  internalPlan: string;
}): FastSpringCheckoutTags {
  const organizationId = input.organizationId.trim();
  const userId = input.userId.trim();
  const internalPlan = input.internalPlan.trim();

  if (!UUID_RE.test(organizationId)) {
    throw new Error("Invalid organization_id for FastSpring checkout tags.");
  }
  if (!UUID_RE.test(userId)) {
    throw new Error("Invalid user_id for FastSpring checkout tags.");
  }
  if (!internalPlan) {
    throw new Error("Invalid internal_plan for FastSpring checkout tags.");
  }

  return {
    organization_id: organizationId,
    user_id: userId,
    internal_plan: internalPlan,
  };
}
