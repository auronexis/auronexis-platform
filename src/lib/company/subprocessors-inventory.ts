/**
 * Factual sub-processor / service-provider inventory for Art. 28 disclosure.
 * Derived from production architecture — no invented certifications or regions.
 *
 * Status classes:
 * - ACTIVE: used for the Service in the configured production path
 * - OPTIONAL_CONFIGURABLE: used only when explicitly enabled / consented / env-configured
 * - CODE_SUPPORTED_NOT_ACTIVE: code paths exist; not an active production dependency today
 *
 * Versioning: bump SUBPROCESSORS_DOCUMENT_VERSION when the published list changes.
 * Change procedure: docs/billing/subprocessor-change-procedure.md
 * DPA status remains READY_FOR_EXTERNAL_LEGAL_REVIEW (not lawyer-approved).
 */

import { COMPANY_CONTACT } from "@/lib/company/company-contact";

export const SUBPROCESSORS_DOCUMENT_VERSION = "subprocessors-2026-09-02-v2" as const;
export const SUBPROCESSORS_EFFECTIVE_DATE = "2026-09-02" as const;

export type SubprocessorRole =
  | "PROCESSOR"
  | "PSP_INDEPENDENT"
  | "CONDITIONAL_PROCESSOR"
  | "OPTIONAL_ANALYTICS";

/** Operational status relative to the production Auroranexis deployment. */
export type SubprocessorActivationStatus =
  | "ACTIVE"
  | "OPTIONAL_CONFIGURABLE"
  | "CODE_SUPPORTED_NOT_ACTIVE";

export type SubprocessorEntry = {
  provider: string;
  purpose: string;
  /** Region wording only when known from configuration — never invent DCs. */
  locationOrRegion: string;
  dataCategories: string;
  role: SubprocessorRole;
  alwaysUsed: boolean;
  activationStatus: SubprocessorActivationStatus;
  notes?: string;
};

/**
 * Canonical inventory shared by /subprocessors and DPA Annex III.
 * Mollie is listed for transparency; payment data is processed as PSP (not MoR).
 * Conservative: Sensitive / optional env integrations are OPTIONAL_CONFIGURABLE unless proven always-on.
 */
