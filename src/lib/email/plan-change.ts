import "server-only";

import {
  buildPlanChangeAppliedTemplateKey,
  buildPlanChangeScheduledTemplateKey,
  resolvePlanChangeEmailPlans,
} from "@/lib/billing/plan-change";
import { formatBillingDate } from "@/lib/billing/types";
import { EMAIL_CATEGORIES } from "@/lib/email/categories";
import { sendTransactionalEmail } from "@/lib/email/transactional";
import {
  buildPlanChangeAppliedHtml,
  buildPlanChangeAppliedPlainText,
  buildPlanChangeAppliedSubject,
  buildPlanChangeScheduledHtml,
  buildPlanChangeScheduledPlainText,
  buildPlanChangeScheduledSubject,
} from "@/lib/email/templates/plan-change";
import { createAdminClient } from "@/lib/supabase/admin";

type BillingRecipient = {
  userId: string;
  email: string;
};

async function resolvePrimaryBillingRecipient(
  organizationId: string,
): Promise<BillingRecipient | null> {
  const admin = createAdminClient();

  const { data: owners, error: ownerError } = await admin
    .from("users")
    .select("id, email")
    .eq("organization_id", organizationId)
    .eq("role", "owner")
    .eq("is_disabled", false)
    .order("created_at", { ascending: true })
    .limit(1);

  if (ownerError) {
    console.error("[email][plan-change] owner lookup failed", { code: ownerError.code });
    return null;
  }

  const owner = owners?.[0] as { id: string; email: string } | undefined;
  if (owner?.id && owner.email) {
    return { userId: owner.id, email: owner.email };
  }

  const { data: admins, error: adminError } = await admin
    .from("users")
    .select("id, email")
    .eq("organization_id", organizationId)
    .eq("role", "admin")
    .eq("is_disabled", false)
    .order("created_at", { ascending: true })
    .limit(1);

  if (adminError) {
    console.error("[email][plan-change] admin lookup failed", { code: adminError.code });
    return null;
  }

  const adminUser = admins?.[0] as { id: string; email: string } | undefined;
  if (!adminUser?.id || !adminUser.email) {
    return null;
  }

  return { userId: adminUser.id, email: adminUser.email };
}

/**
 * Send one scheduled plan-change email after Mollie schedule succeeds.
 * Failure must never roll back billing state.
 */
export async function sendPlanChangeScheduledEmail(input: {
  organizationId: string;
  organizationName: string;
  userId: string;
  recipientEmail: string;
  previousPlanKey: string;
  targetPlanKey: string;
  changeType: "upgrade" | "downgrade";
  effectiveAt: string | null;
  providerChangeReference: string;
}): Promise<void> {
  const plans = resolvePlanChangeEmailPlans({
    previousPlanKey: input.previousPlanKey,
    targetPlanKey: input.targetPlanKey,
  });
  const effectiveAtLabel = formatBillingDate(input.effectiveAt);
  const templateKey = buildPlanChangeScheduledTemplateKey(
    input.providerChangeReference,
    input.targetPlanKey,
  );

  const result = await sendTransactionalEmail({
    category: EMAIL_CATEGORIES.BILLING_SYSTEM,
    templateKey,
    organizationId: input.organizationId,
    userId: input.userId,
    to: input.recipientEmail,
    subject: buildPlanChangeScheduledSubject({
      changeType: input.changeType,
      targetPlanName: plans.targetPlanName,
    }),
    html: buildPlanChangeScheduledHtml({
      organizationName: input.organizationName,
      currentPlanName: plans.previousPlanName,
      targetPlanName: plans.targetPlanName,
      changeType: input.changeType,
      effectiveAtLabel,
    }),
    text: buildPlanChangeScheduledPlainText({
      organizationName: input.organizationName,
      currentPlanName: plans.previousPlanName,
      targetPlanName: plans.targetPlanName,
      changeType: input.changeType,
      effectiveAtLabel,
    }),
  });

  if (result.skipped) {
    console.info("[email][plan-change] scheduled email skipped (idempotent)", {
      templateKey,
      organizationId: input.organizationId,
    });
    return;
  }

  if (!result.success) {
    console.error("[email][plan-change] scheduled email failed", {
      templateKey,
      organizationId: input.organizationId,
    });
  }
}

/**
 * Send one applied plan-change email after webhook applies pending_plan.
 * Failure must never roll back billing state.
 */
export async function sendPlanChangeAppliedEmail(input: {
  organizationId: string;
  organizationName: string;
  previousPlanKey: string;
  appliedPlanKey: string;
  changeType: "upgrade" | "downgrade";
  providerChangeReference: string;
}): Promise<void> {
  const recipient = await resolvePrimaryBillingRecipient(input.organizationId);
  if (!recipient) {
    console.error("[email][plan-change] no billing recipient for applied email", {
      organizationId: input.organizationId,
    });
    return;
  }

  const plans = resolvePlanChangeEmailPlans({
    previousPlanKey: input.previousPlanKey,
    targetPlanKey: input.appliedPlanKey,
  });
  const templateKey = buildPlanChangeAppliedTemplateKey(
    input.providerChangeReference,
    input.appliedPlanKey,
  );

  const result = await sendTransactionalEmail({
    category: EMAIL_CATEGORIES.BILLING_SYSTEM,
    templateKey,
    organizationId: input.organizationId,
    userId: recipient.userId,
    to: recipient.email,
    subject: buildPlanChangeAppliedSubject({ newPlanName: plans.targetPlanName }),
    html: buildPlanChangeAppliedHtml({
      organizationName: input.organizationName,
      previousPlanName: plans.previousPlanName,
      newPlanName: plans.targetPlanName,
      changeType: input.changeType,
    }),
    text: buildPlanChangeAppliedPlainText({
      organizationName: input.organizationName,
      previousPlanName: plans.previousPlanName,
      newPlanName: plans.targetPlanName,
      changeType: input.changeType,
    }),
  });

  if (result.skipped) {
    console.info("[email][plan-change] applied email skipped (idempotent)", {
      templateKey,
      organizationId: input.organizationId,
    });
    return;
  }

  if (!result.success) {
    console.error("[email][plan-change] applied email failed", {
      templateKey,
      organizationId: input.organizationId,
    });
  }
}

/** Load organization display name for billing emails. */
export async function getOrganizationNameForBillingEmail(
  organizationId: string,
): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !data?.name) {
    return "Your workspace";
  }

  return data.name as string;
}
