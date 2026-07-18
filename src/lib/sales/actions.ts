"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { GENERIC_ACTION_ERROR, requireModulePermissionSafe } from "@/lib/action-errors";
import { requireSession } from "@/lib/auth/session";
import { getStoredOrganizationCurrency } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import type { SalesLeadSource, SalesPipelineStage, ProspectSegment, LeadSourceRegion, AgencyType } from "@/types/database";
import { PIPELINE_STAGES, LEAD_SOURCES, type SalesActivityTypeKey } from "@/lib/sales/pipeline-stages";
import { enrichLeadScores } from "@/lib/sales/enrichment";
import { nextCadenceDueAt, shouldEscalate, shouldFlagNoResponse } from "@/lib/sales/automation";
import { computeCustomerSuccessScores, CUSTOMER_SUCCESS_MILESTONES_TOTAL } from "@/lib/sales/customer-success";
import { buildProposalFromLead } from "@/lib/sales/proposal-generator";
import {
  computeOnboardingHealthScore,
  ONBOARDING_CHECKLIST_TOTAL,
} from "@/lib/sales/customer-onboarding";
import { TOP100_AGENCIES } from "@/lib/sales/top100-agencies";
import { defaultInboxForSource, defaultStageForSource } from "@/lib/sales/pipeline-stages";

export type SalesActionState = {
  error?: string;
  success?: boolean;
  leadId?: string;
};

const stageValues = PIPELINE_STAGES.map((stage) => stage.key) as [SalesPipelineStage, ...SalesPipelineStage[]];

const updateLeadSchema = z.object({
  leadId: z.string().uuid(),
  pipelineStage: z.enum(stageValues).optional(),
  ownerUserId: z.string().uuid().nullable().optional(),
  mrrEstimate: z.string().optional(),
  leadValue: z.string().optional(),
  nextFollowupAt: z.string().optional(),
  notes: z.string().optional(),
  companySize: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  painPoints: z.string().optional(),
  linkedinUrl: z.string().optional(),
  location: z.string().optional(),
  employeeCount: z.string().optional(),
  prospectSegment: z.string().optional(),
  outboundListId: z.string().uuid().nullable().optional(),
  sourceRegion: z.string().optional(),
  agencyType: z.string().optional(),
});

const sourceValues = LEAD_SOURCES.map((source) => source.key) as [SalesLeadSource, ...SalesLeadSource[]];

const createLeadSchema = z
  .object({
    companyName: z.string().trim().min(1, "Company name is required."),
    contactName: z.string().trim().min(1, "Contact name is required."),
    contactEmail: z.string().trim().email("Enter a valid email address.").or(z.literal("")),
    website: z.string().trim().optional(),
    companySize: z.string().trim().optional(),
    country: z.string().trim().optional(),
    leadSource: z.enum(sourceValues),
    pipelineStage: z.enum(stageValues).optional(),
    notes: z.string().trim().optional(),
    mrrEstimate: z.string().optional(),
    leadValue: z.string().optional(),
    ownerUserId: z.string().uuid().nullable().optional(),
  })
  .refine((data) => data.contactEmail.length > 0, {
    message: "Contact email is required.",
    path: ["contactEmail"],
  });

const noteSchema = z.object({
  leadId: z.string().uuid(),
  subject: z.string().trim().min(2),
  body: z.string().trim().min(2),
});

const activitySchema = z.object({
  leadId: z.string().uuid(),
  activityType: z.enum(["note", "email", "call", "meeting", "outreach", "status_change"] as const),
  subject: z.string().trim().min(2),
  body: z.string().trim().optional(),
  dueAt: z.string().optional(),
});

const changeStageSchema = z.object({
  leadId: z.string().uuid(),
  pipelineStage: z.enum(stageValues),
});

