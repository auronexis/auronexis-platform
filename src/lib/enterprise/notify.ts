import "server-only";

import { SALES_EMAIL } from "@/lib/company/company-contact";
import { safeReplyToAddress } from "@/lib/email/addresses";
import { getDefaultFromEmail } from "@/lib/env/email";
import { sendEmail } from "@/lib/email/provider";

type EnterpriseRequestNotificationInput = {
  contactEmail: string;
  companyName: string;
  requestedSeats: number | null;
  requestedClients: number | null;
  notes: string | null;
  organizationId: string;
  requestId: string | null;
  /** When true, DB persist failed — email is the sole delivery path. */
  persistFailed?: boolean;
  correlationId?: string;
};

/**
 * Best-effort operator email for new Enterprise requests.
 * Destination is fixed (sales@) — never client-controlled.
 */
export async function sendEnterpriseRequestNotificationEmail(
  input: EnterpriseRequestNotificationInput,
): Promise<boolean> {
  const correlationId = input.correlationId ?? "unknown";
  try {
    const from = getDefaultFromEmail();
    const replyTo = safeReplyToAddress(input.contactEmail);
    const result = await sendEmail({
      from,
      to: SALES_EMAIL,
      ...(replyTo ? { replyTo } : {}),
      subject: `${input.persistFailed ? "[UNPERSISTED] " : ""}[Enterprise request] ${input.companyName}`,
      text: [
        "New Enterprise plan request",
        input.persistFailed
          ? "WARNING: Database persist failed — this email is the only copy of the request."
          : null,
        `Correlation: ${correlationId}`,
        "",
        `Company: ${input.companyName}`,
        `Contact: ${input.contactEmail}`,
        input.requestedSeats != null ? `Requested seats: ${input.requestedSeats}` : null,
        input.requestedClients != null ? `Requested clients: ${input.requestedClients}` : null,
        `Organization id: ${input.organizationId}`,
        input.requestId ? `Request id: ${input.requestId}` : "Request id: (not persisted)",
        input.notes ? `\nNotes:\n${input.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    if (!result.success) {
      console.error(`[enterprise] Request notification email failed (${correlationId})`);
      return false;
    }

    return true;
  } catch {
    console.error(`[enterprise] Request notification email threw (${correlationId})`);
    return false;
  }
}
