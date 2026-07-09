"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { dispatchAutomation } from "@/lib/automation";
import { checkPlanFeatureSafe, resolveActionError } from "@/lib/action-errors";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import { getOrganizationBranding } from "@/lib/branding/queries";
import { getOrganizationEmailSettings } from "@/lib/email/organization-settings-queries";
import { buildReportEmailSubject, sendReportEmail } from "@/lib/email/send-report-email";
import { createNotificationForOwnersAndAdmins } from "@/lib/notifications/create";
import { requireSession } from "@/lib/auth/session";
import { canSendReportEmail, canSendReportEmailForStatus } from "@/lib/reports/guards";
import {
  buildReportExportFilename,
  generateReportPdf,
} from "@/lib/reports/pdf";
import {
  getClientReportMetrics,
  getRelatedOpenIncidents,
  getRelatedOpenRisks,
  getReportById,
} from "@/lib/reports/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ReportEmailDeliveryInsert = Database["public"]["Tables"]["report_email_deliveries"]["Insert"];
type ReportEmailDeliveryUpdate = Database["public"]["Tables"]["report_email_deliveries"]["Update"];

export type SendReportEmailActionState = {
  error?: string;
  success?: string;
};

const emailSchema = z.object({
  recipientEmail: z.string().email("Enter a valid email address."),
});

/** Send a published report to a client by email — Owner/Admin only. */
export async function sendReportByEmailAction(
  reportId: string,
  _prevState: SendReportEmailActionState,
  formData: FormData,
): Promise<SendReportEmailActionState> {
  try {
    const session = await requireSession();

    if (!canSendReportEmail(session)) {
      return { error: ACTION_DENIED_MESSAGE };
    }

    const planError = await checkPlanFeatureSafe(session.organization.id, "email_delivery");
    if (planError) {
      return planError;
    }

    const parsed = emailSchema.safeParse({
    recipientEmail: formData.get("recipientEmail"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email address." };
  }

  const report = await getReportById(session, reportId);

  if (!report) {
    return { error: "Report not found." };
  }

  if (report.organization_id !== session.organization.id) {
    return { error: "Report not found." };
  }

  if (!canSendReportEmailForStatus(report.status)) {
    return { error: "Only published reports can be emailed to clients." };
  }

  const clientName = report.clients?.name ?? "Client";
  const subject = buildReportEmailSubject(clientName);
  const [emailSettings, branding] = await Promise.all([
    getOrganizationEmailSettings(session),
    getOrganizationBranding(session),
  ]);
  const supabase = await createClient();

  const insertPayload: ReportEmailDeliveryInsert = {
    organization_id: session.organization.id,
    report_id: report.id,
    recipient_email: parsed.data.recipientEmail.toLowerCase(),
    subject,
    message: "Pending delivery",
    status: "pending",
    created_by: session.user.id,
  };

  const { data: deliveryData, error: insertError } = await supabase
    .from("report_email_deliveries")
    .insert(insertPayload as never)
    .select("id")
    .single();

  const delivery = deliveryData as { id: string } | null;

  if (insertError || !delivery) {
    return { error: "Unable to create delivery record." };
  }

  const [metrics, relatedRisks, relatedIncidents] = await Promise.all([
    getClientReportMetrics(session, report.client_id),
    getRelatedOpenRisks(session, report.client_id),
    getRelatedOpenIncidents(session, report.client_id),
  ]);

  const generatedAt = new Date();
  const pdfBuffer = await generateReportPdf({
    branding,
    report,
    metrics,
    relatedRisks,
    relatedIncidents,
    generatedAt,
  });

  const pdfFilename = buildReportExportFilename(clientName, report.reporting_period_end);

  const sendResult = await sendReportEmail({
    organizationName: session.organization.name,
    branding,
    emailSettings,
    report,
    recipientEmail: parsed.data.recipientEmail,
    pdfBuffer,
    pdfFilename,
  });

  if (!sendResult.success) {
    const failedUpdate: ReportEmailDeliveryUpdate = {
      status: "failed",
      error_message: sendResult.error ?? "Unable to send email.",
      message: sendResult.plainText ?? "Delivery failed",
    };

    await supabase
      .from("report_email_deliveries")
      .update(failedUpdate as never)
      .eq("id", delivery.id)
      .eq("organization_id", session.organization.id);

    await recordActivityEvent({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      entityType: "report",
      entityId: report.id,
      action: "report_email_failed",
      title: `Report email failed: ${report.title}`,
      description: sendResult.error ?? "Unable to send email.",
      metadata: {
        reportId: report.id,
        clientId: report.client_id,
        deliveryId: delivery.id,
        recipientEmail: parsed.data.recipientEmail,
        errorMessage: sendResult.error ?? null,
      },
    });

    await createNotificationForOwnersAndAdmins(session.organization.id, {
      type: "report_email_failed",
      title: "Report email failed",
      message: `Failed to email "${report.title}" to ${parsed.data.recipientEmail}.`,
      entityType: "report",
      entityId: report.id,
    });

    revalidatePath(`/reports/${reportId}`);
    revalidatePath("/activity");
    revalidatePath("/notifications");
    revalidatePath("/", "layout");

    return { error: sendResult.error ?? "Unable to send email." };
  }

  const sentUpdate: ReportEmailDeliveryUpdate = {
    status: "sent",
    sent_at: new Date().toISOString(),
    error_message: null,
    resend_message_id: sendResult.resendMessageId ?? null,
    message: sendResult.plainText ?? "Delivered",
  };

  const { error: updateError } = await supabase
    .from("report_email_deliveries")
    .update(sentUpdate as never)
    .eq("id", delivery.id)
    .eq("organization_id", session.organization.id);

  if (updateError) {
    return {
      error: "Email sent but delivery record could not be updated.",
    };
  }

  const sentReportUpdate = {
    sent_at: new Date().toISOString(),
  };

  await supabase
    .from("reports")
    .update(sentReportUpdate as never)
    .eq("id", report.id)
    .eq("organization_id", session.organization.id);

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "report",
    entityId: report.id,
    action: "report_email_sent",
    title: `Report emailed: ${report.title}`,
    description: `Sent to ${parsed.data.recipientEmail}`,
    metadata: {
      reportId: report.id,
      clientId: report.client_id,
      deliveryId: delivery.id,
      recipientEmail: parsed.data.recipientEmail,
      resendMessageId: sendResult.resendMessageId ?? null,
    },
  });

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "report",
    entityId: report.id,
    action: "report_marked_sent",
    title: `Report marked sent: ${report.title}`,
    description: "Status updated after successful email delivery.",
    metadata: {
      reportId: report.id,
      clientId: report.client_id,
      deliveryId: delivery.id,
    },
  });

  await dispatchAutomation({
    trigger: "report_sent",
    organizationId: session.organization.id,
    entityType: "report",
    entityId: report.id,
    clientId: report.client_id,
    actorUserId: session.user.id,
    payload: {
      title: report.title,
      reportId: report.id,
      clientId: report.client_id,
      clientName,
      recipientEmail: parsed.data.recipientEmail,
    },
  });

  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports");
  revalidatePath("/activity");
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  revalidatePath(`/clients/${report.client_id}`);
  revalidatePath("/", "layout");

  return { success: `Report emailed to ${parsed.data.recipientEmail}.` };
  } catch (error) {
    return resolveActionError(error, "Unable to send report email.");
  }
}
