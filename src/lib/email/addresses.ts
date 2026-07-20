import { COMPANY_CONTACT } from "@/lib/company";
import { PLATFORM_NAME } from "@/lib/branding/defaults";

/** Platform-owned sender addresses for transactional email. */
export const PLATFORM_EMAIL_ADDRESSES = {
  noReply: COMPANY_CONTACT.noReplyEmail,
  support: COMPANY_CONTACT.supportEmail,
  legal: COMPANY_CONTACT.legalEmail,
} as const;

export function formatEmailSender(displayName: string, email: string): string {
  return `${displayName} <${email}>`;
}

/** Extract a bare email from `Name <email>` or return the trimmed string. */
export function extractEmailAddress(fromValue: string): string {
  const match = fromValue.match(/<([^>]+)>/);
  return match?.[1]?.trim() ?? fromValue.trim();
}

export function getPlatformNoReplySender(displayName = PLATFORM_NAME): string {
  return formatEmailSender(displayName, PLATFORM_EMAIL_ADDRESSES.noReply);
}

export function getPlatformSupportSender(displayName = PLATFORM_NAME): string {
  return formatEmailSender(displayName, PLATFORM_EMAIL_ADDRESSES.support);
}
