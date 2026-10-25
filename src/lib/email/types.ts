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
  /** Extra MIME headers, e.g. List-Unsubscribe for newsletters. */
  headers?: Record<string, string>;
};

export type EmailSendResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

export type { EmailProviderId } from "@/lib/env/email";
