import "server-only";

import { getPlatformNoReplySender } from "@/lib/email/addresses";
import { sendEmail } from "@/lib/email/provider";
import { getCanonicalUrl } from "@/lib/company/company-seo";
import { recordConsent } from "@/lib/compliance/consent";
import { MARKETING_CONSENT_TYPE } from "@/lib/marketing/marketing-consent";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlatformSalesOrganizationId } from "@/lib/sales/platform-org";
import { buildNewsletterConfirmationEmail, buildNewsletterIssueEmail } from "@/lib/newsletter/emails";
import {
  createNewsletterToken,
  normalizeNewsletterEmail,
  verifyNewsletterToken,
} from "@/lib/newsletter/tokens";

/**
 * Newsletter: double opt-in, unsubscribe and sending.
 *
 * - Every newsletter email is sent FROM noreply@auroranexis.com (never info@).
 * - Signup stores a marketing consent (capture-actions). The address only receives newsletters
 *   after it confirmed via the emailed link (double opt-in), recorded in `consent_records`
 *   as `newsletter_double_opt_in`.
 * - Unsubscribing records a withdrawn `marketing_email` consent; it wins over any earlier opt-in.
 */

export const NEWSLETTER_DOI_CONSENT_TYPE = "newsletter_double_opt_in";
export const NEWSLETTER_CONFIRMATION_SENT_SUBJECT = "Newsletter confirmation email sent";
export const NEWSLETTER_CONFIRM_PATH = "/newsletter/confirm";
export const NEWSLETTER_UNSUBSCRIBE_PATH = "/newsletter/unsubscribe";
export const NEWSLETTER_ONE_CLICK_PATH = "/api/newsletter/unsubscribe";

/** The only sender newsletters may use. */
export function getNewsletterSender(): string {
  return getPlatformNoReplySender("Auroranexis");
}

export function buildNewsletterConfirmUrl(email: string): string {
  const url = getCanonicalUrl(NEWSLETTER_CONFIRM_PATH);
  url.searchParams.set("token", createNewsletterToken("confirm", email));
  return url.toString();
}

export function buildNewsletterUnsubscribeUrl(email: string, path = NEWSLETTER_UNSUBSCRIBE_PATH): string {
  const url = getCanonicalUrl(path);
  url.searchParams.set("token", createNewsletterToken("unsubscribe", email));
  return url.toString();
}