function parseOptionalNumber(value?: string): number | null {
  if (!value || value.trim().length === 0) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function updateSalesLead(_prev: SalesActionState, formData: FormData): Promise<SalesActionState> {
  const session = await requireSession();
  const permError = requireModulePermissionSafe(session.role, "sales", "update");
  if (permError) return permError;

  const parsed = updateLeadSchema.safeParse({
    leadId: formData.get("leadId"),
    pipelineStage: formData.get("pipelineStage") || undefined,
    ownerUserId: formData.get("ownerUserId") === "" ? null : formData.get("ownerUserId") || undefined,
    mrrEstimate: formData.get("mrrEstimate")?.toString(),
    leadValue: formData.get("leadValue")?.toString(),
    nextFollowupAt: formData.get("nextFollowupAt")?.toString(),
    notes: formData.get("notes")?.toString(),
    companySize: formData.get("companySize")?.toString(),
    website: formData.get("website")?.toString(),
    industry: formData.get("industry")?.toString(),
    painPoints: formData.get("painPoints")?.toString(),
    linkedinUrl: formData.get("linkedinUrl")?.toString(),
    location: formData.get("location")?.toString(),
    employeeCount: formData.get("employeeCount")?.toString(),
    prospectSegment: formData.get("prospectSegment")?.toString(),
    outboundListId: formData.get("outboundListId") === "" ? null : formData.get("outboundListId") || undefined,
    sourceRegion: formData.get("sourceRegion")?.toString(),
    agencyType: formData.get("agencyType")?.toString(),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid lead data." };
  }

  const supabase = await createClient();
  const enrichmentInput = {
    website: parsed.data.website ?? null,
    linkedin_url: parsed.data.linkedinUrl ?? null,
    employee_count: parseOptionalNumber(parsed.data.employeeCount),
    location: parsed.data.location ?? null,
    industry: parsed.data.industry ?? null,
    pain_points: parsed.data.painPoints ?? null,
    company_size: parsed.data.companySize ?? null,
    mrr_estimate: parseOptionalNumber(parsed.data.mrrEstimate),
    lead_value: parseOptionalNumber(parsed.data.leadValue),
  };
  const scores = enrichLeadScores(enrichmentInput);

  const { error } = await supabase
    .from("sales_leads")
    .update({
      pipeline_stage: parsed.data.pipelineStage,
      owner_user_id: parsed.data.ownerUserId,
      mrr_estimate: parseOptionalNumber(parsed.data.mrrEstimate) ?? scores.potential_mrr,
      lead_value: parseOptionalNumber(parsed.data.leadValue),
      next_followup_at: parsed.data.nextFollowupAt || null,
      notes: parsed.data.notes ?? undefined,
      company_size: parsed.data.companySize ?? undefined,
      website: parsed.data.website ?? undefined,
      industry: parsed.data.industry ?? undefined,
      pain_points: parsed.data.painPoints ?? undefined,
      linkedin_url: parsed.data.linkedinUrl ?? undefined,
      location: parsed.data.location ?? undefined,
      employee_count: parseOptionalNumber(parsed.data.employeeCount),
      prospect_segment: (parsed.data.prospectSegment as ProspectSegment) || undefined,
      outbound_list_id: parsed.data.outboundListId,
      source_region: (parsed.data.sourceRegion as LeadSourceRegion) || undefined,
      agency_type: (parsed.data.agencyType as AgencyType) || undefined,
      potential_mrr: scores.potential_mrr,
      arr_estimate: scores.arr_estimate,
      pain_score: scores.pain_score,
      fit_score: scores.fit_score,
      priority_score: scores.priority_score,
      last_contact_at: new Date().toISOString(),
    } as never)
    .eq("id", parsed.data.leadId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: GENERIC_ACTION_ERROR };
  }

  if (parsed.data.pipelineStage) {
    await supabase.from("sales_lead_activities").insert({
      organization_id: session.organization.id,
      lead_id: parsed.data.leadId,
      activity_type: "status_change",
      subject: "Pipeline stage updated",
      body: `Stage changed to ${parsed.data.pipelineStage}.`,
      created_by_user_id: session.user.id,
    } as never);
  }

  revalidatePath("/sales");
  revalidatePath("/sales/acquisition");
  revalidatePath("/sales/sourcing");
  revalidatePath("/sales/outbound");
  revalidatePath(`/sales/leads/${parsed.data.leadId}`);
  return { success: true };
}

export async function scheduleLeadFollowup(_prev: SalesActionState, formData: FormData): Promise<SalesActionState> {
  const session = await requireSession();
  const permError = requireModulePermissionSafe(session.role, "sales", "update");
  if (permError) return permError;

  const leadId = formData.get("leadId")?.toString();
  const subject = formData.get("subject")?.toString() ?? "Follow-up reminder";
  if (!leadId) {
    return { error: "Lead is required." };
  }

  const supabase = await createClient();
  const { data: lead } = await supabase
    .from("sales_leads")
    .select("outreach_sequence_step")
    .eq("id", leadId)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  const step = (lead as { outreach_sequence_step: number } | null)?.outreach_sequence_step ?? 0;
  const dueAt = nextCadenceDueAt(step);

  const { error } = await supabase.from("sales_lead_reminders").insert({
    organization_id: session.organization.id,
    lead_id: leadId,
    reminder_type: "cadence",
    subject,
    due_at: dueAt,
  } as never);

  if (error) {
    return { error: GENERIC_ACTION_ERROR };
  }

  await supabase
    .from("sales_leads")
    .update({
      outreach_sequence_step: step + 1,
      next_followup_at: dueAt,
      last_outreach_at: new Date().toISOString(),
    } as never)
    .eq("id", leadId)
    .eq("organization_id", session.organization.id);

  revalidatePath("/sales");
  revalidatePath("/sales/acquisition");
  revalidatePath(`/sales/leads/${leadId}`);
  return { success: true };
}

export async function runLeadAutomationScan(): Promise<void> {
  const session = await requireSession();
  const permError = requireModulePermissionSafe(session.role, "sales", "manage");
  if (permError) {
    return;
  }

  const supabase = await createClient();
  const { data: leads, error } = await supabase
    .from("sales_leads")
    .select("id, last_outreach_at, last_contact_at, next_followup_at, no_response_flag, escalated_at, created_at")
    .eq("organization_id", session.organization.id);

  if (error) {
    return;
  }

  for (const lead of (leads ?? []) as Array<{
    id: string;
    last_outreach_at: string | null;
    last_contact_at: string | null;
    next_followup_at: string | null;
    no_response_flag: boolean;
    escalated_at: string | null;
    created_at: string;
  }>) {
    const updates: Record<string, unknown> = {};
    if (shouldFlagNoResponse(lead)) {
      updates.no_response_flag = true;
    }
    if (shouldEscalate(lead)) {
      updates.escalated_at = new Date().toISOString();
    }
    if (Object.keys(updates).length > 0) {
      await supabase
        .from("sales_leads")
        .update(updates as never)
        .eq("id", lead.id)
        .eq("organization_id", session.organization.id);
    }
  }

  revalidatePath("/sales/acquisition");
  revalidatePath("/sales/outbound");
}

export async function updateCustomerSuccessForm(formData: FormData): Promise<void> {
  await updateCustomerSuccess({}, formData);
}

export async function updateCustomerSuccess(
  _prev: SalesActionState,
  formData: FormData,
): Promise<SalesActionState> {
  const session = await requireSession();
  const permError = requireModulePermissionSafe(session.role, "sales", "update");
  if (permError) return permError;

  const recordId = formData.get("recordId")?.toString();
  const milestonesCompleted = Number(formData.get("milestonesCompleted") ?? 0);
  const onboardingComplete = formData.get("onboardingComplete") === "on";

  if (!recordId) {
    return { error: "Record is required." };
  }

  const scores = computeCustomerSuccessScores(
    Math.min(CUSTOMER_SUCCESS_MILESTONES_TOTAL, Math.max(0, milestonesCompleted)),
    onboardingComplete,
  );

  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_success_records")
    .update({
      milestones_completed: milestonesCompleted,
      onboarding_complete: onboardingComplete,
      ...scores,
    } as never)
    .eq("id", recordId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/sales/success");
  return { success: true };
}

export async function addSalesLeadNote(_prev: SalesActionState, formData: FormData): Promise<SalesActionState> {
  const session = await requireSession();
  const permError = requireModulePermissionSafe(session.role, "sales", "update");
  if (permError) return permError;

  const parsed = noteSchema.safeParse({
    leadId: formData.get("leadId"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid note." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("sales_lead_activities").insert({
    organization_id: session.organization.id,
    lead_id: parsed.data.leadId,
    activity_type: "note",
    subject: parsed.data.subject,
    body: parsed.data.body,
    created_by_user_id: session.user.id,
  } as never);

  if (error) {
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath(`/sales/leads/${parsed.data.leadId}`);
  return { success: true };
}

export async function createSalesLead(_prev: SalesActionState, formData: FormData): Promise<SalesActionState> {
  const session = await requireSession();
  const permError = requireModulePermissionSafe(session.role, "sales", "create");
  if (permError) return permError;

  const parsed = createLeadSchema.safeParse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    website: formData.get("website")?.toString(),
    companySize: formData.get("companySize")?.toString(),
    country: formData.get("country")?.toString(),
    leadSource: formData.get("leadSource"),
    pipelineStage: formData.get("pipelineStage") || undefined,
    notes: formData.get("notes")?.toString(),
    mrrEstimate: formData.get("mrrEstimate")?.toString(),
    leadValue: formData.get("leadValue")?.toString(),
    ownerUserId: formData.get("ownerUserId") === "" ? null : formData.get("ownerUserId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid lead data." };
  }

  const supabase = await createClient();
  const stage = parsed.data.pipelineStage ?? defaultStageForSource(parsed.data.leadSource);
  const enrichmentInput = {
    website: parsed.data.website ?? null,
    linkedin_url: null,
    employee_count: null,
    location: parsed.data.country ?? null,
    industry: null,
    pain_points: null,
    company_size: parsed.data.companySize ?? null,
    mrr_estimate: parseOptionalNumber(parsed.data.mrrEstimate),
    lead_value: parseOptionalNumber(parsed.data.leadValue),
  };
  const scores = enrichLeadScores(enrichmentInput);

  const { data, error } = await supabase
    .from("sales_leads")
    .insert({
      organization_id: session.organization.id,
      pipeline_stage: stage,
      lead_source: parsed.data.leadSource,
      inbox_key: defaultInboxForSource(parsed.data.leadSource),
      contact_name: parsed.data.contactName,
      contact_email: parsed.data.contactEmail,
      company_name: parsed.data.companyName,
      company_size: parsed.data.companySize ?? null,
      website: parsed.data.website ?? null,
      location: parsed.data.country ?? null,
      notes: parsed.data.notes ?? null,
      mrr_estimate: parseOptionalNumber(parsed.data.mrrEstimate) ?? scores.potential_mrr,
      lead_value: parseOptionalNumber(parsed.data.leadValue),
      owner_user_id: parsed.data.ownerUserId ?? session.user.id,
      potential_mrr: scores.potential_mrr,
      arr_estimate: scores.arr_estimate,
      pain_score: scores.pain_score,
      fit_score: scores.fit_score,
      priority_score: scores.priority_score,
      last_contact_at: new Date().toISOString(),
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    return { error: GENERIC_ACTION_ERROR };
  }

  const leadId = (data as { id: string }).id;

  await supabase.from("sales_lead_activities").insert({
    organization_id: session.organization.id,
    lead_id: leadId,
    activity_type: "note",
    subject: "Lead created",
    body: `Lead manually added to pipeline at ${stage}.`,
    created_by_user_id: session.user.id,
  } as never);

  revalidatePath("/sales");
  revalidatePath("/sales/leads");
  return { success: true, leadId };
}

export async function changeLeadStage(_prev: SalesActionState, formData: FormData): Promise<SalesActionState> {
  const session = await requireSession();
  const permError = requireModulePermissionSafe(session.role, "sales", "update");
  if (permError) return permError;

  const parsed = changeStageSchema.safeParse({
    leadId: formData.get("leadId"),
    pipelineStage: formData.get("pipelineStage"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid stage." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sales_leads")
    .update({
      pipeline_stage: parsed.data.pipelineStage,
      last_contact_at: new Date().toISOString(),
    } as never)
    .eq("id", parsed.data.leadId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: GENERIC_ACTION_ERROR };
  }

  await supabase.from("sales_lead_activities").insert({
    organization_id: session.organization.id,
    lead_id: parsed.data.leadId,
    activity_type: "status_change",
    subject: "Stage changed",
    body: `Pipeline stage updated to ${parsed.data.pipelineStage}.`,
    created_by_user_id: session.user.id,
  } as never);

  revalidatePath("/sales");
  revalidatePath("/sales/leads");
  revalidatePath(`/sales/leads/${parsed.data.leadId}`);
  return { success: true };
}

export async function addSalesLeadActivity(
  _prev: SalesActionState,
  formData: FormData,
): Promise<SalesActionState> {
  const session = await requireSession();
  const permError = requireModulePermissionSafe(session.role, "sales", "update");
  if (permError) return permError;

  const parsed = activitySchema.safeParse({
    leadId: formData.get("leadId"),
    activityType: formData.get("activityType"),
    subject: formData.get("subject"),
    body: formData.get("body")?.toString(),
    dueAt: formData.get("dueAt")?.toString(),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid activity." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("sales_lead_activities").insert({
    organization_id: session.organization.id,
    lead_id: parsed.data.leadId,
    activity_type: parsed.data.activityType,
    subject: parsed.data.subject,
    body: parsed.data.body ?? null,
    created_by_user_id: session.user.id,
  } as never);

  if (error) {
    return { error: GENERIC_ACTION_ERROR };
  }

  if (parsed.data.dueAt) {
    await supabase.from("sales_lead_reminders").insert({
      organization_id: session.organization.id,
      lead_id: parsed.data.leadId,
      reminder_type: "followup",
      subject: parsed.data.subject,
      due_at: parsed.data.dueAt,
    } as never);

    await supabase
      .from("sales_leads")
      .update({ next_followup_at: parsed.data.dueAt } as never)
      .eq("id", parsed.data.leadId)
      .eq("organization_id", session.organization.id);
  }

  await supabase
    .from("sales_leads")
    .update({ last_contact_at: new Date().toISOString() } as never)
    .eq("id", parsed.data.leadId)
    .eq("organization_id", session.organization.id);

  revalidatePath("/sales");
  revalidatePath(`/sales/leads/${parsed.data.leadId}`);
  return { success: true };
}

export async function completeLeadReminder(
  _prev: SalesActionState,
  formData: FormData,
): Promise<SalesActionState> {
  const session = await requireSession();
  const permError = requireModulePermissionSafe(session.role, "sales", "update");
  if (permError) return permError;

  const reminderId = formData.get("reminderId")?.toString();
  const leadId = formData.get("leadId")?.toString();
  if (!reminderId || !leadId) {
    return { error: "Reminder and lead are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sales_lead_reminders")
    .update({ completed_at: new Date().toISOString() } as never)
    .eq("id", reminderId)
    .eq("organization_id", session.organization.id)
    .eq("lead_id", leadId);

  if (error) {
    return { error: GENERIC_ACTION_ERROR };
  }

  revalidatePath("/sales");
  revalidatePath(`/sales/leads/${leadId}`);
  return { success: true };
}

export async function archiveSalesLead(_prev: SalesActionState, formData: FormData): Promise<SalesActionState> {
  const session = await requireSession();
  const permError = requireModulePermissionSafe(session.role, "sales", "update");
  if (permError) return permError;

  const leadId = formData.get("leadId")?.toString();
  if (!leadId) {
    return { error: "Lead is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sales_leads")
    .update({ pipeline_stage: "lost" } as never)
    .eq("id", leadId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: GENERIC_ACTION_ERROR };
  }

  await supabase.from("sales_lead_activities").insert({
    organization_id: session.organization.id,
    lead_id: leadId,
    activity_type: "status_change",
    subject: "Lead archived",
    body: "Lead moved to Lost.",
    created_by_user_id: session.user.id,
  } as never);

  revalidatePath("/sales");
  revalidatePath("/sales/leads");
  revalidatePath(`/sales/leads/${leadId}`);
  return { success: true };
}

export async function enrollFoundingCustomer(_prev: SalesActionState, formData: FormData): Promise<SalesActionState> {
  const session = await requireSession();
  const permError = requireModulePermissionSafe(session.role, "sales", "manage");
  if (permError) return permError;

  const leadId = formData.get("leadId")?.toString();
  if (!leadId) {
    return { error: "Lead is required." };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("founding_program_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organization.id);

  if ((count ?? 0) >= 10) {
    return { error: "Founding program is full (10/10 slots)." };
  }

  const slotNumber = (count ?? 0) + 1;
  const { error: enrollError } = await supabase.from("founding_program_enrollments").insert({
    organization_id: session.organization.id,
    lead_id: leadId,
    slot_number: slotNumber,
  } as never);

  if (enrollError) {
    return { error: enrollError.message };
  }

  await supabase
    .from("sales_leads")
    .update({
      is_founding_customer: true,
      founding_discount_percent: 50,
      pipeline_stage: "won",
    } as never)
    .eq("id", leadId)
    .eq("organization_id", session.organization.id);

  revalidatePath("/sales");
  revalidatePath(`/sales/leads/${leadId}`);
  return { success: true };
}

export async function createSalesProposal(_prev: SalesActionState, formData: FormData): Promise<SalesActionState> {
  const session = await requireSession();
  const permError = requireModulePermissionSafe(session.role, "sales", "update");
  if (permError) return permError;

  const leadId = formData.get("leadId")?.toString();
  if (!leadId) return { error: "Lead is required." };

  const supabase = await createClient();
  const { data: lead } = await supabase
    .from("sales_leads")
    .select("contact_name, company_name, pain_points, potential_mrr, mrr_estimate, employee_count")
    .eq("id", leadId)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  if (!lead) return { error: "Lead not found." };

  const content = buildProposalFromLead(
    lead as never,
    getStoredOrganizationCurrency(session.organization),
  );
  const { error } = await supabase
    .from("sales_proposals")
    .insert({
      organization_id: session.organization.id,
      lead_id: leadId,
      title: content.title,
      pilot_agreement: content.pilotAgreement,
      pricing_proposal: content.pricingProposal,
      roi_estimate: content.roiEstimate,
      timeline: content.timeline,
      implementation_plan: content.implementationPlan,
      mrr_proposed: content.mrrProposed,
      arr_proposed: content.arrProposed,
    } as never);

  if (error) return { error: error.message };

  revalidatePath("/sales/proposals");
  revalidatePath(`/sales/leads/${leadId}`);
  return { success: true };
}

export async function updateCustomerOnboardingForm(formData: FormData): Promise<void> {
  await updateCustomerOnboarding({}, formData);
}

export async function updateCustomerOnboarding(
  _prev: SalesActionState,
  formData: FormData,
): Promise<SalesActionState> {
  const session = await requireSession();
  const permError = requireModulePermissionSafe(session.role, "sales", "update");
  if (permError) return permError;

  const recordId = formData.get("recordId")?.toString();
  const checklistCompleted = Number(formData.get("checklistCompleted") ?? 0);
  const workspaceCreated = formData.get("workspaceCreated") === "on";
  const teamInvited = formData.get("teamInvited") === "on";
  const integrationsConnected = formData.get("integrationsConnected") === "on";
  const diagnosticsBaseline = formData.get("diagnosticsBaseline") === "on";

  if (!recordId) return { error: "Record is required." };

  const completed = Math.min(ONBOARDING_CHECKLIST_TOTAL, Math.max(0, checklistCompleted));
  const healthScore = computeOnboardingHealthScore(completed, workspaceCreated, diagnosticsBaseline);
  const status = completed >= ONBOARDING_CHECKLIST_TOTAL ? "complete" : "in_progress";

  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_onboarding_records")
    .update({
      checklist_completed: completed,
      workspace_created: workspaceCreated,
      team_invited: teamInvited,
      integrations_connected: integrationsConnected,
      diagnostics_baseline: diagnosticsBaseline,
      health_baseline_score: healthScore,
      status,
      kickoff_completed_at: completed > 0 ? new Date().toISOString() : null,
    } as never)
    .eq("id", recordId)
    .eq("organization_id", session.organization.id);

  if (error) return { error: error.message };

  revalidatePath("/sales/onboarding");
  return { success: true };
}

export async function startCustomerOnboarding(_prev: SalesActionState, formData: FormData): Promise<SalesActionState> {
  const session = await requireSession();
  const permError = requireModulePermissionSafe(session.role, "sales", "manage");
  if (permError) return permError;

  const leadId = formData.get("leadId")?.toString();
  if (!leadId) return { error: "Lead is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("customer_onboarding_records").insert({
    organization_id: session.organization.id,
    lead_id: leadId,
    kickoff_scheduled_at: new Date().toISOString(),
    checklist_total: ONBOARDING_CHECKLIST_TOTAL,
  } as never);

  if (error) return { error: error.message };

  revalidatePath("/sales/onboarding");
  revalidatePath(`/sales/leads/${leadId}`);
  return { success: true };
}

export async function seedTop100Agencies(): Promise<void> {
  await seedTop100AgenciesAction();
}

export async function seedTop100AgenciesAction(
  _prev: SalesActionState = {},
): Promise<SalesActionState> {
  const session = await requireSession();
  const permError = requireModulePermissionSafe(session.role, "sales", "manage");
  if (permError) return permError;

  const supabase = await createClient();
  const orgId = session.organization.id;

  const { count } = await supabase
    .from("sales_leads")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .not("source_region", "is", null);

  if ((count ?? 0) >= TOP100_AGENCIES.length) {
    return { success: true };
  }

  const payload = TOP100_AGENCIES.map((agency) => ({
    organization_id: orgId,
    pipeline_stage: defaultStageForSource("other"),
    lead_source: "other" as const,
    inbox_key: defaultInboxForSource("other"),
    contact_name: agency.contact_name,
    contact_email: agency.contact_email,
    company_name: agency.company_name,
    website: agency.website,
    industry: agency.industry,
    location: agency.location,
    employee_count: agency.employee_count,
    pain_points: agency.pain_points,
    source_region: agency.source_region,
    agency_type: agency.agency_type,
    priority_score: agency.priority_score,
    last_contact_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("sales_leads").insert(payload as never);
  if (error) return { error: error.message };

  revalidatePath("/sales/launch");
  revalidatePath("/sales/sourcing");
  revalidatePath("/sales/execution");
  return { success: true };
}
