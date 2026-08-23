import "server-only";

import {
  buildPlanChangeAppliedTemplateKey,
  buildPlanChangeScheduledTemplateKey,
  buildUpgradeActivatedTemplateKey,
  resolvePlanChangeEmailPlans,
} from "@/lib/billing/plan-change";
import { formatBillingDate } from "@/lib/billing/types";
import { EMAIL_CATEGORIES } from "@/lib/email/categories";
import { resolvePrimaryBillingRecipientForEmail } from "@/lib/email/billing-recipient";
import { sendTransactionalEmail } from "@/lib/email/transactional";
import {
  buildPlanChangeAppliedHtml,
  buildPlanChangeAppliedPlainText,
  buildPlanChangeAppliedSubject,
  buildPlanChangeScheduledHtml,
  buildPlanChangeScheduledPlainText,
  buildPlanChangeScheduledSubject,
  buildUpgradeActivatedHtml,
  buildUpgradeActivatedPlainText,
  buildUpgradeActivatedSubject,
} from "@/lib/email/templates/plan-change";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const recipient = await resolvePrimaryBillingRecipientForEmail(input.organizationId);
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

/**
 * Send one upgrade-activated email after prorated payment is confirmed.
 * Failure must never roll back billing state.
 */
export async function sendUpgradeActivatedEmail(input: {
  organizationId: string;
  organizationName: string;
  previousPlanKey: string;
  appliedPlanKey: string;
  providerSubscriptionId: string;
  providerPaymentId: string;
  receiptUrl: string | null;
  renewalAt: string | null;
}): Promise<{ sent: boolean; skipped: boolean; failed: boolean }> {
  const recipient = await resolvePrimaryBillingRecipientForEmail(input.organizationId);
  if (!recipient) {
    console.error("[email][upgrade] no billing recipient for activated email", {
      organizationId: input.organizationId,
    });
    return { sent: false, skipped: false, failed: true };
  }

  const plans = resolvePlanChangeEmailPlans({
    previousPlanKey: input.previousPlanKey,
    targetPlanKey: input.appliedPlanKey,
  });
  const templateKey = buildUpgradeActivatedTemplateKey({
    organizationId: input.organizationId,
    providerSubscriptionId: input.providerSubscriptionId,
    providerPaymentId: input.providerPaymentId,
    previousPlanKey: input.previousPlanKey,
    appliedPlanKey: input.appliedPlanKey,
  });
  const renewalAtLabel = formatBillingDate(input.renewalAt);

  const result = await sendTransactionalEmail({
    category: EMAIL_CATEGORIES.BILLING_SYSTEM,
    templateKey,
    organizationId: input.organizationId,
    userId: recipient.userId,
    to: recipient.email,
    subject: buildUpgradeActivatedSubject({ newPlanName: plans.targetPlanName }),
    html: buildUpgradeActivatedHtml({
      organizationName: input.organizationName,
      previousPlanName: plans.previousPlanName,
      newPlanName: plans.targetPlanName,
      receiptUrl: input.receiptUrl,
      renewalAtLabel,
    }),
    text: buildUpgradeActivatedPlainText({
      organizationName: input.organizationName,
      previousPlanName: plans.previousPlanName,
      newPlanName: plans.targetPlanName,
      receiptUrl: input.receiptUrl,
      renewalAtLabel,
    }),
  });

  if (result.skipped) {
    console.info("[email][upgrade] activated email skipped (idempotent)", {
      templateKey,
      organizationId: input.organizationId,
    });
    return { sent: false, skipped: true, failed: false };
  }

  if (!result.success) {
    console.error("[email][upgrade] activated email failed", {
      templateKey,
      organizationId: input.organizationId,
    });
    return { sent: false, skipped: false, failed: true };
  }

  return { sent: true, skipped: false, failed: false };
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
