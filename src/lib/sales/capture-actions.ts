"use server";

import { z } from "zod";
import { SALES_EMAIL } from "@/lib/company";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkPublicFormThrottle } from "@/lib/security/login-throttle";
import { requireTurnstileFromForm } from "@/lib/security/turnstile";
import { buildCalendlyLink, buildDiscoveryMeetLink } from "@/lib/sales/calendar";
import {
  defaultInboxForSource,
  defaultStageForSource,
} from "@/lib/sales/pipeline-stages";
import { resolvePlatformSalesOrganizationId } from "@/lib/sales/platform-org";
import { sendLeadNotificationEmail } from "@/lib/sales/notify";
import type { SalesInboxKey, SalesLeadSource } from "@/types/database";
import type { Database } from "@/types/database";

export type CaptureActionState = {
  error?: string;
  success?: boolean;
};

type CaptureInput = {
  source: SalesLeadSource;
  inboxKey?: SalesInboxKey;
  contactName: string;
  contactEmail: string;
  companyName?: string | null;
  companySize?: string | null;
  website?: string | null;
  industry?: string | null;
  employeeCount?: number | null;
  painPoints?: string | null;
  message?: string | null;
  mrrEstimate?: number | null;
  referralCode?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  scheduleDiscovery?: boolean;
};

async function persistInboundLead(input: CaptureInput): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> {
  const organizationId = await resolvePlatformSalesOrganizationId();
  if (!organizationId) {
    return { ok: false, error: `Lead capture is temporarily unavailable. Please email ${SALES_EMAIL}.` };
  }

  const inboxKey = input.inboxKey ?? defaultInboxForSource(input.source);
  const pipelineStage = defaultStageForSource(input.source);
  const bookingLink = input.scheduleDiscovery ? buildCalendlyLink(input.contactEmail, input.companyName ?? undefined) : null;
  const googleMeetUrl = input.scheduleDiscovery ? buildDiscoveryMeetLink(input.contactEmail) : null;

  const payload: Database["public"]["Tables"]["sales_leads"]["Insert"] = {
    organization_id: organizationId,
    pipeline_stage: pipelineStage,
    lead_source: input.source,
    inbox_key: inboxKey,
    contact_name: input.contactName,
    contact_email: input.contactEmail,
    company_name: input.companyName ?? null,
    company_size: input.companySize ?? null,
    website: input.website ?? null,
    industry: input.industry ?? null,
    employee_count: input.employeeCount ?? null,
    pain_points: input.painPoints ?? null,
    message: input.message ?? null,
    mrr_estimate: input.mrrEstimate ?? null,
    referral_code: input.referralCode ?? null,
    utm_source: input.utmSource ?? null,
    utm_medium: input.utmMedium ?? null,
    utm_campaign: input.utmCampaign ?? null,
    booking_link: bookingLink,
    calendly_event_url: bookingLink,
    google_meet_url: googleMeetUrl,
    last_contact_at: new Date().toISOString(),
  };

  const admin = createAdminClient();
  const { data, error } = await admin.from("sales_leads").insert(payload as never).select("id").single();

  if (error || !data) {
    console.error("[sales] Lead insert failed:", error?.message);
    return { ok: false, error: `Unable to save your submission. Please try again or email ${SALES_EMAIL}.` };
  }

  await admin.from("sales_lead_activities").insert({
    organization_id: organizationId,
    lead_id: data.id,
    activity_type: "outreach",
    subject: `Inbound ${input.source} submission`,
    body: input.message ?? input.painPoints ?? "Lead captured from public form.",
  } as never);

  await sendLeadNotificationEmail({
    inboxKey,
    source: input.source,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    companyName: input.companyName,
    message: input.message,
  });

  return { ok: true, leadId: data.id };
}

async function validatePublicSubmission(email: string, formData: FormData): Promise<CaptureActionState | null> {
  const turnstile = await requireTurnstileFromForm(formData);
  if (!turnstile.ok) {
    return { error: turnstile.error };
  }

  const throttle = checkPublicFormThrottle(email);
  if (!throttle.allowed) {
    return { error: `Too many submissions. Try again in ${throttle.retryAfterSeconds} seconds.` };
  }

  return null;
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required."),
  email: z.string().email("Enter a valid email address."),
  company: z.string().trim().optional(),
  message: z.string().trim().min(10, "Message must be at least 10 characters."),
});

