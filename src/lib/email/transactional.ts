import "server-only";

import { COMPANY_CONTACT } from "@/lib/company";
import { extractEmailAddress, getPlatformNoReplySender } from "@/lib/email/addresses";
import type { EmailCategory } from "@/lib/email/categories";
import { isTransactionalRequiredCategory } from "@/lib/email/categories";
import { sendEmail } from "@/lib/email/provider";
import type { EmailAttachment, EmailMessage, EmailSendResult } from "@/lib/email/types";
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
  attachments?: EmailAttachment[];
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

async function reclaimFailedOrStaleDelivery(input: {
  userId: string;
  templateKey: string;
}): Promise<{ claimed: boolean; deliveryId: string | null }> {
  const admin = createAdminClient();
  const { data: existing, error: readError } = await admin
    .from("transactional_email_deliveries")
    .select("id, status")
    .eq("user_id", input.userId)
    .eq("template_key", input.templateKey)
    .maybeSingle();

  if (readError || !existing?.id) {
    return { claimed: false, deliveryId: null };
  }

  const status = (existing as { status?: string }).status;
  // Already delivered — idempotent skip (webhook replay must not duplicate).
  if (status === "sent" || status === "skipped") {
    return { claimed: false, deliveryId: null };
  }

  // failed or claimed (interrupted serverless send) — allow one retry without mutating billing.
  if (status === "failed" || status === "claimed") {
    const { data: updated, error: updateError } = await admin
      .from("transactional_email_deliveries")
      .update({
        status: "claimed",
        error_code: null,
        provider_message_id: null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", existing.id)
      .in("status", ["failed", "claimed"])
      .select("id")
      .maybeSingle();

    if (updateError || !updated?.id) {
      return { claimed: false, deliveryId: null };
    }
    return { claimed: true, deliveryId: updated.id as string };
  }

  return { claimed: false, deliveryId: null };
}

export async function claimTransactionalDelivery(input: {
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
    // Unique violation → already claimed/sent; reclaim failed/stale claimed for retry.
    if (error.code === "23505") {
      return reclaimFailedOrStaleDelivery({
        userId: input.userId,
        templateKey: input.templateKey,
      });
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

export async function finalizeTransactionalDelivery(input: {
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

export type SendClaimedTransactionalEmailInput = {
  deliveryId: string | null;
  category: EmailCategory;
  templateKey: string;
  from?: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
};

/**
 * Provider send + ledger finalize for an already-claimed transactional delivery.
 * Used when callers must prepare attachments (e.g. invoice PDF) before send.
 */
export async function sendClaimedTransactionalEmail(
  input: SendClaimedTransactionalEmailInput,
): Promise<EmailSendResult> {
  const message: EmailMessage = {
    from: input.from ?? getTransactionalFromEmail(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo ?? COMPANY_CONTACT.supportEmail,
    attachments: input.attachments,
  };

  try {
    const result = await sendEmail(message);
    if (result.success) {
      await finalizeTransactionalDelivery({
        deliveryId: input.deliveryId,
        status: "sent",
        messageId: result.messageId,
      });
      return result;
    }

    await finalizeTransactionalDelivery({
      deliveryId: input.deliveryId,
      status: "failed",
      errorCode: "provider_send_failed",
    });
    console.error("[email] transactional send failed", {
      template: input.templateKey,
      category: input.category,
    });
    return result;
  } catch {
    await finalizeTransactionalDelivery({
      deliveryId: input.deliveryId,
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

  const claim = await claimTransactionalDelivery({
    organizationId: input.organizationId,
    userId: input.userId,
    category: input.category,
    templateKey: input.templateKey,
  });

  if (!claim.claimed) {
    return { success: true, skipped: true };
  }

  return sendClaimedTransactionalEmail({
    deliveryId: claim.deliveryId,
    category: input.category,
    templateKey: input.templateKey,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
    attachments: input.attachments,
  });
}
