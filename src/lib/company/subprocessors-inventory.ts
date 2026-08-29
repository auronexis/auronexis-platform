/**
 * Factual sub-processor / service-provider inventory for Art. 28 disclosure.
 * Derived from production architecture — no invented certifications or regions.
 *
 * Versioning: bump SUBPROCESSORS_DOCUMENT_VERSION when the published list changes.
 * Change procedure: docs/billing/subprocessor-change-procedure.md
 */

import { COMPANY_CONTACT } from "@/lib/company/company-contact";

export const SUBPROCESSORS_DOCUMENT_VERSION = "subprocessors-2026-08-29-v1" as const;
export const SUBPROCESSORS_EFFECTIVE_DATE = "2026-08-29" as const;

export type SubprocessorRole =
  | "PROCESSOR"
  | "PSP_INDEPENDENT"
  | "CONDITIONAL_PROCESSOR"
  | "OPTIONAL_ANALYTICS";

export type SubprocessorEntry = {
  provider: string;
  purpose: string;
  /** Region wording only when known from configuration — never invent DCs. */
  locationOrRegion: string;
  dataCategories: string;
  role: SubprocessorRole;
  alwaysUsed: boolean;
  notes?: string;
};

/**
 * Canonical inventory shared by /subprocessors and DPA Annex III.
 * Mollie is listed for transparency; payment data is processed as PSP (not MoR).
 */
export const SUBPROCESSOR_INVENTORY: readonly SubprocessorEntry[] = [
  {
    provider: "Supabase",
    purpose: "Database, authentication, file storage, and related backend services",
    locationOrRegion: "EU-capable regions (as configured for the production project)",
    dataCategories: "Account, workspace, operational, and authentication data",
    role: "PROCESSOR",
    alwaysUsed: true,
  },
  {
    provider: "Vercel",
    purpose: "Application hosting, edge delivery, and deployment runtime",
    locationOrRegion: "As configured for the production deployment",
    dataCategories: "Request metadata, application runtime data, logs as configured",
    role: "PROCESSOR",
    alwaysUsed: true,
  },
  {
    provider: "Mollie",
    purpose: "Payment processing for subscription billing (PSP only; not Merchant of Record)",
    locationOrRegion: "EEA (Mollie as payment service provider)",
    dataCategories: "Payment and billing transaction data necessary to process charges",
    role: "PSP_INDEPENDENT",
    alwaysUsed: true,
    notes: "Auroranexis remains the contractual seller for SaaS subscriptions.",
  },
  {
    provider: "Transactional email (SMTP / STRATO or Resend when configured)",
    purpose: "Transactional product and billing email delivery",
    locationOrRegion: "As configured for the production SMTP / email provider",
    dataCategories: "Email addresses and message content for transactional mail",
    role: "PROCESSOR",
    alwaysUsed: true,
    notes: "Production path uses SMTP (e.g. STRATO); Resend may be used when configured.",
  },
  {
    provider: "Sentry",
    purpose: "Application error monitoring when configured",
    locationOrRegion: "As configured for the monitoring project",
    dataCategories: "Error reports, stack traces, limited request context",
    role: "CONDITIONAL_PROCESSOR",
    alwaysUsed: false,
  },
  {
    provider: "Website analytics (e.g. Plausible, Microsoft Clarity, PostHog)",
    purpose: "Consent-gated website analytics where enabled",
    locationOrRegion: "As configured per analytics provider",
    dataCategories: "Pseudonymous usage / interaction data under consent",
    role: "OPTIONAL_ANALYTICS",
    alwaysUsed: false,
    notes: "Only when the customer or visitor has consented where required.",
  },
  {
    provider: "OpenAI (optional)",
    purpose: "AI-assisted features when explicitly enabled and configured in the workspace",
    locationOrRegion: "As configured for the AI provider integration",
    dataCategories: "Prompts and related content submitted to optional AI features",
    role: "CONDITIONAL_PROCESSOR",
    alwaysUsed: false,
    notes: "Not used unless the Controller enables AI features.",
  },
] as const;

/** Plain-text block for legal page sections / Annex III. */
export function formatSubprocessorInventoryPlainText(): string {
  return SUBPROCESSOR_INVENTORY.map((entry) => {
    const roleLabel =
      entry.role === "PSP_INDEPENDENT"
        ? "Payment service provider (transparency listing)"
        : entry.role === "OPTIONAL_ANALYTICS"
          ? "Optional analytics (consent-gated)"
          : entry.role === "CONDITIONAL_PROCESSOR"
            ? "Conditional processor"
            : "Processor";
    const usage = entry.alwaysUsed ? "Always used for the Service" : "Conditional / optional";
    const note = entry.notes ? ` Note: ${entry.notes}` : "";
    return `${entry.provider} — ${entry.purpose}. Role: ${roleLabel}. Usage: ${usage}. Location/region: ${entry.locationOrRegion}. Data: ${entry.dataCategories}.${note}`;
  }).join("\n\n");
}

export function subprocessorsChangeContactLine(): string {
  return `Sub-processor and DPA inquiries: ${COMPANY_CONTACT.legalEmail}. Support: ${COMPANY_CONTACT.supportEmail}.`;
}
