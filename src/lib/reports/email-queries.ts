import { createClient } from "@/lib/supabase/server";
import type { ReportEmailDeliveryView } from "@/lib/reports/email-types";
import type { SessionContext } from "@/lib/tenancy/context";

const DELIVERY_SELECT =
  "id, organization_id, report_id, recipient_email, subject, message, sent_at, status, error_message, resend_message_id, created_by, created_at";

/** Email delivery history for a report in the current organization. */
export async function listReportEmailDeliveries(
  session: SessionContext,
  reportId: string,
): Promise<ReportEmailDeliveryView[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("report_email_deliveries")
    .select(DELIVERY_SELECT)
    .eq("organization_id", session.organization.id)
    .eq("report_id", reportId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ReportEmailDeliveryView[];
}
