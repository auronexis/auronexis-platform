import "server-only";

import { COMPANY_CONTACT } from "@/lib/company";
import { extractEmailAddress, getPlatformNoReplySender } from "@/lib/email/addresses";
import type { EmailCategory } from "@/lib/email/categories";
import { isTransactionalRequiredCategory } from "@/lib/email/categories";
import { sendEmail } from "@/lib/email/provider";
import type { EmailMessage, EmailSendResult } from "@/lib/email/types";
import { getDefaultFromEmail } from "@/lib/env/email";
import { createAdminClient } from "@/lib/supabase/admin";

export type TransactionalDeliveryStatus = "claimed" | "sent" | "failed" | "skipped";

export type SendTransactionalEmailInput = {
  category: EmailCategory;
  templateKey: string;
  organizationId: string;
  userId: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

/**
 * Canonical From for AUTH / ACCOUNT / BILLING_SYSTEM mail.
 * Forces Auroranexis &lt;noreply@…&gt; when SMTP_FROM / EMAIL_FROM is sales@ or unset.
 */
export function getTransactionalFromEmail(): string {
  const configured = getDefaultFromEmail();
  const address = extractEmailAddress(configured).toLowerCase();
  const noreply = COMPANY_CONTACT.noReplyEmail.toLowerCase();

  if (address === noreply) {
    return configured.includes("<") ? configured : getPlatformNoReplySender();
  }

  return getPlatformNoReplySender();
}

async function claimDelivery(input: {
  organizationId: string;
  userId: string;
  category: EmailCategory;
  templateKey: string;
}): Promise<{ claimed: boolean; deliveryId: string | null }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("transactional_email_deliveries")
    .insert({
      organization_id: input.organizationId,
      user_id: input.userId,
      category: input.category,
      template_key: input.templateKey,
      status: "claimed",
    } as never)
    .select("id")
    .maybeSingle();

  if (error) {
    // Unique violation → already claimed/sent (idempotent skip).
    if (error.code === "23505") {
      return { claimed: false, deliveryId: null };
    }
    console.error("[email] transactional claim failed", {
      template: input.templateKey,
      category: input.category,
      code: error.code,
    });
    // Fail open for first-time send when ledger unavailable — still avoid rolling back signup.
    return { claimed: true, deliveryId: null };
  }

  return { claimed: Boolean(data?.id), deliveryId: data?.id ?? null };
}

async function finalizeDelivery(input: {
  deliveryId: string | null;
  status: Exclude<TransactionalDeliveryStatus, "claimed">;
  messageId?: string;
  errorCode?: string;
}): Promise<void> {
  if (!input.deliveryId) {
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("transactional_email_deliveries")
    .update({
      status: input.status,
      provider_message_id: input.messageId ?? null,
      error_code: input.errorCode ?? null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", input.deliveryId);

  if (error) {
    console.error("[email] transactional finalize failed", {
      status: input.status,
      code: error.code,
    });
  }
}

/**
 * Business-event → template → provider path for required transactional mail.
 * Marketing opt-out never applies. Idempotent per (user_id, template_key).
 */
export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput,
): Promise<EmailSendResult & { skipped?: boolean }> {
  if (!isTransactionalRequiredCategory(input.category)) {
    return { success: false, error: "Category is not transactional.", skipped: true };
  }

  const claim = await claimDelivery({
    organizationId: input.organizationId,
    userId: input.userId,
    category: input.category,
    templateKey: input.templateKey,
  });

  if (!claim.claimed) {
    return { success: true, skipped: true };
  }

  const message: EmailMessage = {
    from: getTransactionalFromEmail(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo ?? COMPANY_CONTACT.supportEmail,
  };

  try {
    const result = await sendEmail(message);
    if (result.success) {
      await finalizeDelivery({
        deliveryId: claim.deliveryId,
        status: "sent",
        messageId: result.messageId,
      });
      return result;
    }

    await finalizeDelivery({
      deliveryId: claim.deliveryId,
      status: "failed",
      errorCode: "provider_send_failed",
    });
    console.error("[email] transactional send failed", {
      template: input.templateKey,
      category: input.category,
    });
    return result;
  } catch {
    await finalizeDelivery({
      deliveryId: claim.deliveryId,
      status: "failed",
      errorCode: "provider_exception",
    });
    console.error("[email] transactional send threw", {
      template: input.templateKey,
      category: input.category,
    });
    return { success: false, error: "Unable to send transactional email." };
  }
}
