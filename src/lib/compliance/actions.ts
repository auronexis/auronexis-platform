"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { recordComplianceAudit } from "@/lib/compliance/audit";
import { invalidateComplianceCache } from "@/lib/compliance/cache";
import { exportAuditData, exportEvidenceBundle } from "@/lib/compliance/export";
import { createGdprRequest, updateGdprRequestStatus } from "@/lib/compliance/gdpr";
import { createSecurityIncident, updateSecurityIncidentStatus } from "@/lib/compliance/incidents";
import { recordConsent } from "@/lib/compliance/consent";
import type { AuditExportFormat, GdprRequestStatus, GdprRequestType, SecurityIncidentSeverity, SecurityIncidentStatus } from "@/lib/compliance/types";
import { AuthorizationError } from "@/lib/rbac/guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export type ComplianceActionState = {
  error?: string;
  success?: string;
  downloadContent?: string;
  downloadFilename?: string;
};

function requireOwnerAdmin(session: Awaited<ReturnType<typeof requireSession>>) {
  if (!canManageOrganizationSettings(session)) {
    throw new AuthorizationError();
  }
}

const gdprSchema = z.object({
  requestType: z.enum(["access", "deletion", "export", "correction", "restriction", "consent_withdrawal"]),
  subjectEmail: z.string().email(),
  notes: z.string().optional(),
});

export async function createGdprRequestAction(
  _state: ComplianceActionState,
  formData: FormData,
): Promise<ComplianceActionState> {
  const session = await requireSession();
  requireOwnerAdmin(session);

  const parsed = gdprSchema.safeParse({
    requestType: formData.get("requestType"),
    subjectEmail: formData.get("subjectEmail"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: "Enter a valid GDPR request." };
  }

  await createGdprRequest({
    organizationId: session.organization.id,
    requestedBy: session.user.id,
    requestType: parsed.data.requestType as GdprRequestType,
    subjectEmail: parsed.data.subjectEmail,
    notes: parsed.data.notes,
  });

  await recordComplianceAudit({
    organizationId: session.organization.id,
    userId: session.user.id,
    entityType: "organization",
    eventType: "gdpr_request_created",
    metadata: { requestType: parsed.data.requestType, subjectEmail: parsed.data.subjectEmail },
  });

  invalidateComplianceCache(session.organization.id);
  revalidatePath("/dashboard/compliance");
  return { success: "GDPR request created." };
}

export async function updateGdprRequestStatusAction(input: {
  requestId: string;
  status: GdprRequestStatus;
}): Promise<ComplianceActionState> {
  const session = await requireSession();
  requireOwnerAdmin(session);

  await updateGdprRequestStatus({
    organizationId: session.organization.id,
    requestId: input.requestId,
    status: input.status,
  });

  invalidateComplianceCache(session.organization.id);
  revalidatePath("/dashboard/compliance");
  return { success: "GDPR request updated." };
}

export async function createSecurityIncidentAction(
  _state: ComplianceActionState,
  formData: FormData,
): Promise<ComplianceActionState> {
  const session = await requireSession();
  requireOwnerAdmin(session);

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const severity = String(formData.get("severity") ?? "medium") as SecurityIncidentSeverity;

  if (!title) {
    return { error: "Incident title is required." };
  }

  await createSecurityIncident({
    organizationId: session.organization.id,
    reportedBy: session.user.id,
    title,
    description,
    severity,
  });

  await recordComplianceAudit({
    organizationId: session.organization.id,
    userId: session.user.id,
    entityType: "organization",
    eventType: "security_incident_created",
    metadata: { title, severity },
  });

  invalidateComplianceCache(session.organization.id);
  revalidatePath("/dashboard/compliance");
  return { success: "Security incident recorded." };
}

export async function updateSecurityIncidentStatusAction(input: {
  incidentId: string;
  status: SecurityIncidentStatus;
}): Promise<ComplianceActionState> {
  const session = await requireSession();
  requireOwnerAdmin(session);

  await updateSecurityIncidentStatus({
    organizationId: session.organization.id,
    incidentId: input.incidentId,
    status: input.status,
  });

  invalidateComplianceCache(session.organization.id);
  revalidatePath("/dashboard/compliance");
  return { success: "Security incident updated." };
}

export async function recordConsentAction(
  _state: ComplianceActionState,
  formData: FormData,
): Promise<ComplianceActionState> {
  const session = await requireSession();
  requireOwnerAdmin(session);

  const subjectEmail = String(formData.get("subjectEmail") ?? "").trim();
  const consentType = String(formData.get("consentType") ?? "").trim();
  const granted = formData.get("granted") === "true";

  if (!subjectEmail || !consentType) {
    return { error: "Subject email and consent type are required." };
  }

  await recordConsent({
    organizationId: session.organization.id,
    subjectEmail,
    consentType,
    granted,
  });

  await recordComplianceAudit({
    organizationId: session.organization.id,
    userId: session.user.id,
    entityType: "organization",
    eventType: "consent_recorded",
    metadata: { subjectEmail, consentType, granted },
  });

  return { success: "Consent record saved." };
}

export async function exportAuditAction(input: {
  format: AuditExportFormat;
  query?: string;
  entityType?: string;
  severity?: string;
}): Promise<ComplianceActionState> {
  const session = await requireSession();
  requireOwnerAdmin(session);

  const result = await exportAuditData({
    session,
    format: input.format,
    filters: {
      query: input.query,
      entityType: input.entityType,
      severity: input.severity as never,
    },
  });

  return {
    success: `Export completed (${result.rowCount} rows).`,
    downloadContent: result.downloadPayload,
    downloadFilename: `audit-export.${input.format === "csv" ? "csv" : "json"}`,
  };
}

export async function exportEvidenceAction(): Promise<ComplianceActionState> {
  const session = await requireSession();
  requireOwnerAdmin(session);

  const result = await exportEvidenceBundle(session);
  return {
    success: "Evidence bundle generated.",
    downloadContent: result.content,
    downloadFilename: "evidence-bundle.json",
  };
}