const pilotSchema = z.object({
  name: z.string().trim().min(2, "Name is required."),
  email: z.string().email("Enter a valid email address."),
  company: z.string().trim().min(2, "Company name is required."),
  companySize: z.string().trim().optional(),
  website: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  employees: z.string().trim().optional(),
  painPoints: z.string().trim().min(10, "Tell us about your operations goals."),
  message: z.string().trim().optional(),
});

const demoSchema = z.object({
  name: z.string().trim().min(2, "Name is required."),
  email: z.string().email("Enter a valid email address."),
  company: z.string().trim().min(2, "Company name is required."),
  message: z.string().trim().optional(),
});

const newsletterSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  name: z.string().trim().optional(),
});

const referralSchema = z.object({
  name: z.string().trim().min(2, "Name is required."),
  email: z.string().email("Enter a valid email address."),
  company: z.string().trim().optional(),
  referralCode: z.string().trim().min(2, "Referral code is required."),
  message: z.string().trim().optional(),
});

export async function submitContactLead(_prev: CaptureActionState, formData: FormData): Promise<CaptureActionState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  const blocked = await validatePublicSubmission(parsed.data.email, formData);
  if (blocked) return blocked;

  const result = await persistInboundLead({
    source: "contact",
    inboxKey: "info",
    contactName: parsed.data.name,
    contactEmail: parsed.data.email,
    companyName: parsed.data.company ?? null,
    message: parsed.data.message,
  });

  return result.ok ? { success: true } : { error: result.error };
}

export async function submitPilotApplication(_prev: CaptureActionState, formData: FormData): Promise<CaptureActionState> {
  const parsed = pilotSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  const blocked = await validatePublicSubmission(parsed.data.email, formData);
  if (blocked) return blocked;

  const result = await persistInboundLead({
    source: "pilot",
    inboxKey: "sales",
    contactName: parsed.data.name,
    contactEmail: parsed.data.email,
    companyName: parsed.data.company,
    companySize: parsed.data.companySize ?? null,
    website: parsed.data.website ?? null,
    industry: parsed.data.industry ?? null,
    employeeCount: parsed.data.employees ? Number(parsed.data.employees) || null : null,
    painPoints: parsed.data.painPoints,
    message: parsed.data.message ?? null,
  });

  return result.ok ? { success: true } : { error: result.error };
}

export async function submitDemoRequest(_prev: CaptureActionState, formData: FormData): Promise<CaptureActionState> {
  const parsed = demoSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  const blocked = await validatePublicSubmission(parsed.data.email, formData);
  if (blocked) return blocked;

  const result = await persistInboundLead({
    source: "demo",
    inboxKey: "sales",
    contactName: parsed.data.name,
    contactEmail: parsed.data.email,
    companyName: parsed.data.company,
    message: parsed.data.message ?? null,
    scheduleDiscovery: true,
  });

  return result.ok ? { success: true } : { error: result.error };
}

export async function submitNewsletterSignup(_prev: CaptureActionState, formData: FormData): Promise<CaptureActionState> {
  const parsed = newsletterSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  const blocked = await validatePublicSubmission(parsed.data.email, formData);
  if (blocked) return blocked;

  const result = await persistInboundLead({
    source: "newsletter",
    inboxKey: "info",
    contactName: parsed.data.name?.trim() || "Newsletter subscriber",
    contactEmail: parsed.data.email,
  });

  return result.ok ? { success: true } : { error: result.error };
}

export async function submitReferralLead(_prev: CaptureActionState, formData: FormData): Promise<CaptureActionState> {
  const parsed = referralSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  const blocked = await validatePublicSubmission(parsed.data.email, formData);
  if (blocked) return blocked;

  const result = await persistInboundLead({
    source: "referral",
    inboxKey: "sales",
    contactName: parsed.data.name,
    contactEmail: parsed.data.email,
    companyName: parsed.data.company ?? null,
    message: parsed.data.message ?? null,
    referralCode: parsed.data.referralCode,
  });

  return result.ok ? { success: true } : { error: result.error };
}
