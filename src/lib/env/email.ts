import { COMPANY_CONTACT } from "@/lib/company";
import { PLATFORM_NAME } from "@/lib/branding/defaults";

export type EmailProviderId = "resend" | "ses" | "smtp" | "mailgun" | "postmark";

const EMAIL_PROVIDER_IDS: readonly EmailProviderId[] = [
  "resend",
  "ses",
  "smtp",
  "mailgun",
  "postmark",
];

/** Resolve configured transactional email provider (defaults to Resend). */
export function getEmailProviderId(): EmailProviderId {
  const raw = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (EMAIL_PROVIDER_IDS.includes(raw as EmailProviderId)) {
    return raw as EmailProviderId;
  }
  return "resend";
}

/** Whether the active provider has minimum credentials configured. */
export function isEmailConfigured(): boolean {
  switch (getEmailProviderId()) {
    case "resend":
      return Boolean(process.env.RESEND_API_KEY?.trim());
    case "postmark":
      return Boolean(process.env.POSTMARK_SERVER_TOKEN?.trim());
    case "mailgun":
      return Boolean(
        process.env.MAILGUN_API_KEY?.trim() && process.env.MAILGUN_DOMAIN?.trim(),
      );
    case "ses":
      return Boolean(
        process.env.AWS_SES_ACCESS_KEY_ID?.trim() &&
          process.env.AWS_SES_SECRET_ACCESS_KEY?.trim() &&
          process.env.AWS_SES_REGION?.trim(),
      );
    case "smtp":
      return Boolean(
        process.env.SMTP_HOST?.trim() &&
          process.env.SMTP_PORT?.trim() &&
          process.env.SMTP_USER?.trim() &&
          process.env.SMTP_PASSWORD?.trim(),
      );
    default:
      return false;
  }
}

/** Platform default sender address for transactional email. */
export function getDefaultFromEmail(): string {
  const configured =
    process.env.EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    process.env.SMTP_FROM?.trim();

  if (configured) {
    return configured;
  }

  return `${PLATFORM_NAME} <${COMPANY_CONTACT.noReplyEmail}>`;
}

/** Optional Resend API key — returns null when unset instead of throwing. */
export function getOptionalResendApiKey(): string | null {
  const value = process.env.RESEND_API_KEY?.trim();
  return value && value.length > 0 ? value : null;
}
