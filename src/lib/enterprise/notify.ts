import "server-only";

import { SALES_EMAIL } from "@/lib/company/company-contact";
import { getDefaultFromEmail } from "@/lib/env/email";
import { sendEmail } from "@/lib/email/provider";

type EnterpriseRequestNotificationInput = {
  contactEmail: string;
  companyName: string;
  requestedSeats: number | null;
  requestedClients: number | null;
  notes: string | null;
  organizationId: string;
  requestId: string;
};

/**
 * Best-effort operator email for new Enterprise requests.
 * Destination is fixed (sales@) — never client-controlled.
 */
export async function sendEnterpriseRequestNotificationEmail(
  input: EnterpriseRequestNotificationInput,
): Promise<boolean> {
  try {
    const from = getDefaultFromEmail();
    const result = await sendEmail({
      from,
      to: SALES_EMAIL,
      replyTo: input.contactEmail,
      subject: `[Enterprise request] ${input.companyName}`,
      text: [
        "New Enterprise plan request",
        "",
        `Company: ${input.companyName}`,
        `Contact: ${input.contactEmail}`,
        input.requestedSeats != null ? `Requested seats: ${input.requestedSeats}` : null,
        input.requestedClients != null ? `Requested clients: ${input.requestedClients}` : null,
        `Organization id: ${input.organizationId}`,
        `Request id: ${input.requestId}`,
        input.notes ? `\nNotes:\n${input.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    if (!result.success) {
      console.error("[enterprise] Request notification email failed:", result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[enterprise] Request notification email failed:", error);
    return false;
  }
}
