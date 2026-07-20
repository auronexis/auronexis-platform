"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { requireSession } from "@/lib/auth/session";
import { checkPlanFeatureSafe } from "@/lib/action-errors";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import { canManageReportTemplates } from "@/lib/report-templates/guards";
import { getReportTemplateById } from "@/lib/report-templates/queries";
import { createClient } from "@/lib/supabase/server";
import { optionalText } from "@/lib/validation/form-fields";
import type { Database } from "@/types/database";

type ReportTemplateInsert = Database["public"]["Tables"]["report_templates"]["Insert"];
type ReportTemplateUpdate = Database["public"]["Tables"]["report_templates"]["Update"];

export type ReportTemplateActionState = {
  error?: string;
  success?: string;
};

const templateFieldsSchema = z.object({
  name: z.string().trim().min(2, "Template name is required."),
  description: optionalText,
  executiveSummaryTemplate: optionalText,
  keyWinsTemplate: optionalText,
  keyRisksTemplate: optionalText,
  nextActionsTemplate: optionalText,
});

function parseTemplateForm(formData: FormData) {
  return templateFieldsSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    executiveSummaryTemplate: formData.get("executiveSummaryTemplate"),
    keyWinsTemplate: formData.get("keyWinsTemplate"),
    keyRisksTemplate: formData.get("keyRisksTemplate"),
    nextActionsTemplate: formData.get("nextActionsTemplate"),
  });
}

function buildTemplatePayload(parsed: z.infer<typeof templateFieldsSchema>) {
  return {
    name: parsed.name,
    description: parsed.description ?? null,
    executive_summary_template: parsed.executiveSummaryTemplate ?? null,
    key_wins_template: parsed.keyWinsTemplate ?? null,
    key_risks_template: parsed.keyRisksTemplate ?? null,
    next_actions_template: parsed.nextActionsTemplate ?? null,
  };
}

async function clearDefaultTemplate(organizationId: string, exceptTemplateId?: string): Promise<void> {
  const supabase = await createClient();
  let query = supabase
    .from("report_templates")
    .update({ is_default: false } as never)
    .eq("organization_id", organizationId)
    .eq("is_default", true);

  if (exceptTemplateId) {
    query = query.neq("id", exceptTemplateId);
  }

  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }
}

/** Create a report template — Owner/Admin only. */
export async function createReportTemplateAction(
  _prevState: ReportTemplateActionState,
  formData: FormData,
): Promise<ReportTemplateActionState> {
  const session = await requireSession();

  if (!canManageReportTemplates(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const planError = await checkPlanFeatureSafe(session.organization.id, "report_templates");
  if (planError) {
    return planError;
  }

  const parsed = parseTemplateForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid template data." };
  }

  const supabase = await createClient();
  const insertPayload: ReportTemplateInsert = {
    organization_id: session.organization.id,
    created_by: session.user.id,
    is_default: false,
    ...buildTemplatePayload(parsed.data),
  };

  const { data, error } = await supabase
    .from("report_templates")
    .insert(insertPayload as never)
    .select("id")
    .single();

  const created = data as { id: string } | null;

  if (error || !created) {
    return { error: "Unable to create report template." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "report",
    entityId: created.id,
    action: "report_template_created",
    title: `Report template created: ${parsed.data.name}`,
    metadata: { templateId: created.id, name: parsed.data.name },
  });

  revalidatePath("/reports/templates");
  revalidatePath("/activity");
  redirect(`/reports/templates/${created.id}`);
}

/** Update a report template — Owner/Admin only. */
export async function updateReportTemplateAction(
  templateId: string,
  _prevState: ReportTemplateActionState,
  formData: FormData,
): Promise<ReportTemplateActionState> {
  const session = await requireSession();

  if (!canManageReportTemplates(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const planError = await checkPlanFeatureSafe(session.organization.id, "report_templates");
  if (planError) {
    return planError;
  }

  const existing = await getReportTemplateById(session, templateId);

  if (!existing) {
    return { error: "Report template not found." };
  }

  const parsed = parseTemplateForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid template data." };
  }

  const supabase = await createClient();
  const updatePayload: ReportTemplateUpdate = buildTemplatePayload(parsed.data);

  const { error } = await supabase
    .from("report_templates")
    .update(updatePayload as never)
    .eq("id", templateId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: "Unable to update report template." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "report",
    entityId: templateId,
    action: "report_template_updated",
    title: `Report template updated: ${parsed.data.name}`,
    metadata: { templateId, name: parsed.data.name },
  });

  revalidatePath("/reports/templates");
  revalidatePath(`/reports/templates/${templateId}`);
  revalidatePath("/activity");
  return { success: "Template updated." };
}

/** Delete a report template — Owner/Admin only. */
export async function deleteReportTemplateAction(templateId: string): Promise<void> {
  const session = await requireSession();

  if (!canManageReportTemplates(session)) {
    throw new Error(ACTION_DENIED_MESSAGE);
  }

  const planError = await checkPlanFeatureSafe(session.organization.id, "report_templates");
  if (planError) {
    throw new Error(planError.error);
  }

  const existing = await getReportTemplateById(session, templateId);

  if (!existing) {
    throw new Error("Report template not found.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("report_templates")
    .delete()
    .eq("id", templateId)
    .eq("organization_id", session.organization.id);

  if (error) {
    throw new Error("Unable to delete report template.");
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "report",
    entityId: templateId,
    action: "report_template_deleted",
    title: `Report template deleted: ${existing.name}`,
    metadata: { templateId, name: existing.name },
  });

  revalidatePath("/reports/templates");
  revalidatePath("/activity");
  redirect("/reports/templates");
}

/** Set a template as the organization default — Owner/Admin only. */
export async function setDefaultReportTemplateAction(templateId: string): Promise<void> {
  const session = await requireSession();

  if (!canManageReportTemplates(session)) {
    throw new Error(ACTION_DENIED_MESSAGE);
  }

  const planError = await checkPlanFeatureSafe(session.organization.id, "report_templates");
  if (planError) {
    throw new Error(planError.error);
  }

  const existing = await getReportTemplateById(session, templateId);

  if (!existing) {
    throw new Error("Report template not found.");
  }

  await clearDefaultTemplate(session.organization.id, templateId);

  const supabase = await createClient();
  const { error } = await supabase
    .from("report_templates")
    .update({ is_default: true } as never)
    .eq("id", templateId)
    .eq("organization_id", session.organization.id);

  if (error) {
    throw new Error("Unable to set default template.");
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "report",
    entityId: templateId,
    action: "report_template_updated",
    title: `Default report template set: ${existing.name}`,
    metadata: { templateId, name: existing.name, isDefault: true },
  });

  revalidatePath("/reports/templates");
  revalidatePath(`/reports/templates/${templateId}`);
  revalidatePath("/reports/new");
  revalidatePath("/activity");
  redirect(`/reports/templates/${templateId}`);
}
