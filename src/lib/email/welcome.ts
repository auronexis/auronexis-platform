import "server-only";

import { EMAIL_CATEGORIES, EMAIL_TEMPLATE_KEYS } from "@/lib/email/categories";
import { sendTransactionalEmail } from "@/lib/email/transactional";
import {
  WELCOME_EMAIL_SUBJECT,
  buildWelcomeEmailHtml,
  buildWelcomeEmailPlainText,
} from "@/lib/email/templates/welcome";
import { getAppUrl } from "@/lib/env";

export type WelcomeEmailInput = {
  userId: string;
  organizationId: string;
  recipientEmail: string;
  fullName: string;
  organizationName: string;
};

function resolveSignInUrl(): string {
  return `${getAppUrl().replace(/\/$/, "")}/login`;
}

/**
 * Send one welcome email after successful account/workspace provisioning.
 * Failure must never roll back signup. Duplicate sends are prevented via delivery ledger.
 */
export async function sendWelcomeEmailAfterSignup(input: WelcomeEmailInput): Promise<void> {
  const signInUrl = resolveSignInUrl();
  const templateInput = {
    fullName: input.fullName,
    organizationName: input.organizationName,
    signInUrl,
  };

  await sendTransactionalEmail({
    category: EMAIL_CATEGORIES.ACCOUNT,
    templateKey: EMAIL_TEMPLATE_KEYS.WELCOME,
    organizationId: input.organizationId,
    userId: input.userId,
    to: input.recipientEmail,
    subject: WELCOME_EMAIL_SUBJECT,
    html: buildWelcomeEmailHtml(templateInput),
    text: buildWelcomeEmailPlainText(templateInput),
  });
}