export const SUBPROCESSOR_INVENTORY: readonly SubprocessorEntry[] = [
  {
    provider: "Supabase",
    purpose: "Database, authentication, file storage, and related backend services",
    locationOrRegion: "EU-capable regions (as configured for the production project)",
    dataCategories: "Account, workspace, operational, and authentication data",
    role: "PROCESSOR",
    alwaysUsed: true,
    activationStatus: "ACTIVE",
  },
  {
    provider: "Vercel",
    purpose: "Application hosting, edge delivery, and deployment runtime",
    locationOrRegion: "As configured for the production deployment",
    dataCategories: "Request metadata, application runtime data, logs as configured",
    role: "PROCESSOR",
    alwaysUsed: true,
    activationStatus: "ACTIVE",
  },
  {
    provider: "Mollie",
    purpose: "Payment processing for subscription billing (PSP only; not Merchant of Record)",
    locationOrRegion: "EEA (Mollie as payment service provider)",
    dataCategories: "Payment and billing transaction data necessary to process charges",
    role: "PSP_INDEPENDENT",
    alwaysUsed: true,
    activationStatus: "ACTIVE",
    notes: "Auroranexis remains the contractual seller for SaaS subscriptions.",
  },
  {
    provider: "SMTP / STRATO (transactional email)",
    purpose: "Primary transactional product and billing email delivery when SMTP is configured",
    locationOrRegion: "As configured for the production SMTP provider (e.g. STRATO)",
    dataCategories: "Email addresses and message content for transactional mail",
    role: "PROCESSOR",
    alwaysUsed: true,
    activationStatus: "ACTIVE",
    notes: "Production path prefers native SMTP; alternate providers below are optional.",
  },
  {
    provider: "Resend",
    purpose: "Transactional email delivery when Resend is configured instead of / in addition to SMTP",
    locationOrRegion: "As configured for the Resend project",
    dataCategories: "Email addresses and message content for transactional mail",
    role: "CONDITIONAL_PROCESSOR",
    alwaysUsed: false,
    activationStatus: "OPTIONAL_CONFIGURABLE",
  },
  {
    provider: "Postmark",
    purpose: "Transactional email delivery (code-supported provider adapter)",
    locationOrRegion: "As configured if enabled",
    dataCategories: "Email addresses and message content for transactional mail",
    role: "CONDITIONAL_PROCESSOR",
    alwaysUsed: false,
    activationStatus: "CODE_SUPPORTED_NOT_ACTIVE",
    notes: "Adapter/support may exist in codebase; not treated as an active production dependency unless configured.",
  },
  {
    provider: "Mailgun",
    purpose: "Transactional email delivery (code-supported provider adapter)",
    locationOrRegion: "As configured if enabled",
    dataCategories: "Email addresses and message content for transactional mail",
    role: "CONDITIONAL_PROCESSOR",
    alwaysUsed: false,
    activationStatus: "CODE_SUPPORTED_NOT_ACTIVE",
  },
  {
    provider: "Amazon SES",
    purpose: "Transactional email delivery (code-supported provider adapter)",
    locationOrRegion: "As configured if enabled",
    dataCategories: "Email addresses and message content for transactional mail",
    role: "CONDITIONAL_PROCESSOR",
    alwaysUsed: false,
    activationStatus: "CODE_SUPPORTED_NOT_ACTIVE",
  },
  {
    provider: "Sentry",
    purpose: "Application error monitoring when configured",
    locationOrRegion: "As configured for the monitoring project",
    dataCategories: "Error reports, stack traces, limited request context (PII scrubbing applied)",
    role: "CONDITIONAL_PROCESSOR",
    alwaysUsed: false,
    activationStatus: "OPTIONAL_CONFIGURABLE",
  },
  {
    provider: "Google Analytics 4 (GA4)",
    purpose: "Consent-gated marketing / conversion analytics when Measurement ID is configured",
    locationOrRegion: "As configured for the GA4 property",
    dataCategories: "Pseudonymous usage / conversion events under marketing consent",
    role: "OPTIONAL_ANALYTICS",
    alwaysUsed: false,
    activationStatus: "OPTIONAL_CONFIGURABLE",
    notes: "Client tags and server Measurement Protocol require marketing consent (fail-closed).",
  },
  {
    provider: "PostHog",
    purpose: "Consent-gated product analytics when configured",
    locationOrRegion: "As configured (EU host preferred when set)",
    dataCategories: "Pseudonymous product usage events under analytics consent",
    role: "OPTIONAL_ANALYTICS",
    alwaysUsed: false,
    activationStatus: "OPTIONAL_CONFIGURABLE",
  },
  {
    provider: "Plausible",
    purpose: "Consent-gated website analytics when configured",
    locationOrRegion: "As configured for the Plausible site",
    dataCategories: "Pseudonymous pageview / interaction data under analytics consent",
    role: "OPTIONAL_ANALYTICS",
    alwaysUsed: false,
    activationStatus: "OPTIONAL_CONFIGURABLE",
  },
  {
    provider: "Microsoft Clarity",
    purpose: "Consent-gated session analytics when configured",
    locationOrRegion: "As configured for the Clarity project",
    dataCategories: "Pseudonymous interaction / session data under analytics consent",
    role: "OPTIONAL_ANALYTICS",
    alwaysUsed: false,
    activationStatus: "OPTIONAL_CONFIGURABLE",
  },
  {
    provider: "OpenAI",
    purpose: "Generative AI features when explicitly enabled and configured",
    locationOrRegion: "As configured for the AI provider integration",
    dataCategories: "Prompts and related content submitted to optional AI features",
    role: "CONDITIONAL_PROCESSOR",
    alwaysUsed: false,
    activationStatus: "OPTIONAL_CONFIGURABLE",
    notes: "Not used unless AI features are enabled for the workspace / platform configuration.",
  },
  {
    provider: "Anthropic",
    purpose: "Optional generative AI provider path when configured",
    locationOrRegion: "As configured if enabled",
    dataCategories: "Prompts and related content submitted to optional AI features",
    role: "CONDITIONAL_PROCESSOR",
    alwaysUsed: false,
    activationStatus: "CODE_SUPPORTED_NOT_ACTIVE",
    notes: "Provider path may exist; treat as not active unless production credentials are configured.",
  },
  {
    provider: "Azure OpenAI",
    purpose: "Optional generative AI provider path when configured",
    locationOrRegion: "As configured if enabled",
    dataCategories: "Prompts and related content submitted to optional AI features",
    role: "CONDITIONAL_PROCESSOR",
    alwaysUsed: false,
    activationStatus: "CODE_SUPPORTED_NOT_ACTIVE",
  },
] as const;

function activationLabel(status: SubprocessorActivationStatus): string {
  switch (status) {
    case "ACTIVE":
      return "ACTIVE";
    case "OPTIONAL_CONFIGURABLE":
      return "OPTIONAL / CONFIGURABLE";
    case "CODE_SUPPORTED_NOT_ACTIVE":
      return "CODE-SUPPORTED / NOT ACTIVE";
    default:
      return status;
  }
}

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
    return `${entry.provider} — ${entry.purpose}. Role: ${roleLabel}. Activation: ${activationLabel(entry.activationStatus)}. Usage: ${usage}. Location/region: ${entry.locationOrRegion}. Data: ${entry.dataCategories}.${note}`;
  }).join("\n\n");
}

export function subprocessorsChangeContactLine(): string {
  return `Sub-processor and DPA inquiries: ${COMPANY_CONTACT.legalEmail}. Support: ${COMPANY_CONTACT.supportEmail}.`;
}
