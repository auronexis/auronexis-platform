export type EmailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
};

export type EmailMessage = {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
};

export type EmailSendResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

export type { EmailProviderId } from "@/lib/env/email";