/** Send the double opt-in email and log it on the lead. Never throws. */
export async function sendNewsletterConfirmation(input: {
  email: string;
  leadId?: string | null;
}): Promise<boolean> {
  try {
    const content = buildNewsletterConfirmationEmail(buildNewsletterConfirmUrl(input.email));
    const result = await sendEmail({
      from: getNewsletterSender(),
      to: input.email,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
    if (!result.success) {
      console.error("[newsletter] confirmation email failed:", result.error ?? "unknown error");
      return false;
    }

    if (input.leadId) {
      const organizationId = await resolvePlatformSalesOrganizationId();
      if (organizationId) {
        const admin = createAdminClient();
        const { error } = await admin.from("sales_lead_activities").insert({
          organization_id: organizationId,
          lead_id: input.leadId,
          activity_type: "email",
          subject: NEWSLETTER_CONFIRMATION_SENT_SUBJECT,
          body: "Double opt-in email sent from noreply@auroranexis.com.",
        } as never);
        if (error) console.error("[newsletter] confirmation activity insert failed:", error.message);
      }
    }
    return true;
  } catch (error) {
    console.error(
      "[newsletter] confirmation email error:",
      error instanceof Error ? error.message : "unknown error",
    );
    return false;
  }
}

type ConsentRow = { subject_email: string; consent_type: string; granted: boolean; recorded_at: string };

async function loadNewsletterConsents(
  organizationId: string,
  email?: string,
): Promise<ConsentRow[]> {
  const admin = createAdminClient();
  let query = admin
    .from("consent_records")
    .select("subject_email, consent_type, granted, recorded_at")
    .eq("organization_id", organizationId)
    .in("consent_type", [NEWSLETTER_DOI_CONSENT_TYPE, MARKETING_CONSENT_TYPE])
    .order("recorded_at", { ascending: true })
    .limit(10000);
  if (email) query = query.ilike("subject_email", normalizeNewsletterEmail(email));
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ConsentRow[];
}

/**
 * Confirmed = has a double opt-in record, and no marketing withdrawal recorded after it.
 * Pure function so the rule is testable.
 */
export function resolveConfirmedSubscribers(rows: readonly ConsentRow[]): string[] {
  const state = new Map<string, { confirmedAt: string | null; withdrawnAt: string | null }>();
  for (const row of rows) {
    const email = normalizeNewsletterEmail(row.subject_email);
    const entry = state.get(email) ?? { confirmedAt: null, withdrawnAt: null };
    if (row.consent_type === NEWSLETTER_DOI_CONSENT_TYPE && row.granted) {
      if (!entry.confirmedAt || row.recorded_at > entry.confirmedAt) entry.confirmedAt = row.recorded_at;
    }
    if (row.consent_type === MARKETING_CONSENT_TYPE && !row.granted) {
      if (!entry.withdrawnAt || row.recorded_at > entry.withdrawnAt) entry.withdrawnAt = row.recorded_at;
    }
    state.set(email, entry);
  }
  return [...state.entries()]
    .filter(([, s]) => s.confirmedAt && (!s.withdrawnAt || s.withdrawnAt < s.confirmedAt))
    .map(([email]) => email)
    .sort();
}

export type NewsletterLinkResult = "ok" | "invalid";

export async function confirmNewsletterSubscription(token: string): Promise<NewsletterLinkResult> {
  const email = verifyNewsletterToken("confirm", token);
  if (!email) return "invalid";
  const organizationId = await resolvePlatformSalesOrganizationId();
  if (!organizationId) throw new Error("Platform organization is not configured.");

  const existing = await loadNewsletterConsents(organizationId, email);
  if (resolveConfirmedSubscribers(existing).includes(email)) return "ok";

  await recordConsent({
    organizationId,
    subjectEmail: email,
    consentType: NEWSLETTER_DOI_CONSENT_TYPE,
    granted: true,
    subjectType: "marketing_lead",
    metadata: { method: "email_link", confirmed_at: new Date().toISOString() },
  });
  return "ok";
}

export async function unsubscribeNewsletter(
  token: string,
  channel: "page" | "one_click",
): Promise<NewsletterLinkResult> {
  const email = verifyNewsletterToken("unsubscribe", token);
  if (!email) return "invalid";
  const organizationId = await resolvePlatformSalesOrganizationId();
  if (!organizationId) throw new Error("Platform organization is not configured.");

  await recordConsent({
    organizationId,
    subjectEmail: email,
    consentType: MARKETING_CONSENT_TYPE,
    granted: false,
    subjectType: "marketing_lead",
    metadata: { source: "newsletter_unsubscribe", channel },
  });
  return "ok";
}

export async function listConfirmedNewsletterSubscribers(): Promise<string[]> {
  const organizationId = await resolvePlatformSalesOrganizationId();
  if (!organizationId) return [];
  return resolveConfirmedSubscribers(await loadNewsletterConsents(organizationId));
}

export type NewsletterSendSummary = {
  mode: "preview" | "test" | "send";
  recipients: number;
  sent: number;
  failed: number;
};

/**
 * Send one newsletter issue to confirmed subscribers (or only to `testTo`).
 * Sequential with a short pause so the SMTP account is not rate-limited.
 */
export async function sendNewsletterIssue(input: {
  subject: string;
  bodyText: string;
  mode: "preview" | "test" | "send";
  testTo?: string;
}): Promise<NewsletterSendSummary> {
  const recipients =
    input.mode === "test" ? (input.testTo ? [input.testTo] : []) : await listConfirmedNewsletterSubscribers();
  if (input.mode === "preview") {
    return { mode: "preview", recipients: recipients.length, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  for (const email of recipients) {
    const unsubscribeUrl = buildNewsletterUnsubscribeUrl(email);
    const oneClickUrl = buildNewsletterUnsubscribeUrl(email, NEWSLETTER_ONE_CLICK_PATH);
    const content = buildNewsletterIssueEmail({
      subject: input.subject,
      bodyText: input.bodyText,
      unsubscribeUrl,
    });
    const result = await sendEmail({
      from: getNewsletterSender(),
      to: email,
      subject: content.subject,
      html: content.html,
      text: content.text,
      headers: {
        "List-Unsubscribe": `<${oneClickUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (result.success) sent += 1;
    else failed += 1;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return { mode: input.mode, recipients: recipients.length, sent, failed };
}

/**
 * Hourly safety net: newsletter signups of the last 30 days that never got a confirmation email
 * (e.g. signed up before double opt-in existed, or the send failed) get one now. At most once per
 * lead, because the send is logged on the lead.
 */
export async function runNewsletterConfirmationBackfill(now: Date = new Date()): Promise<{
  status: "skipped" | "completed";
  sent?: number;
}> {
  if (now.getUTCMinutes() > 4) return { status: "skipped" };
  const organizationId = await resolvePlatformSalesOrganizationId();
  if (!organizationId) return { status: "skipped" };

  const admin = createAdminClient();
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: leads, error } = await admin
    .from("sales_leads")
    .select("id, contact_email")
    .eq("organization_id", organizationId)
    .eq("lead_source", "newsletter")
    .gte("created_at", since)
    .limit(200);
  if (error || !leads?.length) return { status: "completed", sent: 0 };

  const leadRows = leads as Array<{ id: string; contact_email: string | null }>;
  const { data: activities } = await admin
    .from("sales_lead_activities")
    .select("lead_id")
    .in(
      "lead_id",
      leadRows.map((lead) => lead.id),
    )
    .eq("subject", NEWSLETTER_CONFIRMATION_SENT_SUBJECT);
  const alreadySent = new Set(((activities ?? []) as Array<{ lead_id: string }>).map((a) => a.lead_id));

  const consents = await loadNewsletterConsents(organizationId);
  const confirmed = new Set(resolveConfirmedSubscribers(consents));
  const withdrawn = new Set(
    consents
      .filter((row) => row.consent_type === MARKETING_CONSENT_TYPE && !row.granted)
      .map((row) => normalizeNewsletterEmail(row.subject_email)),
  );

  let sent = 0;
  const handledEmails = new Set<string>();
  for (const lead of leadRows) {
    const email = lead.contact_email ? normalizeNewsletterEmail(lead.contact_email) : null;
    if (!email || handledEmails.has(email)) continue;
    handledEmails.add(email);
    if (alreadySent.has(lead.id) || confirmed.has(email) || withdrawn.has(email)) continue;
    if (await sendNewsletterConfirmation({ email, leadId: lead.id })) sent += 1;
  }
  return { status: "completed", sent };
}
