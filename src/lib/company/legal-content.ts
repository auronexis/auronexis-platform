import {
  COMPANY_CONTACT,
  COMPANY_INFORMATION,
  formatContentResponsibleLine,
  formatLegalContactLine,
  formatProviderInlineReference,
  formatProviderShortReference,
  formatSupportContactLine,
  formatVatLine,
  LEGAL_LAST_UPDATED,
} from "@/lib/company";

export type LegalPageKey =
  | "imprint"
  | "privacy"
  | "terms"
  | "cookies"
  | "securityPolicy"
  | "subprocessors"
  | "dataProcessingAgreement"
  | "acceptableUse"
  | "refundPolicy";

export type LegalPageContent = {
  title: string;
  description: string;
  lastUpdated: string;
  showCompanyCard?: boolean;
  companyCardTitle?: string;
  sections: Array<{ heading: string; body: string }>;
};

const { productName, legalName } = COMPANY_INFORMATION;

export const LEGAL_PAGES: Record<LegalPageKey, LegalPageContent> = {
  imprint: {
    title: "Imprint (Legal Notice)",
    description:
      "Provider identification under § 5 DDG (Digitale-Dienste-Gesetz) for the Auroranexis platform.",
    lastUpdated: LEGAL_LAST_UPDATED,
    showCompanyCard: true,
    companyCardTitle: "Provider identification",
    sections: [
      {
        heading: "Platform",
        body: `${legalName} operates the B2B SaaS platform “${productName}” for agencies, MSPs, and service providers. Contracts are offered exclusively to entrepreneurs within the meaning of § 14 BGB.`,
      },
      {
        heading: "VAT identification",
        body: `${formatVatLine()} pursuant to § 27a UStG.`,
      },
      {
        heading: "Responsible for content",
        body: `Responsible for content under § 18 para. 2 MStV (Medienstaatsvertrag):\n${formatContentResponsibleLine()}`,
      },
      {
        heading: "EU dispute resolution",
        body:
          "The European Commission provides an online dispute resolution platform: https://ec.europa.eu/consumers/odr. We are not obliged and generally not willing to participate in dispute resolution proceedings before a consumer arbitration board because our services are directed exclusively at business customers.",
      },
      {
        heading: "Liability for content and links",
        body:
          "As a service provider we are responsible for our own content on these pages under § 7 para. 1 DDG and general laws. We are not obliged to monitor transmitted or stored third-party information. Upon becoming aware of legal violations we remove such content promptly. External links were reviewed at the time of linking; we assume no liability for external content.",
      },
      {
        heading: "Contact",
        body: `${formatSupportContactLine()}\n${formatLegalContactLine()}\nPhone: ${COMPANY_CONTACT.phone}`,
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    description: `How ${legalName} processes personal data when you use the ${productName} B2B SaaS platform.`,
    lastUpdated: LEGAL_LAST_UPDATED,
    showCompanyCard: true,
    companyCardTitle: "Data controller",
    sections: [
      {
        heading: "Scope",
        body: `This Privacy Policy applies to workspace users, invited team members, and authorized client portal users of the ${productName} platform. Our services are offered exclusively to business customers (entrepreneurs within the meaning of § 14 BGB). This policy describes processing under the GDPR and applicable German data protection law.`,
      },
      {
        heading: "Categories of data processed",
        body:
          "We process: account and profile data (name, email, role, organization); operational data you enter (clients, reports, risks, incidents, knowledge, automation configurations); usage, audit, and security logs; billing and subscription identifiers processed via Paddle, our Merchant of Record; connector and integration tokens (stored encrypted); support communications; and, where enabled, inputs/outputs for AI-assisted features.",
      },
      {
        heading: "Purposes and legal bases",
        body:
          "Processing occurs to provide the SaaS contract (Art. 6(1)(b) GDPR), for billing and account administration (Art. 6(1)(b) and (1)(f) GDPR), for security and fraud prevention (Art. 6(1)(f) GDPR), for compliance with legal obligations (Art. 6(1)(c) GDPR), and — where applicable — based on your consent for optional analytics or marketing (Art. 6(1)(a) GDPR). Where you act as controller for your clients' data, we process on your instructions as processor (see our DPA).",
      },
      {
        heading: "Retention",
        body:
          "We retain personal data for the duration of the subscription and as required for support, billing records, security logs, and legal retention obligations. Deletion or return of customer data follows contract termination and your offboarding instructions, subject to statutory retention periods.",
      },
      {
        heading: "Sub-processors and transfers",
        body:
          "We use sub-processors listed on our Sub-processors page (including Supabase, Vercel, Paddle, Resend, and optional AI providers when enabled). Transfers outside the EEA, if any, rely on appropriate safeguards such as Standard Contractual Clauses. Material sub-processor changes are communicated to workspace administrators with reasonable notice.",
      },
      {
        heading: "Your rights",
        body:
          `Data subjects may have rights of access, rectification, erasure, restriction, portability, and objection, and the right to lodge a complaint with a supervisory authority. Workspace administrators can manage GDPR requests in the Compliance center where available. Contact us at ${COMPANY_CONTACT.legalEmail}. We respond within statutory timeframes.`,
      },
      {
        heading: "Analytics and consent",
        body:
          "On the public website, optional analytics tools (such as Plausible, Microsoft Clarity, or PostHog where configured) load only if you grant analytics consent. Marketing conversion tools (such as GA4 where explicitly enabled) load only if you grant marketing consent. You can change preferences via the cookie banner or footer link. Inside the authenticated application, operational logging and security monitoring may occur separately as described in this policy and our Security Policy.",
      },
      {
        heading: "Security",
        body:
          "We implement technical and organizational measures described in our Security Policy, including encryption in transit, access controls, tenant isolation, and audit logging.",
      },
      {
        heading: "Contact",
        body: `Data protection inquiries: ${COMPANY_CONTACT.legalEmail}. Product support: ${COMPANY_CONTACT.supportEmail}. Security reports: ${COMPANY_CONTACT.securityEmail}.`,
      },
    ],
  },
  terms: {
    title: "Terms of Service (AGB)",
    description: `General Terms and Conditions for business use of the ${productName} B2B SaaS platform operated by ${legalName}.`,
    lastUpdated: LEGAL_LAST_UPDATED,
    showCompanyCard: true,
    companyCardTitle: "Provider",
    sections: [
      {
        heading: "1. Scope",
        body: `These General Terms and Conditions ("Terms", "AGB") govern the use of the ${productName} platform and related services provided by ${formatProviderInlineReference()} ("Provider", "we", "us"). They apply to all contracts between the Provider and the customer organization ("Customer", "you"). Conflicting or deviating terms of the Customer apply only if expressly accepted in writing.`,
      },
      {
        heading: "2. Provider",
        body: "The Provider is identified in the company information section above.",
      },
      {
        heading: "3. B2B-only customers",
        body:
          "The platform and all services are offered exclusively to entrepreneurs within the meaning of § 14 BGB (German Civil Code). Contracts with consumers within the meaning of § 13 BGB are excluded. By registering, purchasing, or using the platform, you confirm that you act in a business capacity and that authorized signatories have authority to bind your organization. We may request reasonable evidence of business status.",
      },
      {
        heading: "4. Contract formation",
        body:
          "A contract is formed when you complete registration and accept these Terms, or when you purchase a paid plan and payment is successfully initiated. Order confirmations, workspace provisioning, or access credentials constitute acceptance. Individual quotes, pilot agreements, or enterprise order forms prevail over these Terms where they expressly deviate.",
      },
      {
        heading: "5. User accounts and workspace",
        body:
          "Each Customer receives an organization workspace. You are responsible for accurate registration data, safeguarding credentials, assigning roles appropriately, and all activity under your accounts. You must notify us promptly of unauthorized access. We may require multi-factor authentication or additional verification for security.",
      },
      {
        heading: "6. Services and availability",
        body: `${productName} provides a multi-tenant B2B operations platform including client management, reporting, risk and incident tracking, knowledge base, automation, monitoring, integrations, billing management, and optional AI-assisted analytics, subject to your subscription plan and feature entitlements. We strive for high availability but do not guarantee uninterrupted or error-free operation. Maintenance windows, updates, and third-party outages may affect availability. Status information may be published on our status page where available.`,
      },
      {
        heading: "7. AI, analytics, and decision-support",
        body:
          "The platform may generate health scores, executive insights, forecasts, risk analyses, recommendations, reports, and dashboard intelligence. All such outputs are decision-support tools only. They may depend on the quality, completeness, and timeliness of data you provide. We do not guarantee accuracy, completeness, business success, revenue increase, legal compliance, or elimination of operational risk. You remain solely responsible for business, legal, tax, financial, medical, and compliance decisions. Verify important outputs before relying on them. AI features may be plan-gated and subject to usage limits.",
      },
      {
        heading: "8. Customer obligations",
        body:
          "You must: (a) comply with applicable law; (b) ensure you have a valid legal basis to process personal data you upload; (c) configure access controls appropriately; (d) maintain accurate billing and contact information; (e) use the platform only within subscription limits; (f) not expose credentials or API keys; and (g) inform your end users and client portal users of your own privacy obligations where required.",
      },
      {
        heading: "9. Acceptable use",
        body:
          "Use of the platform is subject to our Acceptable Use Policy, incorporated by reference. Violations may result in suspension or termination.",
      },
      {
        heading: "10. Subscription plans",
        body:
          "Features, usage limits, and entitlements depend on the plan selected. Plan descriptions on the pricing page and in your workspace settings are authoritative. Enterprise or pilot arrangements may include custom limits documented separately.",
      },
      {
        heading: "11. Prices, payment, invoices, and taxes",
        body:
          "Listed self-serve plans: Professional €149/month; Business €499/month; Enterprise from €1,499/month subject to individual quotation. Prices shown at checkout and in billing settings apply. Applicable taxes (including VAT where required) are calculated and displayed by Paddle at checkout. Invoices or receipts are issued electronically by Paddle, our Merchant of Record. You authorize recurring charges for subscription plans until cancelled. Failed payments may lead to service restriction after reasonable notice.",
      },
      {
        heading: "11a. Paddle as Merchant of Record",
        body:
          "For purchases completed through Paddle Checkout, Paddle acts as Merchant of Record and authorized reseller for the payment transaction. The buyer purchases through Paddle while Auroranexis supplies and licenses software access. Paddle's Buyer Terms, checkout terms, privacy notice, and Refund Policy govern payment processing, Paddle-handled taxes, payment methods, refunds, and mandatory buyer rights for those transactions. These Terms continue to govern use of Auroranexis. Paddle Buyer Terms: https://www.paddle.com/legal/checkout-buyer-terms — Paddle Refund Policy: https://www.paddle.com/legal/refund-policy.",
      },
      {
        heading: "12. Upgrades, downgrades, and renewal",
        body:
          "Upgrades take effect according to the workflow shown in billing settings and the active checkout provider. Downgrades may take effect at the next billing period unless otherwise stated at checkout. Subscriptions renew automatically for the selected billing interval unless cancelled before the renewal date. The customer portal and billing settings are the primary source for managing subscriptions where available.",
      },
      {
        heading: "13. Cancellation and termination",
        body:
          "You may cancel future renewals via billing settings or the Paddle customer portal where available, or by contacting support. Cancellation stops future billing cycles; it does not retroactively refund an already-started billing period unless mandatory law requires otherwise or we expressly agree in writing. We may terminate for material breach, non-payment after notice, illegal use, or security risk, subject to applicable law. Upon termination, access ends at the end of the paid period or immediately where legally permitted for cause.",
      },
      {
        heading: "14. Refunds and withdrawal rights",
        body:
          `Refund and cancellation details are published in our Refund and Cancellation Policy at /refund-policy. Statutory consumer withdrawal rights under §§ 312g, 355 BGB do not apply where services are directed exclusively at entrepreneurs; where a buyer qualifies as a consumer and mandatory law applies, statutory rights remain unaffected. For Paddle-processed purchases, Paddle's Buyer Terms and Refund Policy also apply. For billing errors or material service issues, contact ${COMPANY_CONTACT.supportEmail}. Cancellation prevents future renewals and is distinct from a refund.`,
      },
      {
        heading: "15. Data protection and DPA",
        body:
          `Personal data is processed as described in our Privacy Policy. Where you process personal data of your clients or staff in the workspace, you are typically the controller and we act as processor. Our Data Processing Agreement (DPA) applies and may be supplemented by a signed addendum for enterprise customers. Contact ${COMPANY_CONTACT.legalEmail} for DPA requests.`,
      },
      {
        heading: "16. Confidentiality",
        body:
          "Each party will treat non-public information of the other party as confidential and use it only to perform the contract, except where disclosure is required by law or to professional advisers bound by confidentiality.",
      },
      {
        heading: "17. Intellectual property",
        body:
          "We retain all rights in the platform, software, documentation, branding, and underlying technology. You receive a non-exclusive, non-transferable right to use the platform during the subscription term within agreed limits. You retain ownership of data you upload. You grant us the rights necessary to host, process, back up, and display your data to provide the services.",
      },
      {
        heading: "18. Third-party services",
        body:
          "The platform integrates third-party services (e.g., Paddle, Supabase, Vercel, connectors, optional AI providers). Their terms and privacy policies apply to their services. We are not responsible for third-party outages, API changes, or data handling outside our control, except where mandatory law provides otherwise.",
      },
      {
        heading: "19. Service changes",
        body:
          "We may develop the platform, add or modify features, or adjust non-material documentation. Material adverse changes to core functionality for paid plans will be communicated with reasonable notice where practicable. Continued use after the effective date constitutes acceptance unless termination rights apply under mandatory law.",
      },
      {
        heading: "20. Suspension",
        body:
          "We may suspend access temporarily for maintenance, security incidents, suspected misuse, non-payment after notice, or legal compliance. We will use reasonable efforts to notify workspace owners in advance where possible, except where immediate action is required.",
      },
      {
        heading: "21. Warranty and service defects",
        body:
          "For entrepreneurs, statutory warranty rights are limited as permitted by law. We provide the platform in accordance with the service description for the selected plan. Non-material defects, browser compatibility issues caused by unsupported configurations, or problems arising from customer systems, integrations, or data quality do not constitute a defect if the core service remains usable. Remedies for valid defects are repair or replacement (re-performance) where reasonable, or termination and refund of prepaid fees for the unused portion where mandatory law requires.",
      },
      {
        heading: "22. Limitation of liability",
        body:
          "We are liable without limitation for intent (Vorsatz) and gross negligence (grosse Fahrlässigkeit), for injury to life, body, or health, under the Produkthaftungsgesetz (Product Liability Act), and for mandatory statutory liability. For simple negligence (einfache Fahrlässigkeit), we are liable only for breach of essential contractual obligations (Kardinalpflichten), limited to foreseeable, typical contract damage. We are not liable — where legally permissible — for indirect damage, lost profits, loss of data, business interruption, reputational harm, or consequential damages. We are not liable for customer misuse, incorrect or incomplete customer data, reliance on non-binding AI or analytics output, third-party service failures, unavailable integrations, force majeure, or unauthorized access caused by your failure to secure credentials. Nothing in these Terms excludes liability that cannot be excluded under German law.",
      },
      {
        heading: "23. Force majeure",
        body:
          "Neither party is liable for failure or delay due to events beyond reasonable control, including natural disasters, war, terrorism, labor disputes, government actions, widespread internet or cloud outages, or failures of third-party infrastructure not caused by the affected party's negligence.",
      },
      {
        heading: "24. Export control and sanctions",
        body:
          "You must comply with applicable export control, sanctions, and trade restrictions (including EU, German, US, and UK regimes where applicable). You may not use the platform if prohibited by sanctions law or if you are on restricted party lists. You are responsible for ensuring lawful use in your jurisdiction.",
      },
      {
        heading: "25. International customers",
        body:
          "Business customers may access the platform from Germany, the EU/EEA, the UK, Switzerland, the USA, and other countries. You are responsible for ensuring your use complies with mandatory laws applicable to you. These Terms are governed by German law to the extent legally permissible; mandatory protections of other jurisdictions that cannot be derogated from remain unaffected.",
      },
      {
        heading: "26. Governing law",
        body:
          "These Terms and all contractual relationships are governed by the laws of the Federal Republic of Germany, excluding the UN Convention on Contracts for the International Sale of Goods (CISG). Mandatory statutory provisions that cannot be derogated from remain unaffected.",
      },
      {
        heading: "27. Jurisdiction",
        body: `If the Customer is a merchant (Kaufmann), a legal entity under public law, or a special fund under public law, the exclusive place of jurisdiction for all disputes arising from or in connection with these Terms is — where legally permissible — the courts at the Provider's registered business location in ${COMPANY_INFORMATION.city}, Germany. We may also bring claims at the Customer's general place of jurisdiction where permitted by law.`,
      },
      {
        heading: "28. Severability and contact",
        body:
          `If any provision is invalid or unenforceable, the remaining provisions remain in effect; the invalid provision shall be replaced by a valid one closest to the economic intent. Contract language: English; German translations may be provided for convenience. Legal inquiries: ${COMPANY_CONTACT.legalEmail}. Support: ${COMPANY_CONTACT.supportEmail}. Sales and enterprise agreements: ${COMPANY_CONTACT.salesEmail}.`,
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    description: `Information about cookies and similar technologies used on the ${productName} platform.`,
    lastUpdated: LEGAL_LAST_UPDATED,
    showCompanyCard: true,
    companyCardTitle: "Controller",
    sections: [
      {
        heading: "Essential cookies and storage",
        body:
          "We use session cookies and similar technologies required for authentication (Supabase Auth), security, CSRF protection, and core application functionality. These cannot be disabled while using the logged-in platform.",
      },
      {
        heading: "Preferences",
        body:
          "Appearance and UI preferences (such as theme or compact layout) may be stored in localStorage on your device. This data stays on your device and is not used for tracking.",
      },
      {
        heading: "Analytics (where enabled)",
        body:
          "If analytics consent is granted, we may load privacy-aware analytics tools configured for the public website — such as Plausible Analytics (cookieless/privacy-oriented usage measurement), Microsoft Clarity (session insights), or PostHog (product analytics). These tools load only after you accept analytics cookies in the consent banner. If not configured or not consented, they do not run.",
      },
      {
        heading: "Marketing measurement (where enabled)",
        body:
          "If marketing consent is granted and explicitly configured, Google Analytics 4 (GA4) or similar conversion tools may be used to measure signup and pricing funnel performance. GA4 is not enabled by default.",
      },
      {
        heading: "Consent management",
        body:
          "Non-essential cookies and scripts remain off until you choose Accept all or enable categories in Cookie preferences. You can reopen preferences at any time from the footer or this policy. Essential cookies cannot be disabled while using authenticated features.",
      },
      {
        heading: "Legal basis",
        body:
          "Essential cookies are used based on legitimate interests and contractual necessity (Art. 6(1)(b) and (1)(f) GDPR). Optional analytics and marketing tools, where enabled, rely on your consent (Art. 6(1)(a) GDPR) via the consent banner.",
      },
      {
        heading: "Contact",
        body: `Cookie and privacy questions: ${COMPANY_CONTACT.legalEmail}. Product support: ${COMPANY_CONTACT.supportEmail}.`,
      },
    ],
  },
  securityPolicy: {
    title: "Security Policy",
    description: `Security practices and responsible disclosure for the ${productName} platform operated by ${legalName}.`,
    lastUpdated: LEGAL_LAST_UPDATED,
    sections: [
      {
        heading: "Scope",
        body: `${formatProviderShortReference()} maintains administrative, technical, and organizational measures appropriate for a B2B SaaS platform processing customer operational data.`,
      },
      {
        heading: "Encryption and access control",
        body:
          "Data is encrypted in transit using TLS. Access to production systems is limited to authorized personnel on a need-to-know basis with role-based controls, authentication requirements, and audit logging. Customer workspaces are logically isolated.",
      },
      {
        heading: "Monitoring and incident response",
        body:
          "We monitor for security events and maintain procedures to investigate and respond to incidents. Customers are notified of personal data breaches affecting their data without undue delay where required by law and contract.",
      },
      {
        heading: "Vulnerability reporting",
        body: `Report security vulnerabilities to ${COMPANY_CONTACT.securityEmail}. Provide sufficient detail to reproduce the issue. Do not perform destructive testing, social engineering, or physical attacks without prior written authorization. We aim to acknowledge reports within five business days.`,
      },
      {
        heading: "Certifications and attestations",
        body:
          "We align with recognized security frameworks and describe readiness for standards such as ISO 27001 where applicable. We do not claim formal certifications unless explicitly published in a current, valid attestation document.",
      },
      {
        heading: "Contact",
        body: `Security: ${COMPANY_CONTACT.securityEmail}. Legal: ${COMPANY_CONTACT.legalEmail}. Support: ${COMPANY_CONTACT.supportEmail}.`,
      },
    ],
  },
  subprocessors: {
    title: "Sub-processors",
    description: `Third-party processors engaged by ${legalName} to deliver the ${productName} platform.`,
    lastUpdated: LEGAL_LAST_UPDATED,
    sections: [
      {
        heading: "Overview",
        body: `${legalName} uses sub-processors to provide hosting, authentication, billing, email delivery, and optional AI features. This list is provided for transparency under GDPR Article 28.`,
      },
      {
        heading: "Current sub-processors",
        body:
          "Supabase — database, authentication, and storage (EU-capable regions).\nVercel — application hosting and edge delivery.\nPaddle — Merchant of Record for payment processing and subscription billing.\nResend — transactional email delivery.\nOpenAI (optional) — AI-assisted features when explicitly enabled by the customer and configured in the workspace.",
      },
      {
        heading: "International transfers",
        body:
          "Where sub-processors process data outside the EEA, we rely on appropriate safeguards such as Standard Contractual Clauses and supplementary measures where required.",
      },
      {
        heading: "Changes",
        body:
          `Material changes to sub-processors are communicated to workspace administrators with reasonable notice. Enterprise customers may request notification procedures or DPA addenda via ${COMPANY_CONTACT.legalEmail}.`,
      },
      {
        heading: "Contact",
        body: `Sub-processor and DPA inquiries: ${COMPANY_CONTACT.legalEmail}. Support: ${COMPANY_CONTACT.supportEmail}.`,
      },
    ],
  },
  dataProcessingAgreement: {
    title: "Data Processing Agreement",
    description: "Standard data processing terms for business customers under GDPR Article 28.",
    lastUpdated: LEGAL_LAST_UPDATED,
    showCompanyCard: true,
    companyCardTitle: "Processor",
    sections: [
      {
        heading: "Parties",
        body: `The Processor is identified in the company information section above. The Customer is the organization entering into the ${productName} subscription and acts as controller for customer-uploaded personal data.`,
      },
      {
        heading: "Subject matter and duration",
        body:
          "Processing relates to personal data uploaded or generated in the Auroranexis workspace for the duration of the subscription and any agreed retention period thereafter.",
      },
      {
        heading: "Nature and purpose",
        body:
          "Processing is limited to providing the Auroranexis platform, customer support, billing, security monitoring, audit logging, backups, and optional AI features enabled by the Controller. Processing occurs only on documented instructions of the Controller, these Terms, and applicable law.",
      },
      {
        heading: "Categories of data and subjects",
        body:
          "Depending on Controller use: employee and contact data, client data, operational records, portal user data, logs, and communication content. Data subjects may include Controller staff, Controller clients, and authorized portal users.",
      },
      {
        heading: "Processor obligations",
        body:
          "The Processor implements appropriate technical and organizational measures (see Security Policy), ensures confidentiality of personnel, assists with data subject requests where required, notifies the Controller of personal data breaches without undue delay, and deletes or returns data upon termination subject to legal retention.",
      },
      {
        heading: "Sub-processors",
        body:
          "The Controller authorizes engagement of sub-processors listed on our Sub-processors page. Material changes are notified with reasonable notice. The Processor remains responsible for sub-processor performance under Article 28(4) GDPR.",
      },
      {
        heading: "International transfers",
        body:
          `Transfers outside the EEA use appropriate safeguards such as Standard Contractual Clauses. Details are available on request at ${COMPANY_CONTACT.legalEmail}.`,
      },
      {
        heading: "Audits and documentation",
        body:
          "The Processor makes available information necessary to demonstrate compliance and allows audits upon reasonable notice, subject to confidentiality and security constraints, or provides third-party audit summaries where available.",
      },
      {
        heading: "Execution",
        body:
          `This page summarizes standard processing terms incorporated into the Terms of Service. Enterprise customers may request a countersigned DPA addendum via ${COMPANY_CONTACT.legalEmail} or ${COMPANY_CONTACT.salesEmail}. This summary does not replace an individually negotiated signed agreement where required.`,
      },
    ],
  },
  acceptableUse: {
    title: "Acceptable Use Policy",
    description: `Rules governing lawful and secure use of the ${productName} B2B SaaS platform.`,
    lastUpdated: LEGAL_LAST_UPDATED,
    sections: [
      {
        heading: "Scope",
        body: `This Acceptable Use Policy applies to all users of the ${productName} platform operated by ${legalName}. It supplements the Terms of Service and forms part of the contract.`,
      },
      {
        heading: "Permitted use",
        body:
          "Use the platform for lawful business operations within your subscription plan: client operations management, reporting, risk and incident tracking, automation, integrations, monitoring, and authorized client portal access.",
      },
      {
        heading: "Prohibited conduct",
        body:
          "You must not: violate applicable law or third-party rights; upload malware or malicious code; send spam or unsolicited bulk messages through the platform; attempt unauthorized access, credential stuffing, or security attacks; scrape or harvest data in violation of these Terms or applicable law; reverse engineer or decompile the platform except where mandatory law permits; circumvent plan limits, billing, metering, or security controls; resell or sublicense access without written agreement; upload unlawful personal data without a valid legal basis; use the platform for unlawful surveillance, discrimination, or harassment; process regulated high-risk data without required safeguards and legal basis; violate export control or sanctions law; commit fraud; or bypass subscription or billing restrictions.",
      },
      {
        heading: "Integrations and API use",
        body:
          "API keys and webhooks must be kept confidential. Automated access must respect rate limits and documentation. Do not use the API to build a competing service or to exfiltrate data you are not authorized to access.",
      },
      {
        heading: "Enforcement",
        body:
          `We may warn, restrict, suspend, or terminate access for violations, non-payment, or security risk. Serious violations may be reported to authorities. Report abuse to ${COMPANY_CONTACT.securityEmail} or ${COMPANY_CONTACT.legalEmail}.`,
      },
      {
        heading: "Contact",
        body: `Acceptable use questions: ${COMPANY_CONTACT.legalEmail}. Security incidents: ${COMPANY_CONTACT.securityEmail}. Support: ${COMPANY_CONTACT.supportEmail}.`,
      },
    ],
  },
  refundPolicy: {
    title: "Refund and Cancellation Policy",
    description: `Refund and cancellation rules for ${productName} subscriptions, including purchases processed by Paddle as Merchant of Record.`,
    lastUpdated: LEGAL_LAST_UPDATED,
    showCompanyCard: true,
    companyCardTitle: "Provider",
    sections: [
      {
        heading: "1. Scope",
        body: `${productName} is primarily offered to businesses, professional users, AI agencies, managed service providers, IT service providers, and enterprise organizations.\n\nPayments for subscriptions purchased through Paddle Checkout are processed by Paddle, which acts as Merchant of Record and authorized reseller for the transaction. Paddle's Buyer Terms and Refund Policy apply to payments, refunds, and mandatory buyer rights handled by Paddle.\n\nPaddle Buyer Terms: https://www.paddle.com/legal/checkout-buyer-terms\nPaddle Refund Policy: https://www.paddle.com/legal/refund-policy`,
      },
      {
        heading: "2. Business customers",
        body:
          "Unless otherwise agreed in writing or required by mandatory law, business customers do not have a statutory consumer right of withdrawal. Subscription fees already paid are generally non-refundable for the current billing period.\n\nNothing in this policy excludes rights that cannot legally be excluded.",
      },
      {
        heading: "3. Consumers",
        body:
          "Auroranexis is designed primarily for business use. Where a buyer qualifies as a consumer and mandatory consumer-protection law applies, the buyer retains all statutory withdrawal and refund rights.\n\nConsumer refund or withdrawal requests for purchases processed by Paddle are handled in accordance with Paddle's Buyer Terms, Paddle's Refund Policy, and applicable law.",
      },
      {
        heading: "4. Cancellation",
        body:
          "Customers may cancel an automatically renewing subscription through the available billing portal or by contacting support.\n\nUnless mandatory law or applicable purchase terms require otherwise, cancellation prevents the next renewal and access continues until the end of the paid billing period.\n\nCancellation is different from a refund. Canceling a subscription does not automatically refund charges already paid.",
      },
      {
        heading: "5. Billing errors and service issues",
        body:
          "Auroranexis reviews requests involving duplicate charges, incorrect charges, confirmed billing errors, unauthorized transactions, or material technical failure that prevented access to the purchased service.\n\nA review does not guarantee a refund. Where Paddle processed the payment, any approved refund is issued through Paddle.",
      },
      {
        heading: "6. Requesting assistance",
        body: `Contact support at ${COMPANY_CONTACT.supportEmail} or legal at ${COMPANY_CONTACT.legalEmail}. For purchases processed by Paddle, buyers may also use Paddle buyer support and Paddle's available cancellation/refund options.\n\nPlease provide account email, organization name, transaction reference where available, and a description of the issue. Never send full payment-card details.`,
      },
      {
        heading: "7. Changes",
        body:
          "Auroranexis may update this policy to reflect changes to the service, payment provider, or applicable requirements. The latest version is published on this page.",
      },
    ],
  },
};
