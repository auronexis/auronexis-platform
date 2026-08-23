import "server-only";

import { formatBillingDate } from "@/lib/billing/types";
import {
  buildPlanChangeCanceledTemplateKey,
  buildSubscriptionCancellationScheduledTemplateKey,
  buildSubscriptionCancellationWithdrawnTemplateKey,
  buildSubscriptionEndedTemplateKey,
  resolveSubscriptionEmailPlanName,
} from "@/lib/billing/subscription-management";
import { EMAIL_CATEGORIES } from "@/lib/email/categories";
import { getOrganizationNameForBillingEmail } from "@/lib/email/plan-change";
import { sendTransactionalEmail } from "@/lib/email/transactional";
import {
  buildPlanChangeCanceledHtml,
  buildPlanChangeCanceledPlainText,
  buildPlanChangeCanceledSubject,
  buildSubscriptionCancellationScheduledHtml,
  buildSubscriptionCancellationScheduledPlainText,
  buildSubscriptionCancellationScheduledSubject,
  buildSubscriptionCancellationWithdrawnHtml,
  buildSubscriptionCancellationWithdrawnPlainText,
  buildSubscriptionCancellationWithdrawnSubject,
  buildSubscriptionEndedHtml,
  buildSubscriptionEndedPlainText,
  buildSubscriptionEndedSubject,
} from "@/lib/email/templates/subscription-management";
import { createAdminClient } from "@/lib/supabase/admin";

async function resolvePrimaryBillingRecipient(
  organizationId: string,
): Promise<{ userId: string; email: string } | null> {
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
    console.error("[email][subscription] owner lookup failed", { code: ownerError.code });
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
    console.error("[email][subscription] admin lookup failed", { code: adminError.code });
    return null;
  }

  const adminUser = admins?.[0] as { id: string; email: string } | undefined;
  if (!adminUser?.id || !adminUser.email) {
    return null;
  }

  return { userId: adminUser.id, email: adminUser.email };
}

export async function sendPlanChangeCanceledEmail(input: {
  organizationId: string;
  organizationName: string;
  userId: string;
  recipientEmail: string;
  currentPlanKey: string;
  canceledPlanKey: string;
  changeType: "upgrade" | "downgrade";
  providerChangeReference: string;
}): Promise<void> {
  const currentPlanName = resolveSubscriptionEmailPlanName(input.currentPlanKey);
  const canceledPlanName = resolveSubscriptionEmailPlanName(input.canceledPlanKey);
  const templateKey = buildPlanChangeCanceledTemplateKey(
    input.providerChangeReference,
    input.canceledPlanKey,
  );

  const result = await sendTransactionalEmail({
    category: EMAIL_CATEGORIES.BILLING_SYSTEM,
    templateKey,
    organizationId: input.organizationId,
    userId: input.userId,
    to: input.recipientEmail,
    subject: buildPlanChangeCanceledSubject({ currentPlanName }),
    html: buildPlanChangeCanceledHtml({
      organizationName: input.organizationName,
      currentPlanName,
      canceledPlanName,
      changeType: input.changeType,
    }),
    text: buildPlanChangeCanceledPlainText({
      organizationName: input.organizationName,
      currentPlanName,
      canceledPlanName,
      changeType: input.changeType,
    }),
  });

  if (result.skipped) {
    console.info("[email][plan-change-cancel] email skipped (idempotent)", {
      templateKey,
      organizationId: input.organizationId,
    });
    return;
  }

  if (!result.success) {
    console.error("[email][plan-change-cancel] email failed", {
      templateKey,
      organizationId: input.organizationId,
    });
  }
}

