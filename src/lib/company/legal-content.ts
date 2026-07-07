import { COMPANY_NAME, SALES_EMAIL, SECURITY_EMAIL, SUPPORT_EMAIL } from "@/lib/company/contact";

export type LegalPageKey =
  | "imprint"
  | "privacy"
  | "terms"
  | "cookies"
  | "securityPolicy"
  | "subprocessors"
  | "dataProcessingAgreement"
  | "acceptableUse";

export type LegalPageContent = {
  title: string;
  description: string;
  lastUpdated: string;
  sections: Array<{ heading: string; body: string }>;
};

export const LEGAL_PAGES: Record<LegalPageKey, LegalPageContent> = {
  imprint: {
    title: "Imprint",
    description: "Legal disclosure and company information.",
    lastUpdated: "July 2026",
    sections: [
      {
        heading: "Service provider",
        body: `${COMPANY_NAME} operates the Auroranexis platform — a B2B SaaS Operations Command Center for agencies, MSPs, and service providers.`,
      },
      {
        heading: "Contact",
        body: `General inquiries and product support: ${SUPPORT_EMAIL}. Sales and partnerships: ${SALES_EMAIL}. Security reports: ${SECURITY_EMAIL}.`,
      },
      {
        heading: "Legal and regulatory",
        body: "Registered company details, VAT identification, and trade register information are provided to customers, partners, and authorities upon request. Contact legal@auroranexis.com for imprint requests in German (Impressum) or English.",
      },
      {
        heading: "Responsible for content",
        body: `${COMPANY_NAME} — platform content is provided for operational use by registered workspace members and authorized client portal users. External marketing pages describe product capabilities and do not constitute operational advice.`,
      },
      {
        heading: "Dispute resolution",
        body: "The European Commission provides a platform for online dispute resolution (ODR): https://ec.europa.eu/consumers/odr. We are not obliged or willing to participate in dispute resolution proceedings before a consumer arbitration board unless required by law.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    description: "How we collect, use, and protect personal data.",
    lastUpdated: "June 2025",
    sections: [
      {
        heading: "Overview",
        body: `${COMPANY_NAME} processes personal data to provide the Auroranexis SaaS platform, customer support, billing, and security operations. This policy applies to workspace users and client portal users.`,
      },
      {
        heading: "Data we process",
        body: "Account data (name, email, organization), operational data you enter (clients, reports, risks, incidents), usage and audit logs, billing identifiers via Stripe, and connector tokens stored encrypted at rest.",
      },
      {
        heading: "Your rights",
        body: "Depending on your jurisdiction you may request access, correction, export, or deletion. Workspace administrators can manage GDPR requests in the Compliance center. Contact privacy@auroranexis.com or use in-app GDPR tooling.",
      },
      {
        heading: "Sub-processors",
        body: "We use Supabase (database and auth), Vercel (hosting), Stripe (billing), Resend (email delivery), and optional OpenAI (AI features when enabled). A current sub-processor list is available on request.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    description: "Terms governing use of the Auroranexis platform.",
    lastUpdated: "June 2025",
    sections: [
      {
        heading: "Acceptance",
        body: `By creating an account or using ${COMPANY_NAME}, you agree to these Terms on behalf of yourself and your organization.`,
      },
      {
        heading: "Service",
        body: "Auroranexis provides a multi-tenant operations workspace including reporting, risk and incident tracking, automation, integrations, and optional AI-assisted features subject to your subscription plan.",
      },
      {
        heading: "Acceptable use",
        body: "You must not misuse the platform, attempt unauthorized access, upload malicious content, or use the service in violation of applicable law. You are responsible for data you store and share with your clients via the portal.",
      },
      {
        heading: "Billing",
        body: "Paid plans are billed via Stripe. Fees, renewal, and cancellation terms are shown at checkout and in your billing settings. Pilot discounts apply only for the agreed pilot period.",
      },
      {
        heading: "Limitation of liability",
        body: "The service is provided as-is during pilot and early access periods. Liability is limited to the extent permitted by applicable law. Contact legal@auroranexis.com for enterprise agreements.",
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    description: "Cookies and similar technologies used on Auroranexis.",
    lastUpdated: "June 2025",
    sections: [
      {
        heading: "Essential cookies",
        body: "We use session cookies for authentication (Supabase Auth) and security. These are required for the application to function.",
      },
      {
        heading: "Preferences",
        body: "Appearance preferences (theme, compact mode) may be stored in localStorage on your device.",
      },
      {
        heading: "Analytics",
        body: "When enabled, PostHog may set analytics cookies to understand product usage. You can disable analytics by not configuring PostHog in your deployment or by browser controls where applicable.",
      },
      {
        heading: "Contact",
        body: `Questions about cookies: ${SUPPORT_EMAIL}.`,
      },
    ],
  },
  securityPolicy: {
    title: "Security Policy",
    description: "Security practices and responsible disclosure for Auroranexis.",
    lastUpdated: "June 2026",
    sections: [
      {
        heading: "Scope",
        body: `${COMPANY_NAME} maintains administrative, technical, and organizational measures appropriate for a B2B SaaS platform processing customer operational data.`,
      },
      {
        heading: "Encryption and access",
        body: "Data is encrypted in transit via TLS. Access to production systems is restricted to authorized personnel with role-based controls and audit logging.",
      },
      {
        heading: "Vulnerability reporting",
        body: `Report security issues to ${SECURITY_EMAIL}. We aim to acknowledge reports within 5 business days. Do not perform destructive testing without written approval.`,
      },
      {
        heading: "Certifications",
        body: "We describe readiness for frameworks such as SOC 2 and ISO 27001 and align with ISO 27001 principles where applicable. We do not claim certifications unless explicitly published in a current attestation.",
      },
    ],
  },
  subprocessors: {
    title: "Sub-processors",
    description: "Third-party processors used to deliver the Auroranexis platform.",
    lastUpdated: "June 2026",
    sections: [
      {
        heading: "Current sub-processors",
        body: "Supabase (database, authentication, storage — EU-capable regions), Vercel (application hosting), Stripe (billing), Resend (transactional email), optional OpenAI (AI features when enabled by customer).",
      },
      {
        heading: "Updates",
        body: "Material changes to sub-processors will be communicated to workspace administrators with reasonable notice. Enterprise customers may request a DPA addendum.",
      },
      {
        heading: "Contact",
        body: `Sub-processor inquiries: ${SUPPORT_EMAIL}.`,
      },
    ],
  },
  dataProcessingAgreement: {
    title: "Data Processing Agreement",
    description: "Data processing terms for business customers (Germany/EU).",
    lastUpdated: "July 2026",
    sections: [
      {
        heading: "Roles",
        body: "Customer acts as controller for client and operational data entered into the workspace. Auroranexis acts as processor when handling that data on the customer's documented instructions.",
      },
      {
        heading: "Processing purpose and instructions",
        body: "Processing is limited to providing the Auroranexis platform, customer support, billing, security monitoring, audit logging, and optional AI features explicitly enabled by the customer. We process personal data only as instructed by the customer agreement and applicable law.",
      },
      {
        heading: "Security measures",
        body: "We implement administrative, technical, and organizational measures including encryption in transit, role-based access controls, tenant isolation, audit trails, and vulnerability management. Details are described in our Security Policy.",
      },
      {
        heading: "Sub-processors and transfers",
        body: "Sub-processors are listed on our Sub-processors page. Material changes are communicated to workspace administrators with reasonable notice. Transfers outside the EEA, if any, use appropriate safeguards such as Standard Contractual Clauses.",
      },
      {
        heading: "Data subject requests and breach notification",
        body: "We assist customers in responding to data subject requests where required. We notify customers without undue delay after becoming aware of a personal data breach affecting customer data, in line with applicable law and the signed agreement.",
      },
      {
        heading: "Retention and deletion",
        body: "Customer data is retained for the subscription term and deleted or returned according to the agreement and customer offboarding instructions, subject to legal retention obligations.",
      },
      {
        heading: "Execution",
        body: `Enterprise and pilot customers may request a countersigned DPA via ${SALES_EMAIL}. This page summarizes standard processing terms and does not replace a signed Data Processing Agreement.`,
      },
    ],
  },
  acceptableUse: {
    title: "Acceptable Use Policy",
    description: "Rules for acceptable use of the Auroranexis platform.",
    lastUpdated: "June 2026",
    sections: [
      {
        heading: "Permitted use",
        body: "Use the platform for lawful business operations, client reporting, automation, and integrations within your subscription limits.",
      },
      {
        heading: "Prohibited use",
        body: "Do not attempt unauthorized access, distribute malware, scrape in violation of terms, resell access without agreement, or store unlawful content.",
      },
      {
        heading: "Enforcement",
        body: `${COMPANY_NAME} may suspend accounts that violate this policy or applicable law. Report abuse to ${SECURITY_EMAIL}.`,
      },
    ],
  },
};
