import "server-only";

import type { EmailMessage, EmailSendResult } from "@/lib/email/types";

function getSesConfig(): {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
} | null {
  const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY?.trim();
  const region = process.env.AWS_SES_REGION?.trim();
  if (!accessKeyId || !secretAccessKey || !region) return null;
  return { accessKeyId, secretAccessKey, region };
}

/**
 * AWS SES v2 send via HTTPS API.
 * For production, prefer IAM credentials scoped to ses:SendEmail only.
 */
export async function sendViaSes(message: EmailMessage): Promise<EmailSendResult> {
  void message;
  const config = getSesConfig();
  if (!config) {
    return { success: false, error: "AWS SES credentials or region are not configured." };
  }

  return {
    success: false,
    error:
      "AWS SES provider requires SMTP relay or AWS SDK configuration. Set EMAIL_PROVIDER=smtp with your SES SMTP endpoint, or use Resend/Postmark/Mailgun.",
  };
}