export async function sendSubscriptionCancellationScheduledEmail(input: {
  organizationId: string;
  organizationName: string;
  userId: string;
  recipientEmail: string;
  planKey: string;
  accessUntil: string | null;
  providerSubscriptionId: string;
}): Promise<void> {
  const planName = resolveSubscriptionEmailPlanName(input.planKey);
  const accessUntilLabel = formatBillingDate(input.accessUntil);
  const templateKey = buildSubscriptionCancellationScheduledTemplateKey(
    input.providerSubscriptionId,
    input.accessUntil,
  );

  const result = await sendTransactionalEmail({
    category: EMAIL_CATEGORIES.BILLING_SYSTEM,
    templateKey,
    organizationId: input.organizationId,
    userId: input.userId,
    to: input.recipientEmail,
    subject: buildSubscriptionCancellationScheduledSubject(),
    html: buildSubscriptionCancellationScheduledHtml({
      organizationName: input.organizationName,
      planName,
      accessUntilLabel,
    }),
    text: buildSubscriptionCancellationScheduledPlainText({
      organizationName: input.organizationName,
      planName,
      accessUntilLabel,
    }),
  });

  if (result.skipped) {
    console.info("[email][subscription-cancel] scheduled email skipped (idempotent)", {
      templateKey,
      organizationId: input.organizationId,
    });
    return;
  }

  if (!result.success) {
    console.error("[email][subscription-cancel] scheduled email failed", {
      templateKey,
      organizationId: input.organizationId,
    });
  }
}

export async function sendSubscriptionEndedEmail(input: {
  organizationId: string;
  planKey: string;
  accessUntil: string | null;
  providerSubscriptionId: string;
}): Promise<void> {
  const recipient = await resolvePrimaryBillingRecipient(input.organizationId);
  if (!recipient) {
    console.error("[email][subscription-expire] no billing recipient", {
      organizationId: input.organizationId,
    });
    return;
  }

  const organizationName = await getOrganizationNameForBillingEmail(input.organizationId);
  const planName = resolveSubscriptionEmailPlanName(input.planKey);
  const accessUntilLabel = formatBillingDate(input.accessUntil);
  const templateKey = buildSubscriptionEndedTemplateKey(
    input.providerSubscriptionId,
    input.accessUntil,
  );

  const result = await sendTransactionalEmail({
    category: EMAIL_CATEGORIES.BILLING_SYSTEM,
    templateKey,
    organizationId: input.organizationId,
    userId: recipient.userId,
    to: recipient.email,
    subject: buildSubscriptionEndedSubject(),
    html: buildSubscriptionEndedHtml({
      organizationName,
      planName,
      accessUntilLabel,
    }),
    text: buildSubscriptionEndedPlainText({
      organizationName,
      planName,
      accessUntilLabel,
    }),
  });

  if (result.skipped) {
    console.info("[email][subscription-expire] ended email skipped (idempotent)", {
      templateKey,
      organizationId: input.organizationId,
    });
    return;
  }

  if (!result.success) {
    console.error("[email][subscription-expire] ended email failed", {
      templateKey,
      organizationId: input.organizationId,
    });
  }
}

export async function sendSubscriptionCancellationWithdrawnEmail(input: {
  organizationId: string;
  organizationName: string;
  userId: string;
  recipientEmail: string;
  planKey: string;
  renewalAt: string | null;
  providerSubscriptionId: string;
}): Promise<void> {
  const planName = resolveSubscriptionEmailPlanName(input.planKey);
  const renewalLabel = formatBillingDate(input.renewalAt);
  const templateKey = buildSubscriptionCancellationWithdrawnTemplateKey(
    input.providerSubscriptionId,
    input.renewalAt,
  );

  const result = await sendTransactionalEmail({
    category: EMAIL_CATEGORIES.BILLING_SYSTEM,
    templateKey,
    organizationId: input.organizationId,
    userId: input.userId,
    to: input.recipientEmail,
    subject: buildSubscriptionCancellationWithdrawnSubject({ planName }),
    html: buildSubscriptionCancellationWithdrawnHtml({
      organizationName: input.organizationName,
      planName,
      renewalLabel,
    }),
    text: buildSubscriptionCancellationWithdrawnPlainText({
      organizationName: input.organizationName,
      planName,
      renewalLabel,
    }),
  });

  if (result.skipped) {
    console.info("[email][subscription-withdraw] email skipped (idempotent)", {
      templateKey,
      organizationId: input.organizationId,
    });
    return;
  }

  if (!result.success) {
    console.error("[email][subscription-withdraw] email failed", {
      templateKey,
      organizationId: input.organizationId,
    });
  }
}
