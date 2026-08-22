import "server-only";

import { safeGetPlanByKey } from "@/lib/billing/plans";
import { EMAIL_CATEGORIES } from "@/lib/email/categories";
import { resolvePrimaryBillingRecipientForEmail } from "@/lib/email/billing-recipient";
import { getOrganizationNameForBillingEmail } from "@/lib/email/plan-change";
import { sendTransactionalEmail } from "@/lib/email/transactional";
import {
  buildPurchaseActivatedHtml,
  buildPurchaseActivatedPlainText,
  buildPurchaseActivatedSubject,
  buildPurchaseActivatedTemplateKey,
} from "@/lib/email/templates/purchase";

export async function sendPurchaseActivatedEmail(input: {
  organizationId: string;
  organizationName?: string;
  planKey: string;
  providerSubscriptionId: string;
  providerPaymentId: string;
  receiptUrl: string | null;
}): Promise<void> {
  const recipient = await resolvePrimaryBillingRecipientForEmail(input.organizationId);
  if (!recipient) {
    console.error("[email][purchase] no billing recipient", {
      organizationId: input.organizationId,
    });
    return;
  }

  const organizationName =
    input.organizationName ?? (await getOrganizationNameForBillingEmail(input.organizationId));
  const planName = safeGetPlanByKey(input.planKey)?.name ?? input.planKey;
  const templateKey = buildPurchaseActivatedTemplateKey(
    input.providerSubscriptionId,
    input.providerPaymentId,
  );

  const result = await sendTransactionalEmail({
    category: EMAIL_CATEGORIES.BILLING_SYSTEM,
    templateKey,
    organizationId: input.organizationId,
    userId: recipient.userId,
    to: recipient.email,
    subject: buildPurchaseActivatedSubject({ planName }),
    html: buildPurchaseActivatedHtml({
      organizationName,
      planName,
      receiptUrl: input.receiptUrl,
    }),
    text: buildPurchaseActivatedPlainText({
      organizationName,
      planName,
      receiptUrl: input.receiptUrl,
    }),
  });

  if (result.skipped) {
    console.info("[email][purchase] activation email skipped (idempotent)", {
      templateKey,
      organizationId: input.organizationId,
    });
    return;
  }

  if (!result.success) {
    console.error("[email][purchase] activation email failed", {
      templateKey,
      organizationId: input.organizationId,
    });
  }
}
